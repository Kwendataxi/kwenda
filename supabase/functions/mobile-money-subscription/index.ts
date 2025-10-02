import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MobileMoneyPaymentRequest {
  planId: string;
  phoneNumber: string;
  paymentProvider: 'orange_money' | 'm_pesa' | 'airtel_money';
  amount: number;
  currency: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    );

    // Vérifier l'authentification
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { planId, phoneNumber, paymentProvider, amount, currency }: MobileMoneyPaymentRequest = await req.json();

    console.log(`Processing Mobile Money payment for user ${user.id}, plan ${planId}`);

    // Vérifier que l'utilisateur est un chauffeur
    const { data: driver, error: driverError } = await supabaseClient
      .from('chauffeurs')
      .select('id, user_id, display_name')
      .eq('user_id', user.id)
      .single();

    if (driverError || !driver) {
      return new Response(
        JSON.stringify({ error: 'Chauffeur introuvable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Récupérer les détails du plan
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Plan d\'abonnement introuvable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Vérifier que le montant correspond
    if (plan.price !== amount) {
      return new Response(
        JSON.stringify({ error: 'Le montant ne correspond pas au prix du plan' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // ===================================
    // SIMULATION PAIEMENT MOBILE MONEY
    // ===================================
    // TODO: Intégrer avec l'API réelle du provider (Orange Money, M-Pesa, Airtel Money)
    // Pour l'instant, on simule un paiement réussi
    
    const transactionRef = `MM_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    console.log(`Simulating ${paymentProvider} payment for ${amount} ${currency}`);
    console.log(`Transaction reference: ${transactionRef}`);

    // Dans un environnement de production, ici on appellerait l'API Mobile Money:
    // const paymentResult = await initiateOrangeMoneyPayment({
    //   amount,
    //   currency,
    //   phoneNumber,
    //   reference: transactionRef
    // });

    // Simuler un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simuler une réponse de succès (à remplacer par la vraie API)
    const paymentSuccess = true; // Simulé
    const externalTransactionId = `EXT_${transactionRef}`;

    if (!paymentSuccess) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Paiement échoué. Veuillez réessayer.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // ===================================
    // CRÉER L'ABONNEMENT APRÈS PAIEMENT
    // ===================================

    const startDate = new Date();
    const endDate = new Date();
    
    // Calculer la date de fin selon duration_type
    if (plan.duration_type === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.duration_type === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (plan.duration_type === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('driver_subscriptions')
      .insert({
        driver_id: user.id,
        plan_id: planId,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        payment_method: paymentProvider,
        last_payment_date: new Date().toISOString(),
        rides_used: 0,
        rides_remaining: plan.rides_included || 0,
        is_trial: false,
        auto_renew: true
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de l\'abonnement', details: subscriptionError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Logger la transaction dans wallet_transactions
    await supabaseClient.from('wallet_transactions').insert({
      user_id: user.id,
      transaction_type: 'subscription_payment',
      amount,
      currency,
      description: `Abonnement ${plan.name}`,
      reference_id: subscription.id,
      reference_type: 'subscription',
      metadata: {
        payment_provider: paymentProvider,
        phone_number: phoneNumber,
        transaction_ref: transactionRef,
        external_transaction_id: externalTransactionId
      }
    });

    console.log(`Subscription created successfully: ${subscription.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          plan_name: plan.name,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          rides_included: plan.rides_included,
          rides_remaining: subscription.rides_remaining,
          amount_paid: amount,
          currency,
          payment_method: paymentProvider,
          transaction_reference: transactionRef
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in mobile-money-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});