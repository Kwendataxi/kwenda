import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProxyRequest {
  service: 'geocode' | 'place-details' | 'autocomplete' | 'directions' | 'distancematrix';
  params: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Vérifier rate limiting
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseClient
      .from('api_rate_limits')
      .select('request_count, reset_at')
      .eq('user_id', user.id)
      .eq('endpoint', 'google-maps-proxy')
      .single();

    if (!rateLimitError && rateLimitCheck) {
      const resetTime = new Date(rateLimitCheck.reset_at);
      if (resetTime > new Date() && rateLimitCheck.request_count >= 100) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            limit: 100,
            resetAt: resetTime.toISOString(),
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Parser la requête
    const body: ProxyRequest = await req.json();
    const { service, params } = body;

    if (!service || !params) {
      throw new Error('Missing service or params');
    }

    // Récupérer la clé API Google Maps (stockée en secret)
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    // Construire l'URL selon le service
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

    console.log(`[Google Maps Proxy] User ${user.id} calling ${service}`);

    // Appeler l'API Google Maps (la clé reste côté serveur)
    const googleResponse = await fetch(googleApiUrl);
    const googleData = await googleResponse.json();

    // Mettre à jour le rate limit
    const resetAt = new Date();
    resetAt.setHours(resetAt.getHours() + 1);

    await supabaseClient.from('api_rate_limits').upsert({
      user_id: user.id,
      endpoint: 'google-maps-proxy',
      request_count: (rateLimitCheck?.request_count || 0) + 1,
      reset_at: resetAt.toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Logger l'usage pour monitoring
    await supabaseClient.from('security_audit_logs').insert({
      user_id: user.id,
      action_type: 'google_maps_api_call',
      resource_type: service,
      metadata: {
        service,
        params: Object.keys(params),
        status: googleData.status,
        timestamp: new Date().toISOString(),
      },
      success: true,
    });

    return new Response(JSON.stringify(googleData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Google Maps Proxy] Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
