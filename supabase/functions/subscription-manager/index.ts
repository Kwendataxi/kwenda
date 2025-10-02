import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionRequest {
  plan_id: string
  payment_method: string
  driver_id: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify authentication
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { plan_id, payment_method, driver_id } = await req.json() as SubscriptionRequest

    // Validate input
    if (!plan_id || !payment_method || !driver_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is the driver
    if (user.id !== driver_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized driver access' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get subscription plan details
    const { data: plan, error: planError } = await supabaseService
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Invalid subscription plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if driver has an active subscription
    const { data: existingSubscription } = await supabaseService
      .from('driver_subscriptions')
      .select('*')
      .eq('driver_id', driver_id)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      return new Response(JSON.stringify({ error: 'Driver already has an active subscription' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Calculate subscription dates
    const startDate = new Date()
    const endDate = new Date()
    if (plan.duration_type === 'weekly') {
      endDate.setDate(startDate.getDate() + 7)
    } else if (plan.duration_type === 'monthly') {
      endDate.setDate(startDate.getDate() + 30)
    }

    // Simulate mobile money payment
    const paymentSuccess = Math.random() > 0.1 // 90% success rate

    if (!paymentSuccess) {
      // Log failed payment attempt
      await supabaseService.from('activity_logs').insert({
        user_id: driver_id,
        activity_type: 'subscription_payment_failed',
        description: `Failed subscription payment for plan ${plan.name}`,
        amount: plan.price,
        currency: plan.currency,
        metadata: { plan_id, payment_method }
      })

      return new Response(JSON.stringify({ 
        error: 'Payment failed', 
        message: 'Unable to process mobile money payment. Please try again.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create subscription record with rides
    const { data: subscription, error: subscriptionError } = await supabaseService
      .from('driver_subscriptions')
      .insert({
        driver_id,
        plan_id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_method,
        last_payment_date: startDate.toISOString(),
        next_payment_date: endDate.toISOString(),
        rides_used: 0,
        rides_remaining: plan.rides_included,
        is_trial: plan.is_trial || false
      })
      .select()
      .single()

    if (subscriptionError) {
      return new Response(JSON.stringify({ error: 'Failed to create subscription' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validation: vérifier qu'il a des courses disponibles
    if (plan.rides_included === 0) {
      return new Response(JSON.stringify({ 
        error: 'Invalid plan: no rides included' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log successful subscription with rides
    await supabaseService.from('activity_logs').insert({
      user_id: driver_id,
      activity_type: 'subscription_activated',
      description: `Activated subscription plan: ${plan.name} (${plan.rides_included} courses)`,
      amount: plan.price,
      currency: plan.currency,
      metadata: { 
        plan_id, 
        subscription_id: subscription.id, 
        payment_method,
        rides_included: plan.rides_included,
        rides_remaining: plan.rides_included
      }
    })

    // Send system notification with rides info
    await supabaseService.from('system_notifications').insert({
      user_id: driver_id,
      notification_type: 'subscription_activated',
      title: 'Abonnement Activé',
      message: `Votre abonnement ${plan.name} a été activé avec ${plan.rides_included} courses incluses !`,
      data: { 
        subscription_id: subscription.id, 
        plan_name: plan.name,
        rides_included: plan.rides_included,
        end_date: endDate.toISOString()
      },
      priority: 'high'
    })

    return new Response(JSON.stringify({
      success: true,
      subscription,
      message: 'Subscription activated successfully',
      next_payment_date: endDate.toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Subscription manager error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})