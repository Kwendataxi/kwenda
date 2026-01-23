import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DispatchRequest {
  rideRequestId: string;
  pickupLat: number;
  pickupLng: number;
  serviceType?: string;
  vehicleClass?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { rideRequestId, pickupLat, pickupLng, serviceType = 'taxi', vehicleClass = 'eco' }: DispatchRequest = await req.json();

    console.log('🚗 Processing ride dispatch:', { rideRequestId, pickupLat, pickupLng, serviceType, vehicleClass });

    // 1. Valider les coordonnées
    const { data: validatedCoords, error: validationError } = await supabase.rpc('validate_booking_coordinates', {
      pickup_coords: { lat: pickupLat, lng: pickupLng }
    });

    if (validationError) {
      console.error('❌ Validation error:', validationError);
      return new Response(JSON.stringify({ error: 'Invalid coordinates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const finalPickupLat = validatedCoords.pickup.lat;
    const finalPickupLng = validatedCoords.pickup.lng;

    console.log('✅ Validated coordinates:', { finalPickupLat, finalPickupLng });

    // 2. Rechercher des chauffeurs disponibles dans un rayon plus large
    const { data: drivers, error: driversError } = await supabase.rpc('find_nearby_drivers', {
      pickup_lat: finalPickupLat,
      pickup_lng: finalPickupLng,
      service_type_param: serviceType,
      radius_km: 15 // Augmenter le rayon de recherche
    });

    if (driversError) {
      console.error('❌ Driver search error:', driversError);
      return new Response(JSON.stringify({ error: 'Failed to search drivers' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Found drivers:', drivers?.length || 0);

    if (!drivers || drivers.length === 0) {
      console.log('❌ No drivers with remaining rides');
      
      await supabase
        .from('transport_bookings')
        .update({ 
          status: 'no_driver_available',
          updated_at: new Date().toISOString()
        })
        .eq('id', rideRequestId);

      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Aucun chauffeur disponible avec des courses restantes',
        availableDrivers: 0,
        reason: 'no_rides_remaining'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Found ${drivers.length} drivers with rides remaining`);
    // 3. Sélectionner le chauffeur le plus proche
    const closestDriver = drivers[0];
    
    console.log(`🎯 Assigning driver ${closestDriver.driver_id} (${closestDriver.distance_km}km away, rides_remaining: ${closestDriver.rides_remaining || 0})`);
    
    // 4. Attribuer la course au chauffeur
    const { error: assignError } = await supabase
      .from('transport_bookings')
      .update({
        driver_id: closestDriver.driver_id,
        status: 'driver_assigned',
        driver_assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', rideRequestId);

    if (assignError) {
      console.error('❌ Assignment error:', assignError);
      return new Response(JSON.stringify({ error: 'Failed to assign driver' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Marquer le chauffeur comme indisponible
    await supabase
      .from('driver_locations')
      .update({ 
        is_available: false,
        last_ping: new Date().toISOString()
      })
      .eq('driver_id', closestDriver.driver_id);

    // ✅ NOUVEAU : Consommer une course
    try {
      const { data: consumeResult, error: consumeError } = await supabase.functions.invoke('consume-ride', {
        body: {
          driver_id: closestDriver.driver_id,
          booking_id: rideRequestId,
          service_type: serviceType || 'transport'
        }
      });

      if (consumeError) {
        console.warn('⚠️ Erreur consommation course:', consumeError);
      } else {
        console.log(`✅ Course consommée. Courses restantes: ${consumeResult?.rides_remaining || 0}`);
      }
    } catch (consumeErr) {
      console.error('❌ Erreur critique consume-ride:', consumeErr);
    }

    // 6. Créer une notification pour le chauffeur
    await supabase
      .from('driver_ride_notifications')
      .insert({
        driver_id: closestDriver.driver_id,
        ride_request_id: rideRequestId,
        notification_type: 'ride_offer',
        title: 'Nouvelle course disponible',
        message: `Course disponible à ${closestDriver.distance_km.toFixed(1)}km de votre position`,
        metadata: {
          pickup_lat: finalPickupLat,
          pickup_lng: finalPickupLng,
          distance_km: closestDriver.distance_km,
          vehicle_class: vehicleClass,
          service_type: serviceType,
          rides_remaining: closestDriver.rides_remaining || 0
        }
      });

    // 7. Logger l'activité
    await supabase
      .from('activity_logs')
      .insert({
        user_id: closestDriver.driver_id,
        activity_type: 'ride_assigned',
        description: `Course attribuée - Distance: ${closestDriver.distance_km.toFixed(1)}km`,
        reference_id: rideRequestId,
        reference_type: 'transport_booking',
        metadata: {
          pickup_coordinates: { lat: finalPickupLat, lng: finalPickupLng },
          driver_coordinates: { lat: closestDriver.latitude, lng: closestDriver.longitude },
          distance_km: closestDriver.distance_km,
          rides_remaining: closestDriver.rides_remaining || 0
        }
      });

    console.log('✅ Ride successfully assigned to driver:', closestDriver.driver_id);

    return new Response(JSON.stringify({
      success: true,
      message: 'Chauffeur attribué avec succès',
      driver: {
        id: closestDriver.driver_id,
        distance: closestDriver.distance_km,
        eta: Math.ceil(closestDriver.distance_km * 2), // Estimation simple: 2 min par km
        vehicle_class: closestDriver.vehicle_class,
        rides_remaining: closestDriver.rides_remaining || 0,
        coordinates: {
          lat: closestDriver.latitude,
          lng: closestDriver.longitude
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Dispatcher error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});