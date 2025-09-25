import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { promoCode, orderAmount, serviceType } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Validate promo code
    const { data: promoData, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .single()

    if (promoError || !promoData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Code promo invalide ou expiré' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if service is applicable
    if (!promoData.applicable_services.includes(serviceType)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Ce code promo n\'est pas valide pour ce service' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check minimum order amount
    if (orderAmount < promoData.min_order_amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Montant minimum requis: ${promoData.min_order_amount} CDF` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check usage limits
    const { data: usage } = await supabase
      .from('promo_code_usage')
      .select('*')
      .eq('promo_code_id', promoData.id)
      .eq('user_id', user.id)

    if (usage && usage.length >= promoData.user_limit) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Vous avez déjà utilisé ce code promo' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate discount
    let discountAmount = 0
    let freeDelivery = false

    if (promoData.discount_type === 'percentage') {
      discountAmount = (orderAmount * promoData.discount_value) / 100
      if (promoData.max_discount_amount) {
        discountAmount = Math.min(discountAmount, promoData.max_discount_amount)
      }
    } else if (promoData.discount_type === 'fixed_amount') {
      discountAmount = Math.min(promoData.discount_value, orderAmount)
    } else if (promoData.discount_type === 'free_delivery') {
      freeDelivery = true
      discountAmount = 0 // Will be calculated based on delivery fee
    }

    // Apply special logic for delivery services
    if (serviceType === 'delivery' && freeDelivery) {
      // Get delivery fee from config
      const { data: deliveryConfig } = await supabase
        .from('delivery_fees')
        .select('base_fee')
        .eq('service_type', 'marketplace')
        .eq('is_active', true)
        .single()
      
      if (deliveryConfig) {
        discountAmount = deliveryConfig.base_fee
      }
    }

    // Calculate final amounts
    const finalOrderAmount = Math.max(0, orderAmount - discountAmount)
    const savings = orderAmount - finalOrderAmount

    console.log(`Promo code ${promoCode} validated for user ${user.id}`, {
      originalAmount: orderAmount,
      discountAmount,
      finalAmount: finalOrderAmount,
      freeDelivery
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          promoCode: promoData,
          discountAmount,
          finalAmount: finalOrderAmount,
          savings,
          freeDelivery,
          valid: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in calculate-promo-discount:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})