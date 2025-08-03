import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreditRequest {
  action: 'topup' | 'deduct' | 'check'
  driver_id: string
  amount?: number
  payment_method?: string
  reference_type?: string
  reference_id?: string
  description?: string
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

    const { action, driver_id, amount, payment_method, reference_type, reference_id, description } = await req.json() as CreditRequest

    // Validate input
    if (!action || !driver_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get or create driver credits
    let { data: credits, error: creditsError } = await supabaseService
      .from('driver_credits')
      .select('*')
      .eq('driver_id', driver_id)
      .single()

    if (creditsError || !credits) {
      // Create new credit account
      const { data: newCredits, error: createError } = await supabaseService
        .from('driver_credits')
        .insert({
          driver_id,
          balance: 0,
          total_earned: 0,
          total_spent: 0,
          currency: 'CDF'
        })
        .select()
        .single()

      if (createError) {
        return new Response(JSON.stringify({ error: 'Failed to create credit account' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      credits = newCredits
    }

    switch (action) {
      case 'check':
        return new Response(JSON.stringify({
          success: true,
          credits,
          low_balance: credits.balance < 1000
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'topup':
        if (!amount || !payment_method) {
          return new Response(JSON.stringify({ error: 'Amount and payment method required for topup' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Check user permission (must be the driver or system)
        if (user.id !== driver_id) {
          return new Response(JSON.stringify({ error: 'Unauthorized credit access' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Simulate mobile money payment
        const paymentSuccess = Math.random() > 0.1 // 90% success rate

        if (!paymentSuccess) {
          await supabaseService.from('activity_logs').insert({
            user_id: driver_id,
            activity_type: 'credit_topup_failed',
            description: `Failed credit topup of ${amount} CDF`,
            amount,
            currency: 'CDF',
            metadata: { payment_method }
          })

          return new Response(JSON.stringify({ 
            error: 'Payment failed', 
            message: 'Unable to process mobile money payment. Please try again.' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Update credit balance
        const newBalance = credits.balance + amount
        const newTotalEarned = credits.total_earned + amount

        const { error: updateError } = await supabaseService
          .from('driver_credits')
          .update({
            balance: newBalance,
            total_earned: newTotalEarned,
            last_topup_date: new Date().toISOString(),
            low_balance_alert_sent: false
          })
          .eq('driver_id', driver_id)

        if (updateError) {
          return new Response(JSON.stringify({ error: 'Failed to update credits' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Record transaction
        await supabaseService.from('credit_transactions').insert({
          driver_id,
          transaction_type: 'topup',
          amount,
          currency: 'CDF',
          description: description || `Recharge de crédits via ${payment_method}`,
          balance_before: credits.balance,
          balance_after: newBalance
        })

        // Log activity
        await supabaseService.from('activity_logs').insert({
          user_id: driver_id,
          activity_type: 'credit_topup',
          description: `Credit topup of ${amount} CDF`,
          amount,
          currency: 'CDF',
          metadata: { payment_method, new_balance: newBalance }
        })

        return new Response(JSON.stringify({
          success: true,
          new_balance: newBalance,
          message: 'Credits recharged successfully'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'deduct':
        if (!amount || !reference_type) {
          return new Response(JSON.stringify({ error: 'Amount and reference type required for deduction' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Check if sufficient balance
        if (credits.balance < amount) {
          // Send low balance notification if not already sent
          if (!credits.low_balance_alert_sent) {
            await supabaseService.from('system_notifications').insert({
              user_id: driver_id,
              notification_type: 'low_balance',
              title: 'Solde Insuffisant',
              message: `Votre solde de crédits est insuffisant (${credits.balance} CDF). Rechargez pour continuer à être visible.`,
              priority: 'high'
            })

            await supabaseService
              .from('driver_credits')
              .update({ low_balance_alert_sent: true })
              .eq('driver_id', driver_id)
          }

          return new Response(JSON.stringify({ 
            error: 'Insufficient credits',
            current_balance: credits.balance,
            required_amount: amount
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Deduct credits
        const deductedBalance = credits.balance - amount
        const newTotalSpent = credits.total_spent + amount

        const { error: deductError } = await supabaseService
          .from('driver_credits')
          .update({
            balance: deductedBalance,
            total_spent: newTotalSpent
          })
          .eq('driver_id', driver_id)

        if (deductError) {
          return new Response(JSON.stringify({ error: 'Failed to deduct credits' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Record transaction
        await supabaseService.from('credit_transactions').insert({
          driver_id,
          transaction_type: 'deduction',
          amount,
          currency: 'CDF',
          description: description || `Frais de ${reference_type}`,
          reference_type,
          reference_id,
          balance_before: credits.balance,
          balance_after: deductedBalance
        })

        return new Response(JSON.stringify({
          success: true,
          new_balance: deductedBalance,
          message: 'Credits deducted successfully'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

  } catch (error) {
    console.error('Credit management error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})