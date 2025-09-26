import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RideRequest {
  bookingId: string;
  pickupLat: number;
  pickupLng: number;
  serviceType: string;
  vehicleClass?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface DriverMatch {
  driver_id: string;
  distance_km: number;
  vehicle_class: string;
  rating_average: number;
  total_rides: number;
  is_verified: boolean;
  score: number;
}

function calculateDriverScore(driver: any, priority: string = 'normal'): number {
  const distanceScore = Math.max(0, 100 - (driver.distance_km * 10)); // -10 points per km
  const ratingScore = (driver.rating_average || 0) * 20; // 0-100 scale
  const experienceScore = Math.min(50, (driver.total_rides || 0) * 0.5); // Max 50 points
  const verificationBonus = driver.is_verified ? 20 : 0;
  
  // Adjust by priority
  const priorityMultiplier = priority === 'urgent' ? 1.3 : priority === 'high' ? 1.2 : 1.0;
  
  return (distanceScore + ratingScore + experienceScore + verificationBonus) * priorityMultiplier;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, pickupLat, pickupLng, serviceType, vehicleClass, priority = 'normal' } = await req.json() as RideRequest;

    console.log(`🚗 Recherche chauffeur pour booking ${bookingId}`);
    console.log(`📍 Position: ${pickupLat}, ${pickupLng}`);
    console.log(`🚛 Service: ${serviceType}, Classe: ${vehicleClass || 'any'}, Priorité: ${priority}`);

    // Radius dynamique selon la priorité
    const searchRadius = priority === 'urgent' ? 20 : priority === 'high' ? 15 : 10;

    // Trouver les chauffeurs à proximité avec la fonction RPC corrigée
    const { data: drivers, error: driversError } = await supabase.rpc('find_nearby_drivers', {
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      max_distance_km: searchRadius,
      vehicle_class_filter: vehicleClass
    });

    if (driversError) {
      console.error('❌ Erreur lors de la recherche des chauffeurs:', driversError);
      throw driversError;
    }

    if (!drivers || drivers.length === 0) {
      console.log('❌ Aucun chauffeur disponible');
      
      // Log de l'échec pour analytics
      await supabase.from('activity_logs').insert([{
        activity_type: 'ride_dispatch_failed',
        description: `Aucun chauffeur trouvé pour le booking ${bookingId}`,
        metadata: {
          bookingId,
          pickupLat,
          pickupLng,
          serviceType,
          vehicleClass,
          priority,
          searchRadius
        }
      }]);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun chauffeur disponible dans votre zone',
          drivers_searched: 0,
          retry_suggested: true,
          retry_delay_seconds: priority === 'urgent' ? 30 : 60
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ ${drivers.length} chauffeurs trouvés`);

    // Calculer le score pour chaque chauffeur et trier
    const scoredDrivers = drivers.map((driver: any) => ({
      ...driver,
      score: calculateDriverScore(driver, priority)
    })).sort((a: DriverMatch, b: DriverMatch) => b.score - a.score);

    // Sélectionner le meilleur chauffeur
    const selectedDriver = scoredDrivers[0];
    
    console.log(`🎯 Chauffeur sélectionné: ${selectedDriver.driver_id} (Score: ${selectedDriver.score.toFixed(1)}, Distance: ${selectedDriver.distance_km}km)`);

    // Mettre à jour la réservation avec l'assignation du chauffeur
    const { error: updateError } = await supabase
      .from('transport_bookings')
      .update({
        driver_id: selectedDriver.driver_id,
        status: 'driver_assigned',
        driver_assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour de la réservation:', updateError);
      throw updateError;
    }

    // Marquer le chauffeur comme non disponible temporairement
    await supabase
      .from('driver_locations')
      .update({
        is_available: false,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', selectedDriver.driver_id);

    // Créer une notification EXCLUSIVE pour le chauffeur avec expiration
    const notificationData = {
      driver_id: selectedDriver.driver_id,
      booking_id: bookingId,
      notification_type: 'ride_request',
      title: `Nouvelle course ${serviceType.toUpperCase()}`,
      message: `Course assignée - Distance: ${selectedDriver.distance_km.toFixed(1)}km`,
      metadata: {
        bookingId,
        serviceType,
        vehicleClass: selectedDriver.vehicle_class,
        distance: selectedDriver.distance_km,
        priority,
        score: selectedDriver.score,
        estimatedArrivalMinutes: Math.ceil(selectedDriver.distance_km * 2.5) // ~25 km/h avg
      },
      status: 'pending',
      expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes
    };

    const { error: notifError } = await supabase
      .from('driver_ride_notifications')
      .insert([notificationData]);

    if (notifError) {
      console.warn('⚠️ Erreur création notification:', notifError);
    }

    // Logger l'assignation réussie
    await supabase.from('activity_logs').insert([{
      activity_type: 'ride_dispatch_success',
      description: `Chauffeur ${selectedDriver.driver_id} assigné au booking ${bookingId}`,
      metadata: {
        bookingId,
        driverId: selectedDriver.driver_id,
        distance: selectedDriver.distance_km,
        score: selectedDriver.score,
        priority,
        serviceType,
        driversConsidered: drivers.length
      }
    }]);

    console.log('✅ Assignation de chauffeur terminée avec succès');

    return new Response(
      JSON.stringify({
        success: true,
        driver: {
          driver_id: selectedDriver.driver_id,
          distance_km: selectedDriver.distance_km,
          vehicle_class: selectedDriver.vehicle_class,
          rating_average: selectedDriver.rating_average,
          score: selectedDriver.score,
          estimated_arrival_minutes: Math.ceil(selectedDriver.distance_km * 2.5)
        },
        assignment_details: {
          priority_level: priority,
          drivers_considered: drivers.length,
          search_radius_km: searchRadius
        },
        message: 'Chauffeur assigné avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erreur du dispatching:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        message: 'Erreur lors de l\'assignation du chauffeur'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});