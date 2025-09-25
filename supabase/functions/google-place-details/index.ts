import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlaceDetailsRequest {
  placeId: string;
  sessionToken?: string;
  fields?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { placeId, sessionToken, fields = ['geometry', 'formatted_address', 'name', 'types', 'place_id'] }: PlaceDetailsRequest = await req.json();

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'Place ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Google Place Details URL
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('fields', fields.join(','));
    url.searchParams.set('language', 'fr');
    
    if (sessionToken) {
      url.searchParams.set('sessiontoken', sessionToken);
    }

    console.log(`Google Place Details request: ${placeId}`, {
      fields,
      sessionToken: sessionToken ? 'provided' : 'none'
    });

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Place Details API error:', data);
      return new Response(
        JSON.stringify({ error: `Google Place Details API error: ${data.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const place = data.result;
    const geometry = place.geometry;
    
    // Transform to our unified format
    const result = {
      id: place.place_id,
      placeId: place.place_id,
      name: place.name || '',
      address: place.formatted_address || '',
      coordinates: {
        lat: geometry?.location?.lat || 0,
        lng: geometry?.location?.lng || 0
      },
      types: place.types || [],
      geometry: {
        location: geometry?.location,
        viewport: geometry?.viewport
      },
      requestId: crypto.randomUUID()
    };

    console.log(`Place details retrieved for: ${result.name} at ${result.coordinates.lat}, ${result.coordinates.lng}`);

    return new Response(
      JSON.stringify({ 
        result,
        status: data.status
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Place details function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});