import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RATE_LIMIT_ENDPOINT = 'google_maps_key_requests'
const MAX_REQUESTS_PER_HOUR = 100

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const now = new Date()
  const resetTime = new Date(now.getTime() + 3600000) // +1 hour

  // Get or create rate limit record
  const { data: existingLimit } = await supabase
    .from('api_rate_limits')
    .select('request_count, reset_at')
    .eq('user_id', userId)
    .eq('endpoint', RATE_LIMIT_ENDPOINT)
    .maybeSingle()

  // Reset if expired or first request
  if (!existingLimit || new Date(existingLimit.reset_at) < now) {
    await supabase.from('api_rate_limits').upsert({
      user_id: userId,
      endpoint: RATE_LIMIT_ENDPOINT,
      request_count: 1,
      reset_at: resetTime.toISOString()
    })
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - 1 }
  }

  // Check if limit exceeded
  if (existingLimit.request_count >= MAX_REQUESTS_PER_HOUR) {
    return { allowed: false, remaining: 0 }
  }

  // Increment counter
  await supabase
    .from('api_rate_limits')
    .update({ request_count: existingLimit.request_count + 1 })
    .eq('user_id', userId)
    .eq('endpoint', RATE_LIMIT_ENDPOINT)

  return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - existingLimit.request_count - 1 }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ✅ SÉCURITÉ CRITIQUE: Vérifier l'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No authorization header')
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    // Extract user ID from JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    console.log(`🔑 get-google-maps-key called by user ${user.id}`)

    // ✅ SÉCURITÉ CRITIQUE: Vérifier le rate limiting
    const rateLimitCheck = await checkRateLimit(user.id)
    if (!rateLimitCheck.allowed) {
      console.warn(`⚠️ Rate limit exceeded for user ${user.id}`)
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 3600 // seconds
        }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '3600'
          },
          status: 429,
        },
      )
    }

    console.log(`✅ Rate limit OK - ${rateLimitCheck.remaining} requests remaining`)

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    const googleMapsMapId = Deno.env.get('GOOGLE_MAPS_MAP_ID')
    
    if (!googleMapsApiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY not found in environment variables')
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
        mapId: googleMapsMapId,
        requestsRemaining: rateLimitCheck.remaining
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
          'X-RateLimit-Limit': MAX_REQUESTS_PER_HOUR.toString()
        },
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