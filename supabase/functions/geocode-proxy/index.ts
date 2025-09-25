import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, region = 'cd' } = await req.json();
    
    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      console.log('Google Maps API key not configured, returning fallback data');
      // Retourner des données de fallback pour Kinshasa
      const fallbackResult = {
        place_id: 'fallback_' + Date.now(),
        name: query.includes(',') ? query.split(',')[0] : 'Kinshasa',
        formatted_address: query.includes('Kinshasa') ? query : `${query}, Kinshasa, République Démocratique du Congo`,
        geometry: {
          location: {
            lat: -4.3217 + (Math.random() - 0.5) * 0.02,
            lng: 15.3069 + (Math.random() - 0.5) * 0.02
          }
        },
        types: ['locality', 'political'],
        rating: null
      };
      
      return new Response(JSON.stringify({
        status: 'OK',
        results: [fallbackResult]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Searching with Google Places API: ${query} Region: ${region}`);

    // Construire l'URL de l'API Google Places
    // Construire l'URL de l'API Google Geocoding (plus fiable que Places)
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    googleUrl.searchParams.set('address', query);
    googleUrl.searchParams.set('key', googleApiKey);
    googleUrl.searchParams.set('region', region);
    googleUrl.searchParams.set('language', 'fr');

    // Si région CD ou CI, limiter aux résultats locaux
    if (region === 'cd') {
      googleUrl.searchParams.set('location', '-4.3217,15.3069'); // Kinshasa
      googleUrl.searchParams.set('radius', '100000'); // 100km
    } else if (region === 'ci') {
      googleUrl.searchParams.set('location', '5.3600,-4.0083'); // Abidjan
      googleUrl.searchParams.set('radius', '100000'); // 100km
    }

    const response = await fetch(googleUrl.toString());
    const data = await response.json();

    console.log(`Google Places API response status: ${data.status}`);
    console.log(`Results found: ${data.results?.length || 0}`);

    if (data.status === 'OK') {
      // Filtrer et formater les résultats pour Geocoding API
      const formattedResults = data.results.slice(0, 10).map((place: any) => ({
        place_id: place.place_id,
        name: place.formatted_address.split(',')[0], // Premier segment comme nom
        formatted_address: place.formatted_address,
        geometry: {
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          }
        },
        types: place.types,
        rating: null
      }));

      return new Response(JSON.stringify({
        status: 'OK',
        results: formattedResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        status: data.status,
        results: [],
        error: data.error_message || 'No results found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Geocode proxy error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});