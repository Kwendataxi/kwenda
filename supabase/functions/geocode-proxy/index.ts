import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/ratelimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ✅ Apply rate limiting (100 req/min for anonymous)
  return withRateLimit(req, RATE_LIMITS.ANONYMOUS, async (req) => {

  try {
    const body = await req.json();
    
    // ✅ Handle health check requests
    if (body.health_check === true) {
      return new Response(JSON.stringify({ status: 'ok', service: 'geocode-proxy' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { query, region = 'cd', language = 'fr' } = body;
    
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
        address_components: [],
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

    console.log(`🔍 Geocoding avec Google API: ${query} | Region: ${region} | Language: ${language}`);

    // Construire l'URL de l'API Google Geocoding
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    googleUrl.searchParams.set('address', query);
    googleUrl.searchParams.set('key', googleApiKey);
    googleUrl.searchParams.set('region', region);
    googleUrl.searchParams.set('language', language);

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

    console.log(`📍 Google API response status: ${data.status}`);
    console.log(`📊 Results found: ${data.results?.length || 0}`);

    if (data.status === 'OK') {
      // Fonction pour détecter les Plus Codes
      const isPlusCode = (address: string): boolean => {
        return /[A-Z0-9]{4,}\+[A-Z0-9]{2,}/.test(address);
      };

      // Fonction pour construire une adresse lisible depuis address_components
      const buildReadableAddress = (components: any[]): string => {
        const parts: any = {
          street: '',
          neighborhood: '',
          commune: '',
          city: '',
          country: ''
        };

        components.forEach((comp: any) => {
          if (comp.types.includes('route') || comp.types.includes('street_address')) {
            parts.street = comp.long_name;
          }
          if (comp.types.includes('neighborhood') || comp.types.includes('sublocality')) {
            parts.neighborhood = comp.long_name;
          }
          if (comp.types.includes('administrative_area_level_2')) {
            parts.commune = comp.long_name;
          }
          if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_1')) {
            if (!parts.city) parts.city = comp.long_name;
          }
          if (comp.types.includes('country')) {
            parts.country = comp.long_name;
          }
        });

        const addressParts = [
          parts.street,
          parts.neighborhood,
          parts.commune || parts.city,
          parts.country
        ].filter(Boolean);

        return addressParts.join(', ') || '';
      };

      // Filtrer et formater les résultats
      const formattedResults = data.results.slice(0, 10).map((place: any) => {
        let finalAddress = place.formatted_address || '';

        // Si l'adresse contient un Plus Code, reconstruire manuellement
        if (isPlusCode(finalAddress)) {
          console.log('⚠️ Plus Code détecté:', finalAddress);
          
          if (place.address_components && place.address_components.length > 0) {
            const builtAddress = buildReadableAddress(place.address_components);
            if (builtAddress) {
              finalAddress = builtAddress;
              console.log('✅ Adresse reconstruite:', finalAddress);
            }
          }
        }

        return {
          place_id: place.place_id,
          name: finalAddress.split(',')[0], // Premier segment comme nom
          formatted_address: finalAddress,
          address_components: place.address_components || [],
          geometry: {
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            }
          },
          types: place.types,
          rating: null
        };
      });

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
  }); // withRateLimit
});