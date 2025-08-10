import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()

    switch (action) {
      case 'find_drivers':
        // Mock response for demo
        const mockDrivers = [{
          driver_id: 'demo_driver_1',
          distance: 1.2,
          estimated_arrival: 8,
          driver_profile: {
            user_id: 'demo_driver_1',
            vehicle_type: 'Moto Honda',
            vehicle_plate: 'KIN-1234',
            vehicle_color: 'Bleu',
            rating_average: 4.8,
            rating_count: 152,
            display_name: 'Jean-Paul K.',
            phone_number: '+243900000001'
          },
          vehicle_type: 'moto'
        }]

        return new Response(
          JSON.stringify({ success: true, drivers: mockDrivers }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non reconnue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})