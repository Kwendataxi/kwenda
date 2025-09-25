import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutocompleteRequest {
  input: string;
  lat?: number;
  lng?: number;
  radius?: number;
  types?: string[];
  language?: string;
  sessionToken?: string;
}

interface PlaceDetailsRequest {
  placeId: string;
  sessionToken?: string;
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

    const { input, lat, lng, radius = 50000, types = [], language = 'fr', sessionToken }: AutocompleteRequest = await req.json();

    if (!input || input.trim().length < 2) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Google Places Autocomplete URL
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input.trim());
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', language);
    
    if (sessionToken) {
      url.searchParams.set('sessiontoken', sessionToken);
    }

    // Location bias for contextual results
    if (lat && lng) {
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', radius.toString());
    }

    // Types filter for specific place types
    if (types.length > 0) {
      url.searchParams.set('types', types.join('|'));
    }

    // Components to restrict to specific countries (RDC, Côte d'Ivoire)
    url.searchParams.set('components', 'country:cd|country:ci');

    console.log(`Google Places Autocomplete request: ${input}`, {
      location: lat && lng ? `${lat},${lng}` : 'none',
      radius,
      types,
      sessionToken: sessionToken ? 'provided' : 'none'
    });

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data);
      return new Response(
        JSON.stringify({ error: `Google Places API error: ${data.status}`, predictions: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform predictions to our format
    const predictions = (data.predictions || []).map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      structuredFormatting: {
        mainText: prediction.structured_formatting?.main_text || '',
        secondaryText: prediction.structured_formatting?.secondary_text || ''
      },
      types: prediction.types || [],
      matchedSubstrings: prediction.matched_substrings || [],
      terms: prediction.terms || []
    }));

    console.log(`Autocomplete results: ${predictions.length} predictions for "${input}"`);

    return new Response(
      JSON.stringify({ 
        predictions,
        status: data.status,
        requestId: crypto.randomUUID()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Autocomplete function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', predictions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});