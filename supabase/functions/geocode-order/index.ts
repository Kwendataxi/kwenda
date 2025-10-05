import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, orderType } = await req.json();
    
    if (!orderId || !orderType) {
      throw new Error('orderId and orderType required');
    }

    if (!['transport', 'delivery'].includes(orderType)) {
      throw new Error('orderType must be "transport" or "delivery"');
    }

    console.log(`🗺️ Geocoding ${orderType} order: ${orderId}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY not configured');
    }

    // Récupérer la commande
    const tableName = orderType === 'transport' ? 'transport_bookings' : 'delivery_orders';
    const { data: order, error: fetchError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('Order not found:', fetchError);
      throw new Error('Order not found');
    }

    console.log('📍 Pickup address:', order.pickup_location);
    
    // Géocoder pickup
    const pickupResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(order.pickup_location)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const pickupData = await pickupResponse.json();

    if (pickupData.status !== 'OK' || !pickupData.results[0]) {
      console.error('Pickup geocoding failed:', pickupData.status);
      throw new Error(`Failed to geocode pickup address: ${pickupData.status}`);
    }

    const pickupResult = pickupData.results[0];
    const pickupCoords = {
      lat: pickupResult.geometry.location.lat,
      lng: pickupResult.geometry.location.lng
    };

    console.log('✅ Pickup geocoded:', pickupCoords);

    // Géocoder destination (transport) ou delivery (livraison)
    const destAddress = orderType === 'transport' 
      ? order.destination 
      : order.delivery_location;

    console.log('📍 Destination address:', destAddress);

    const destResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destAddress)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const destData = await destResponse.json();

    if (destData.status !== 'OK' || !destData.results[0]) {
      console.error('Destination geocoding failed:', destData.status);
      throw new Error(`Failed to geocode destination address: ${destData.status}`);
    }

    const destResult = destData.results[0];
    const destCoords = {
      lat: destResult.geometry.location.lat,
      lng: destResult.geometry.location.lng
    };

    console.log('✅ Destination geocoded:', destCoords);

    // Mettre à jour la commande
    const updateData = orderType === 'transport' 
      ? {
          pickup_coordinates: pickupCoords,
          pickup_google_address: pickupResult.formatted_address,
          pickup_google_place_id: pickupResult.place_id,
          pickup_google_place_name: pickupResult.formatted_address.split(',')[0],
          destination_coordinates: destCoords,
          destination_google_address: destResult.formatted_address,
          destination_google_place_id: destResult.place_id,
          destination_google_place_name: destResult.formatted_address.split(',')[0],
          google_geocoded_at: new Date().toISOString()
        }
      : {
          pickup_coordinates: pickupCoords,
          pickup_google_address: pickupResult.formatted_address,
          pickup_google_place_id: pickupResult.place_id,
          pickup_google_place_name: pickupResult.formatted_address.split(',')[0],
          delivery_coordinates: destCoords,
          delivery_google_address: destResult.formatted_address,
          delivery_google_place_id: destResult.place_id,
          delivery_google_place_name: destResult.formatted_address.split(',')[0],
          google_geocoded_at: new Date().toISOString()
        };

    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw updateError;
    }

    console.log('✅ Order updated with coordinates');

    return new Response(
      JSON.stringify({ 
        success: true, 
        pickup: pickupCoords, 
        destination: destCoords,
        pickupAddress: pickupResult.formatted_address,
        destinationAddress: destResult.formatted_address
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
