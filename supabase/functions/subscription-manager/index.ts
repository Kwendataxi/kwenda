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

    // Create subscription record
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
        next_payment_date: endDate.toISOString()
      })
      .select()
      .single()

    if (subscriptionError) {
      return new Response(JSON.stringify({ error: 'Failed to create subscription' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize driver credits if not exists
    const { data: existingCredits } = await supabaseService
      .from('driver_credits')
      .select('*')
      .eq('driver_id', driver_id)
      .single()

    if (!existingCredits) {
      await supabaseService
        .from('driver_credits')
        .insert({
          driver_id,
          balance: 10000, // Bonus initial credits
          total_earned: 10000,
          currency: plan.currency
        })

      // Log initial credit bonus
      await supabaseService.from('credit_transactions').insert({
        driver_id,
        transaction_type: 'bonus',
        amount: 10000,
        currency: plan.currency,
        description: 'Bonus crédits d\'activation d\'abonnement',
        reference_type: 'subscription',
        reference_id: subscription.id,
        balance_before: 0,
        balance_after: 10000
      })
    }

    // Log successful subscription
    await supabaseService.from('activity_logs').insert({
      user_id: driver_id,
      activity_type: 'subscription_activated',
      description: `Activated subscription plan: ${plan.name}`,
      amount: plan.price,
      currency: plan.currency,
      metadata: { plan_id, subscription_id: subscription.id, payment_method }
    })

    // Send system notification
    await supabaseService.from('system_notifications').insert({
      user_id: driver_id,
      notification_type: 'subscription_activated',
      title: 'Abonnement Activé',
      message: `Votre abonnement ${plan.name} a été activé avec succès !`,
      data: { subscription_id: subscription.id, plan_name: plan.name },
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