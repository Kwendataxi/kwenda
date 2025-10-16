// PHASE 2.2 : Edge Function geocode-fallback
// Wrapper sécurisé autour de Google Geocoding API avec cache intelligent

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeRequest {
  address: string;
  city?: string;
  countryCode?: string;
}

interface CachedGeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id: string;
  cached_at: string;
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

    const { address, city, countryCode = 'CD' }: GeocodeRequest = await req.json();

    if (!address) {
      throw new Error('Address is required');
    }

    console.log('🔍 Geocoding request:', { address, city, countryCode });

    // ✅ ÉTAPE 1 : Vérifier le cache local (table geocode_cache)
    const cacheKey = `${address.toLowerCase().trim()}_${city || ''}_${countryCode}`;
    
    const { data: cachedResult } = await supabase
      .from('geocode_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('cached_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Cache 30 jours
      .maybeSingle();

    if (cachedResult) {
      console.log('✅ Cache HIT:', cacheKey);
      return new Response(
        JSON.stringify({
          success: true,
          coordinates: {
            lat: cachedResult.latitude,
            lng: cachedResult.longitude
          },
          formatted_address: cachedResult.formatted_address,
          place_id: cachedResult.place_id,
          source: 'cache'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('⚠️ Cache MISS, calling Google Geocoding API...');

    // ✅ ÉTAPE 2 : Appeler Google Geocoding API
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    // Construire l'adresse complète avec contexte géographique
    let fullAddress = address;
    if (city && !address.toLowerCase().includes(city.toLowerCase())) {
      fullAddress += `, ${city}`;
    }
    if (countryCode === 'CD') {
      fullAddress += ', République Démocratique du Congo';
    } else if (countryCode === 'CI') {
      fullAddress += ', Côte d\'Ivoire';
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`;

    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      console.error('❌ Geocoding failed:', geocodeData.status, geocodeData.error_message);
      
      // ✅ FALLBACK : Coordonnées par défaut selon la ville
      const defaultCoordinates = getDefaultCityCoordinates(city || 'Kinshasa');
      
      return new Response(
        JSON.stringify({
          success: true,
          coordinates: defaultCoordinates,
          formatted_address: fullAddress,
          place_id: null,
          source: 'fallback',
          warning: 'Using default city coordinates'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = geocodeData.results[0];
    const coordinates = {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng
    };

    console.log('✅ Geocoding success:', coordinates);

    // ✅ ÉTAPE 3 : Sauvegarder dans le cache
    try {
      await supabase
        .from('geocode_cache')
        .insert({
          cache_key: cacheKey,
          address: address,
          city: city,
          country_code: countryCode,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          cached_at: new Date().toISOString()
        });
      
      console.log('💾 Result cached successfully');
    } catch (cacheError) {
      console.warn('⚠️ Failed to cache result:', cacheError);
      // Ne pas bloquer la réponse si le cache échoue
    }

    return new Response(
      JSON.stringify({
        success: true,
        coordinates,
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        source: 'google_api'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Geocode error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Geocoding failed'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// ✅ Coordonnées par défaut des villes principales (fallback ultime)
function getDefaultCityCoordinates(city: string): { lat: number; lng: number } {
  const defaults: Record<string, { lat: number; lng: number }> = {
    'Kinshasa': { lat: -4.3217, lng: 15.3069 },
    'Lubumbashi': { lat: -11.6667, lng: 27.4667 },
    'Kolwezi': { lat: -10.7167, lng: 25.4667 },
    'Abidjan': { lat: 5.3600, lng: -4.0083 }
  };

  return defaults[city] || defaults['Kinshasa'];
}