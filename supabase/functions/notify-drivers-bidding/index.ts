import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BiddingNotificationRequest {
  bookingId: string;
  pickupLat: number;
  pickupLng: number;
  estimatedPrice: number;
  clientProposedPrice: number; // 🆕 Prix proposé par le client
  vehicleType: string;
  biddingDuration: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      bookingId, 
      pickupLat, 
      pickupLng, 
      estimatedPrice,
      clientProposedPrice,
      vehicleType,
      biddingDuration 
    } = await req.json() as BiddingNotificationRequest;

    console.log('🎯 [Bidding] Notifying drivers for booking:', bookingId);

    // Trouver chauffeurs dans rayon 15km avec le bon type de véhicule
    const { data: drivers, error: driversError } = await supabase.rpc('find_nearby_drivers', {
      p_lat: pickupLat,
      p_lng: pickupLng,
      p_max_distance_km: 15,
      p_vehicle_class: vehicleType,
      p_service_type: 'taxi'
    });

    if (driversError) {
      console.error('❌ Error finding drivers:', driversError);
      throw driversError;
    }

    if (!drivers || drivers.length === 0) {
      console.log('❌ No drivers found for bidding');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No drivers available', 
          notifiedDrivers: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${drivers.length} drivers for bidding`);

    // Récupérer détails du booking
    const { data: booking } = await supabase
      .from('transport_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Créer notifications pour chaque chauffeur
    const biddingClosesAt = new Date(Date.now() + biddingDuration * 1000).toISOString();
    
    const discount = ((estimatedPrice - clientProposedPrice) / estimatedPrice * 100).toFixed(0);
    const isLowOffer = clientProposedPrice < estimatedPrice * 0.7;
    
    const notifications = drivers.map((driver: any) => ({
      user_id: driver.driver_id,
      title: isLowOffer ? '🎯 Offre client (-' + discount + '%)' : '🎯 Nouvelle course - Enchères',
      message: `Client offre: ${clientProposedPrice.toLocaleString()} CDF (Kwenda: ${estimatedPrice.toLocaleString()}) • ${driver.distance_km.toFixed(1)}km`,
      notification_type: 'ride_bidding',
      transport_booking_id: bookingId,
      is_sent: false,
      metadata: {
        bookingId,
        biddingMode: true,
        estimatedPrice,
        clientProposedPrice,
        biddingClosesAt,
        biddingDuration,
        distance: driver.distance_km,
        pickupLocation: booking.pickup_location,
        destinationLocation: booking.destination,
        vehicleType,
        offerCount: 0,
        discount: discount + '%'
      }
    }));

    const { error: notifError } = await supabase
      .from('push_notifications')
      .insert(notifications);

    if (notifError) {
      console.error('❌ Error creating notifications:', notifError);
      throw notifError;
    }

    // Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: booking.user_id,
      activity_type: 'bidding_notifications_sent',
      description: `${notifications.length} chauffeurs notifiés pour enchères`,
      metadata: {
        bookingId,
        driversNotified: notifications.length,
        estimatedPrice,
        biddingDuration,
        searchRadius: 15
      }
    });

    console.log(`📬 Sent bidding notifications to ${notifications.length} drivers`);

    return new Response(
      JSON.stringify({
        success: true,
        notifiedDrivers: notifications.length,
        biddingClosesAt,
        drivers: drivers.map((d: any) => ({
          id: d.driver_id,
          distance_km: d.distance_km
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [Bidding] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
