import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeocodeRequest {
  lat: number;
  lng: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lat, lng }: GeocodeRequest = await req.json();

    console.log(`🌍 Reverse geocoding for ${lat}, ${lng}`);

    // Try Google Maps API first if available
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (googleApiKey) {
      try {
        const googleResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}&language=fr`
        );
        
        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          
          if (googleData.status === 'OK' && googleData.results.length > 0) {
            const address = googleData.results[0].formatted_address;
            console.log(`✅ Google geocoding successful: ${address}`);
            
            return new Response(
              JSON.stringify({ 
                address,
                source: 'google',
                success: true 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (error) {
        console.warn('⚠️ Google geocoding failed:', error);
      }
    }

    // Universal fallback using coordinates
    let address = '';
    
    // Try to determine country/region from coordinates
    let region = '';
    
    // Africa detection
    if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52) {
      // Specific countries in Africa
      if (lat >= -5.0 && lat <= -4.0 && lng >= 15.0 && lng <= 16.0) {
        address = 'Kinshasa, République Démocratique du Congo';
      } else if (lat >= -12.0 && lat <= -11.0 && lng >= 27.0 && lng <= 28.0) {
        address = 'Lubumbashi, République Démocratique du Congo';
      } else if (lat >= -11.0 && lat <= -10.0 && lng >= 25.0 && lng <= 26.0) {
        address = 'Kolwezi, République Démocratique du Congo';
      } else if (lat >= 5.0 && lat <= 6.0 && lng >= -5.0 && lng <= -3.0) {
        address = 'Abidjan, Côte d\'Ivoire';
      } else {
        region = 'Afrique';
      }
    }
    // Europe detection
    else if (lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) {
      region = 'Europe';
    }
    // North America detection
    else if (lat >= 25 && lat <= 70 && lng >= -170 && lng <= -50) {
      region = 'Amérique du Nord';
    }
    // Asia detection
    else if (lat >= -10 && lat <= 70 && lng >= 60 && lng <= 180) {
      region = 'Asie';
    }
    // South America detection
    else if (lat >= -55 && lat <= 15 && lng >= -85 && lng <= -35) {
      region = 'Amérique du Sud';
    }
    // Oceania detection
    else if (lat >= -50 && lat <= -10 && lng >= 110 && lng <= 180) {
      region = 'Océanie';
    }
    
    // If no specific address found, create generic one
    if (!address) {
      if (region) {
        address = `Position ${lat.toFixed(4)}, ${lng.toFixed(4)} (${region})`;
      } else {
        address = `Coordonnées ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    }

    console.log(`📍 Fallback geocoding: ${address}`);

    return new Response(
      JSON.stringify({ 
        address,
        source: 'fallback',
        success: true 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Geocoding failed',
        address: `Position ${0}, ${0}`,
        source: 'error',
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});