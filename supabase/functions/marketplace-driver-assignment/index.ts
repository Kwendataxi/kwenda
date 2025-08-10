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
    console.log('Marketplace driver assignment action:', action, params)

    switch (action) {
      case 'find_marketplace_drivers':
        // Mock response for demo
        const mockDrivers = [{
          driver_id: 'marketplace_driver_1',
          distance: 1.5,
          estimated_arrival: 12,
          driver_profile: {
            user_id: 'marketplace_driver_1',
            vehicle_type: 'Véhicule de livraison',
            vehicle_plate: 'KIN-5678',
            vehicle_color: 'Blanc',
            rating_average: 4.6,
            rating_count: 89,
            display_name: 'Paul M.',
            phone_number: '+243900000003'
          },
          vehicle_type: 'car'
        }]

        return new Response(
          JSON.stringify({ 
            success: true, 
            drivers: mockDrivers,
            order_details: {
              product: 'Article marketplace',
              total_amount: 15000,
              delivery_fee: 3500
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      
      case 'assign_marketplace_driver':
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Livreur marketplace assigné avec succès' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non reconnue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
    }

  } catch (error) {
    console.error('Erreur marketplace-driver-assignment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})