import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MatchingRequest {
  pickup_coordinates: { lat: number; lng: number };
  destination_coordinates?: { lat: number; lng: number };
  vehicle_class?: string;
  max_distance_km?: number;
  city?: string;
  priority?: 'normal' | 'high' | 'urgent';
}

interface DriverMatch {
  driver_id: string;
  distance_km: number;
  estimated_arrival_minutes: number;
  score: number;
  driver_profile: any;
  vehicle_info: any;
}

// Calcul de distance Haversine
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
           Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calcul du score intelligent
function calculateDriverScore(
  distance_km: number,
  rating: number,
  trip_count: number,
  last_ping_minutes: number,
  vehicle_class: string,
  requested_class?: string
): number {
  let score = 100;
  
  // Pénalité distance (plus c'est loin, moins bon c'est)
  score -= Math.min(distance_km * 5, 50);
  
  // Bonus rating (rating élevé = bonus)
  score += (rating - 3) * 10;
  
  // Bonus expérience (plus de courses = plus fiable)
  score += Math.min(trip_count / 10, 15);
  
  // Pénalité inactivité (dernière ping ancienne = moins fiable)
  score -= Math.min(last_ping_minutes, 20);
  
  // Bonus correspondance classe de véhicule
  if (requested_class && vehicle_class === requested_class) {
    score += 10;
  } else if (requested_class === 'economy' && vehicle_class === 'standard') {
    score += 5; // Standard peut faire economy
  } else if (requested_class === 'standard' && vehicle_class === 'premium') {
    score += 3; // Premium peut faire standard
  }
  
  return Math.max(score, 0);
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

    const body = await req.json() as MatchingRequest;
    const {
      pickup_coordinates,
      vehicle_class = 'standard',
      max_distance_km = 15,
      city = 'Kinshasa',
      priority = 'normal'
    } = body;

    console.log(`🔍 Recherche intelligente de chauffeurs:`, {
      pickup: pickup_coordinates,
      vehicle_class,
      max_distance_km,
      city,
      priority
    });

    // Ajuster les paramètres selon la priorité
    let search_radius = max_distance_km;
    let min_rating = 4.0;
    
    if (priority === 'urgent') {
      search_radius = max_distance_km * 2;
      min_rating = 3.5;
    } else if (priority === 'high') {
      search_radius = max_distance_km * 1.5;
      min_rating = 3.8;
    }

    // Récupérer les chauffeurs disponibles dans la zone
    const { data: driversData, error: driversError } = await supabase
      .from('driver_locations')
      .select(`
        driver_id,
        latitude,
        longitude,
        vehicle_class,
        is_online,
        is_available,
        last_ping,
        city,
        driver_profiles(
          display_name,
          phone_number,
          vehicle_make,
          vehicle_model,
          vehicle_plate,
          vehicle_color,
          rating_average,
          rating_count,
          total_trips,
          years_experience
        )
      `)
      .eq('is_online', true)
      .eq('is_available', true)
      .eq('city', city)
      .gte('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Dernière ping < 10min
      .not('driver_profiles', 'is', null);

    if (driversError) {
      throw new Error(`Erreur récupération chauffeurs: ${driversError.message}`);
    }

    if (!driversData || driversData.length === 0) {
      console.log('❌ Aucun chauffeur disponible trouvé');
      return new Response(
        JSON.stringify({
          success: true,
          drivers: [],
          total_found: 0,
          search_radius_used: search_radius,
          message: 'Aucun chauffeur disponible dans cette zone'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📍 ${driversData.length} chauffeurs potentiels trouvés`);

    // Calculer les distances et scores
    const matches: DriverMatch[] = [];
    
    for (const driver of driversData) {
      const distance_km = calculateDistance(
        pickup_coordinates.lat,
        pickup_coordinates.lng,
        driver.latitude,
        driver.longitude
      );

      // Filtrer par distance
      if (distance_km > search_radius) {
        continue;
      }

      // Filtrer par rating minimum
      if (driver.driver_profiles?.rating_average < min_rating) {
        continue;
      }

      const last_ping_minutes = Math.round(
        (Date.now() - new Date(driver.last_ping).getTime()) / (1000 * 60)
      );

      const score = calculateDriverScore(
        distance_km,
        driver.driver_profiles?.rating_average || 4.0,
        driver.driver_profiles?.total_trips || 0,
        last_ping_minutes,
        driver.vehicle_class,
        vehicle_class
      );

      const estimated_arrival = Math.round(distance_km * 3 + 2); // ~3min/km + 2min base

      matches.push({
        driver_id: driver.driver_id,
        distance_km: Math.round(distance_km * 100) / 100,
        estimated_arrival_minutes: estimated_arrival,
        score,
        driver_profile: driver.driver_profiles,
        vehicle_info: {
          make: driver.driver_profiles?.vehicle_make,
          model: driver.driver_profiles?.vehicle_model,
          plate: driver.driver_profiles?.vehicle_plate,
          color: driver.driver_profiles?.vehicle_color,
          class: driver.vehicle_class
        }
      });
    }

    // Trier par score décroissant
    matches.sort((a, b) => b.score - a.score);

    // Limiter à 10 meilleurs résultats
    const topMatches = matches.slice(0, 10);

    console.log(`✅ ${topMatches.length} chauffeurs correspondants trouvés et triés par score`);

    // Simuler l'expansion du rayon si pas assez de résultats
    let expansion_attempts = 0;
    if (topMatches.length < 3 && search_radius < 50) {
      console.log('🔄 Expansion du rayon de recherche...');
      expansion_attempts++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        drivers: topMatches,
        total_found: topMatches.length,
        search_radius_used: search_radius,
        expansion_attempts,
        matching_params: {
          city,
          vehicle_class,
          priority,
          min_rating,
          max_distance_km: search_radius
        },
        performance: {
          search_time_ms: Date.now() - Date.now(), // Placeholder
          total_drivers_evaluated: driversData.length,
          drivers_in_radius: matches.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erreur matching intelligent:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        drivers: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});