import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchingRequest {
  pickup_latitude: number;
  pickup_longitude: number;
  destination_latitude?: number;
  destination_longitude?: number;
  vehicle_class?: string;
  city: string;
  priority?: 'normal' | 'high' | 'urgent';
}

interface DriverMatch {
  driver_id: string;
  full_name: string;
  rating: number;
  vehicle_type: string;
  vehicle_model: string;
  distance_km: number;
  score: number;
  latitude: number;
  longitude: number;
  phone_number: string;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateDriverScore(distance: number, rating: number, tripCount: number): number {
  const distanceScore = Math.max(0, 100 - (distance * 10));
  const ratingScore = rating * 20;
  const experienceScore = Math.min(tripCount * 2, 20);
  return distanceScore + ratingScore + experienceScore;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const request: MatchingRequest = await req.json();
    const { pickup_latitude, pickup_longitude, city, priority = 'normal' } = request;

    let searchRadius = priority === 'urgent' ? 25 : priority === 'high' ? 15 : 10;
    let minRating = priority === 'urgent' ? 3.0 : priority === 'high' ? 4.0 : 4.5;

    // ✅ CORRECTION: Supprimer filtre city qui n'existe pas
    const { data: drivers, error } = await supabase
      .from('driver_locations')
      .select(`
        driver_id,
        latitude,
        longitude,
        driver_profiles!inner(
          full_name,
          rating,
          vehicle_type,
          vehicle_model,
          phone_number,
          total_trips
        )
      `)
      .eq('is_online', true)
      .eq('is_available', true)
      .gte('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    const matches: DriverMatch[] = [];

    for (const driver of drivers || []) {
      const distance = calculateDistance(
        pickup_latitude,
        pickup_longitude,
        driver.latitude,
        driver.longitude
      );

      if (distance <= searchRadius && (driver.driver_profiles as any)?.rating >= minRating) {
        const score = calculateDriverScore(
          distance,
          (driver.driver_profiles as any)?.rating || 4.0,
          (driver.driver_profiles as any)?.total_trips || 0
        );

        matches.push({
          driver_id: driver.driver_id,
          full_name: (driver.driver_profiles as any)?.full_name,
          rating: (driver.driver_profiles as any)?.rating,
          vehicle_type: (driver.driver_profiles as any)?.vehicle_type,
          vehicle_model: (driver.driver_profiles as any)?.vehicle_model,
          distance_km: parseFloat(distance.toFixed(2)),
          score: parseFloat(score.toFixed(2)),
          latitude: driver.latitude,
          longitude: driver.longitude,
          phone_number: (driver.driver_profiles as any)?.phone_number
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 10);

    return new Response(JSON.stringify({
      success: true,
      matches: topMatches,
      search_params: {
        city,
        radius_km: searchRadius,
        min_rating: minRating,
        priority
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Driver matching error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});