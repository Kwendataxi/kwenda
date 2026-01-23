import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ProxyRequest {
  service: 'geocode' | 'place-details' | 'autocomplete' | 'directions' | 'distancematrix';
  params: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 🔧 RATE LIMIT DÉSACTIVÉ - Causait des lenteurs
    // La vérification de rate limit ajoutait 100-200ms par requête

    const body: ProxyRequest = await req.json();
    const { service, params } = body;

    if (!service || !params) {
      throw new Error('Missing service or params');
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('[Google Maps Proxy] API key not configured');
      throw new Error('Google Maps API key not configured');
    }

    let googleApiUrl: string;
    const urlParams = new URLSearchParams({ ...params, key: GOOGLE_MAPS_API_KEY });

    switch (service) {
      case 'geocode':
        googleApiUrl = `https://maps.googleapis.com/maps/api/geocode/json?${urlParams}`;
        break;
      case 'place-details':
        googleApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?${urlParams}`;
        break;
      case 'autocomplete':
        googleApiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${urlParams}`;
        break;
      case 'directions':
        googleApiUrl = `https://maps.googleapis.com/maps/api/directions/json?${urlParams}`;
        break;
      case 'distancematrix':
        googleApiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?${urlParams}`;
        break;
      default:
        throw new Error(`Unsupported service: ${service}`);
    }

    console.log(`[Google Maps Proxy] User ${user.id.substring(0, 8)}... calling ${service}`);

    // 🔧 Appel avec timeout de 25s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const googleResponse = await fetch(googleApiUrl, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const googleData = await googleResponse.json();
    const duration = Date.now() - startTime;

    console.log(`[Google Maps Proxy] ${service} completed in ${duration}ms - status: ${googleData.status}`);

    // 🔧 Log async simplifié (non-bloquant)
    supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'google_maps_api_call',
      description: `${service} - ${googleData.status}`,
      metadata: { service, duration_ms: duration }
    }).then(() => {}).catch(() => {});

    return new Response(JSON.stringify(googleData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Google Maps Proxy] Error after ${duration}ms:`, error.message);

    const status = error.message === 'Unauthorized' ? 401 : 
                   error.name === 'AbortError' ? 504 : 500;

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        status: error.name === 'AbortError' ? 'TIMEOUT' : 'ERROR'
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
