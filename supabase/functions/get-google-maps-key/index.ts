import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔑 get-google-maps-key called')
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    const googleMapsMapId = Deno.env.get('GOOGLE_MAPS_MAP_ID')
    
    if (!googleMapsApiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY not found in environment variables')
      console.log('📋 Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('GOOGLE') || k.includes('MAP')))
      throw new Error('Google Maps API key not configured')
    }

    if (!googleMapsMapId) {
      console.error('❌ GOOGLE_MAPS_MAP_ID not found in environment variables')
      throw new Error('Google Maps Map ID not configured')
    }

    console.log('✅ Google Maps API key found:', googleMapsApiKey.substring(0, 10) + '...')
    console.log('✅ Google Maps Map ID found:', googleMapsMapId)
    
    return new Response(
      JSON.stringify({ 
        apiKey: googleMapsApiKey,
        mapId: googleMapsMapId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error in get-google-maps-key:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})