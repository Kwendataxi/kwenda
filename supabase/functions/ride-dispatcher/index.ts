// Version: 2025-11-07T10:00:00Z - Deployment forced
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, RATE_LIMITS } from "../_shared/ratelimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
  
  // ✅ NOUVEAU : Bonus pour courses restantes élevées
  const ridesBonus = Math.min(15, (driver.rides_remaining || 0) * 1.5);
  
  // Adjust by priority
  const priorityMultiplier = priority === 'urgent' ? 1.3 : priority === 'high' ? 1.2 : 1.0;
  
  return (distanceScore + ratingScore + experienceScore + verificationBonus + ridesBonus) * priorityMultiplier;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ✅ Apply rate limiting (100 req/min for clients)
  return withRateLimit(req, RATE_LIMITS.CLIENT, async (req) => {

  try {
    // Parse request body first
    const body = await req.json() as RideRequest & { health_check?: boolean };
    
    // ✅ Handle health check requests
    if (body.health_check === true) {
      return new Response(JSON.stringify({ status: 'ok', service: 'ride-dispatcher' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, pickupLat, pickupLng, serviceType, vehicleClass, priority = 'normal' } = body;

    console.log(`🚗 Recherche chauffeur pour booking ${bookingId}`);
    console.log(`📍 Position: ${pickupLat}, ${pickupLng}`);
    console.log(`🚛 Service: ${serviceType}, Classe: ${vehicleClass || 'any'}, Priorité: ${priority}`);

    // Radius dynamique selon la priorité
    const searchRadius = priority === 'urgent' ? 20 : priority === 'high' ? 15 : 10;

    // ✅ PHASE 1: Correction du mapping RPC avec les BONS paramètres
    const { data: drivers, error: driversError } = await supabase.rpc('find_nearby_drivers', {
      p_lat: pickupLat,
      p_lng: pickupLng,
      p_max_distance_km: searchRadius,
      p_vehicle_class: vehicleClass || null,
      p_service_type: serviceType || 'taxi'
    });

    // 📊 PHASE 5: Logs détaillés pour monitoring
    console.log(`🔍 RPC params: lat=${pickupLat}, lng=${pickupLng}, radius=${searchRadius}km, vehicle=${vehicleClass || 'any'}, service=${serviceType}`);
    console.log(`📊 Found ${drivers?.length || 0} drivers`);
    if (drivers && drivers.length > 0) {
      console.log(`🚗 Sample driver:`, {
        id: drivers[0].driver_id,
        distance: drivers[0].distance_km,
        rides_remaining: drivers[0].rides_remaining,
        service_type: drivers[0].service_type
      });
    }

    if (driversError) {
      console.error('❌ Erreur lors de la recherche des chauffeurs:', driversError);
      throw driversError;
    }

    if (!drivers || drivers.length === 0) {
      console.log('❌ Aucun chauffeur disponible avec courses restantes');
      
      // Log de l'échec pour analytics
      await supabase.from('activity_logs').insert([{
        activity_type: 'ride_dispatch_failed',
        description: `Aucun chauffeur avec courses restantes pour ${bookingId}`,
        metadata: {
          bookingId,
          pickupLat,
          pickupLng,
          serviceType,
          vehicleClass,
          priority,
          searchRadius,
          reason: 'no_rides_remaining'
        }
      }]);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun chauffeur disponible avec des courses restantes. Veuillez réessayer.',
          drivers_searched: 0,
          reason: 'no_rides_remaining',
          retry_suggested: true,
          retry_delay_seconds: priority === 'urgent' ? 30 : 60
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ ${drivers.length} chauffeurs trouvés avec courses restantes`);

    // Calculer le score pour chaque chauffeur et trier
    const scoredDrivers = drivers.map((driver: any) => ({
      ...driver,
      score: calculateDriverScore(driver, priority)
    })).sort((a: DriverMatch, b: DriverMatch) => b.score - a.score);

    // Sélectionner le meilleur chauffeur
    const selectedDriver = scoredDrivers[0];
    
    console.log(`🎯 Chauffeur sélectionné: ${selectedDriver.driver_id} (Score: ${selectedDriver.score.toFixed(1)}, Distance: ${selectedDriver.distance_km}km, rides_remaining: ${selectedDriver.rides_remaining || 0})`);

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

    // ✅ SÉCURITÉ: Le crédit sera défalqué lors de l'arrivée du chauffeur (driver-arrival-confirmation)
    console.log(`🔒 [${bookingId}] Credit will be consumed upon driver arrival confirmation`);
    console.log(`💳 [${selectedDriver.driver_id}] Current rides_remaining: ${selectedDriver.rides_remaining || 0}`);

    // Récupérer les détails de la réservation pour la notification
    const { data: bookingDetails, error: bookingError } = await supabase
      .from('transport_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.warn('⚠️ Impossible de récupérer les détails de la réservation:', bookingError);
    }

    // Créer une notification pour le chauffeur
    const notificationData = {
      user_id: selectedDriver.driver_id,
      title: `Nouvelle course ${serviceType.toUpperCase()}`,
      message: `Nouvelle course assignée. Distance: ${selectedDriver.distance_km.toFixed(1)}km - Score priorité: ${selectedDriver.score.toFixed(1)}`,
      notification_type: 'ride_assignment',
      transport_booking_id: bookingId,
      metadata: {
        bookingId,
        serviceType,
        vehicleClass: selectedDriver.vehicle_class,
        distance: selectedDriver.distance_km,
        priority,
        score: selectedDriver.score,
        estimatedPrice: bookingDetails?.estimated_price,
        pickupLocation: bookingDetails?.pickup_location,
        destinationLocation: bookingDetails?.destination_location,
        rides_remaining: selectedDriver.rides_remaining || 0
      }
    };

    await supabase.from('push_notifications').insert([notificationData]);

    // 📈 PHASE 5: Logger l'assignation avec métriques complètes
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
        driversConsidered: drivers.length,
        rides_remaining: selectedDriver.rides_remaining || 0,
        searchParams: {
          lat: pickupLat,
          lng: pickupLng,
          serviceType,
          vehicleClass,
          priority,
          searchRadius
        },
        rpcParams: {
          p_lat: pickupLat,
          p_lng: pickupLng,
          p_max_distance_km: searchRadius,
          p_vehicle_class: vehicleClass,
          p_service_type: serviceType
        }
      }
    }]);

    console.log('✅ Assignation de chauffeur terminée avec succès');

    return new Response(
      JSON.stringify({
        success: true,
        driver: {
          id: selectedDriver.driver_id,
          distance: selectedDriver.distance_km,
          vehicle_class: selectedDriver.vehicle_class,
          rating: selectedDriver.rating_average,
          score: selectedDriver.score,
          rides_remaining: selectedDriver.rides_remaining || 0
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
  }); // withRateLimit
});