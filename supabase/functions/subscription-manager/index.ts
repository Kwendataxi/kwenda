import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionRequest {
  driver_id: string
  plan_id: string
  payment_method: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { driver_id, plan_id, payment_method }: SubscriptionRequest = await req.json()

    console.log('📦 Subscription Request:', { driver_id, plan_id, payment_method })

    // 1. Récupérer le plan d'abonnement
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single()

    if (planError || !plan) {
      throw new Error('Plan d\'abonnement introuvable')
    }

    console.log('✅ Plan trouvé:', plan.name, plan.price, plan.currency)

    // 2. Calculer les dates d'abonnement
    const startDate = new Date()
    const endDate = new Date()
    
    if (plan.duration_type === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (plan.duration_type === 'daily') {
      endDate.setDate(endDate.getDate() + 1)
    } else if (plan.duration_type === 'weekly') {
      endDate.setDate(endDate.getDate() + 7)
    }

    // 3. Créer l'abonnement
    const { data: subscription, error: subscriptionError } = await supabase
      .from('driver_subscriptions')
      .insert({
        driver_id,
        plan_id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_method,
        auto_renew: true,
        rides_remaining: plan.max_rides_per_day || 999,
        rides_used: 0
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('❌ Erreur création abonnement:', subscriptionError)
      throw subscriptionError
    }

    console.log('✅ Abonnement créé:', subscription.id)

    // 4. Vérifier si le chauffeur a un partenaire
    const { data: driverCode, error: driverCodeError } = await supabase
      .from('driver_codes')
      .select('partner_id')
      .eq('driver_id', driver_id)
      .maybeSingle()

    if (driverCodeError) {
      console.error('⚠️ Erreur vérification partenaire:', driverCodeError)
    }

    // 5. Si partenaire trouvé, appeler l'Edge Function de commission
    if (driverCode && driverCode.partner_id) {
      console.log('🎯 Partenaire détecté:', driverCode.partner_id)
      console.log('💰 Invocation Edge Function partner-subscription-commission...')

      try {
        const { data: commissionData, error: commissionError } = await supabase.functions.invoke(
          'partner-subscription-commission',
          {
            body: {
              subscription_id: subscription.id,
              driver_id,
              subscription_amount: plan.price,
              partner_id: driverCode.partner_id
            }
          }
        )

        if (commissionError) {
          console.error('❌ Erreur commission partenaire:', commissionError)
        } else {
          console.log('✅ Commission partenaire créée:', commissionData)
        }
      } catch (commissionErr) {
        console.error('❌ Exception commission:', commissionErr)
      }
    } else {
      console.log('ℹ️ Aucun partenaire lié à ce chauffeur')
    }

    // 6. Logger l'activité
    await supabase
      .from('activity_logs')
      .insert({
        user_id: driver_id,
        activity_type: 'driver_subscription',
        description: `Abonnement ${plan.name} activé`,
        metadata: {
          plan_id,
          subscription_id: subscription.id,
          amount: plan.price,
          currency: plan.currency,
          payment_method
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        subscription,
        message: 'Abonnement créé avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur subscription-manager:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
