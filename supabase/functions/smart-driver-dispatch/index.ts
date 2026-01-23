import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DriverCandidate {
  driver_id: string;
  distance: number;
  rating: number;
  total_rides: number;
  is_online: boolean;
  is_available: boolean;
  service_types: string[];
  location: {
    lat: number;
    lng: number;
  };
}

/**
 * 🚀 Smart Driver Dispatch - Edge Function
 * PHASE 4.3: Algorithme de matching intelligent pour chauffeurs
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { 
      pickup_lat, 
      pickup_lng, 
      service_type, // 'taxi' | 'delivery' | 'marketplace'
      max_distance = 10, // km
      max_drivers = 5 
    } = await req.json();

    console.log('🎯 Smart dispatch request:', { service_type, pickup_lat, pickup_lng });

    // 1️⃣ Récupérer tous les chauffeurs online et disponibles
    const { data: onlineDrivers, error: driversError } = await supabaseClient
      .from('driver_locations')
      .select(`
        driver_id,
        latitude,
        longitude,
        is_online,
        is_available,
        last_ping
      `)
      .eq('is_online', true)
      .eq('is_available', true)
      .gte('last_ping', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Actif dans les 5 dernières minutes

    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError);
      throw driversError;
    }

    if (!onlineDrivers || onlineDrivers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun chauffeur disponible pour le moment',
          candidates: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📍 Found ${onlineDrivers.length} online drivers`);

    // 2️⃣ Enrichir avec les infos de profil et préférences
    const driverIds = onlineDrivers.map(d => d.driver_id);
    
    const { data: driverProfiles } = await supabaseClient
      .from('chauffeurs')
      .select(`
        user_id,
        rating_average,
        rating_count,
        total_rides,
        service_type,
        vehicle_class
      `)
      .in('user_id', driverIds);

    const { data: servicePrefs } = await supabaseClient
      .from('driver_service_preferences')
      .select(`
        driver_id,
        service_types,
        max_delivery_distance,
        is_active
      `)
      .in('driver_id', driverIds)
      .eq('is_active', true);

    // 3️⃣ Calculer distance et scorer chaque chauffeur
    const candidates: DriverCandidate[] = [];

    for (const driver of onlineDrivers) {
      const profile = driverProfiles?.find(p => p.user_id === driver.driver_id);
      const prefs = servicePrefs?.find(p => p.driver_id === driver.driver_id);

      // Filtrer par type de service
      const acceptsService = prefs?.service_types?.includes(service_type) || 
                             profile?.service_type === service_type;
      
      if (!acceptsService) {
        continue; // Skip si ne fait pas ce service
      }

      // Calculer distance (formule haversine simplifiée)
      const R = 6371; // Rayon de la Terre en km
      const dLat = (pickup_lat - driver.latitude) * Math.PI / 180;
      const dLng = (pickup_lng - driver.longitude) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(driver.latitude * Math.PI / 180) * 
        Math.cos(pickup_lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Vérifier distance max
      const maxDist = prefs?.max_delivery_distance || max_distance;
      if (distance > maxDist) {
        continue; // Trop loin
      }

      candidates.push({
        driver_id: driver.driver_id,
        distance,
        rating: profile?.rating_average || 0,
        total_rides: profile?.total_rides || 0,
        is_online: driver.is_online,
        is_available: driver.is_available,
        service_types: prefs?.service_types || [],
        location: {
          lat: driver.latitude,
          lng: driver.longitude
        }
      });
    }

    // 4️⃣ Scorer et trier les candidats
    const scoredCandidates = candidates.map(c => ({
      ...c,
      score: calculateDriverScore(c)
    })).sort((a, b) => b.score - a.score);

    // 5️⃣ Retourner les meilleurs candidats
    const topCandidates = scoredCandidates.slice(0, max_drivers);

    console.log(`✅ Found ${topCandidates.length} matching drivers`);

    return new Response(
      JSON.stringify({
        success: true,
        candidates: topCandidates,
        total_online: onlineDrivers.length,
        total_matching: candidates.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Smart dispatch error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        candidates: [] 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * 🎯 Algorithme de scoring
 * Plus le score est élevé, meilleur le chauffeur
 */
function calculateDriverScore(driver: DriverCandidate): number {
  let score = 100; // Score de base

  // Distance (plus proche = meilleur)
  // -10 points par km
  score -= driver.distance * 10;

  // Note moyenne (bonus si >4.5)
  if (driver.rating >= 4.5) {
    score += 20;
  } else if (driver.rating >= 4.0) {
    score += 10;
  }

  // Expérience (bonus si >100 courses)
  if (driver.total_rides > 100) {
    score += 15;
  } else if (driver.total_rides > 50) {
    score += 10;
  } else if (driver.total_rides > 10) {
    score += 5;
  }

  return Math.max(0, score); // Ne jamais être négatif
}
