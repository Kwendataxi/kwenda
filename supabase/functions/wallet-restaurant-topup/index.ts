import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TopUpRequest {
  amount: number;
  payment_method: 'orange_money' | 'm_pesa' | 'airtel_money';
  phone_number: string;
  currency: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💰 [wallet-restaurant-topup] Starting top-up process');

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
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ [wallet-restaurant-topup] Auth error:', authError);
      throw new Error('Non authentifié');
    }

    console.log('✅ [wallet-restaurant-topup] User authenticated:', user.id);

    // Vérifier que l'utilisateur est un restaurant
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurant_profiles')
      .select('id, restaurant_name')
      .eq('user_id', user.id)
      .single();

    if (restaurantError || !restaurant) {
      console.error('❌ [wallet-restaurant-topup] Not a restaurant:', restaurantError);
      throw new Error('Profil restaurant non trouvé');
    }

    console.log('✅ [wallet-restaurant-topup] Restaurant found:', restaurant.restaurant_name);

    const body: TopUpRequest = await req.json();
    const { amount, payment_method, phone_number, currency } = body;

    // Validation
    if (!amount || amount < 5000 || amount > 500000) {
      throw new Error('Montant invalide (min: 5000, max: 500000)');
    }

    if (!phone_number || phone_number.length < 9) {
      throw new Error('Numéro de téléphone invalide');
    }

    console.log('💰 [wallet-restaurant-topup] Processing:', {
      amount,
      payment_method,
      phone_number,
      currency,
    });

    // Calculer les frais (2%)
    const feesAmount = amount * 0.02;
    const netAmount = amount - feesAmount;

    // Générer référence unique
    const transactionRef = `REST-TOP-${Date.now()}-${user.id.slice(0, 8)}`;

    // Récupérer ou créer le wallet
    let { data: wallet, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .eq('currency', currency)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      console.log('💰 [wallet-restaurant-topup] Creating new wallet');
      const { data: newWallet, error: createError } = await supabaseClient
        .from('user_wallets')
        .insert({
          user_id: user.id,
          balance: 0,
          bonus_balance: 0,
          currency: currency,
        })
        .select()
        .single();

      if (createError) throw createError;
      wallet = newWallet;
    } else if (walletError) {
      throw walletError;
    }

    console.log('💰 [wallet-restaurant-topup] Wallet found:', wallet?.id);

    // Simulation du paiement Mobile Money
    // En production, appeler l'API réelle du provider
    console.log(`📱 [wallet-restaurant-topup] Simulating ${payment_method} payment to ${phone_number}`);

    // Pour la démo, on approuve immédiatement
    const paymentSuccessful = true;

    if (paymentSuccessful) {
      // Créditer le wallet
      const { error: updateError } = await supabaseClient
        .from('user_wallets')
        .update({
          balance: (wallet!.balance || 0) + netAmount,
        })
        .eq('id', wallet!.id);

      if (updateError) {
        console.error('❌ [wallet-restaurant-topup] Update error:', updateError);
        throw updateError;
      }

      console.log('✅ [wallet-restaurant-topup] Wallet updated with:', netAmount);

      // Logger la transaction
      const { error: txError } = await supabaseClient.from('wallet_transactions').insert({
        user_id: user.id,
        transaction_type: 'credit',
        amount: netAmount,
        currency: currency,
        description: `Recharge wallet restaurant via ${payment_method}`,
        reference_id: transactionRef,
        reference_type: 'top_up',
        status: 'completed',
        metadata: {
          payment_method,
          phone_number,
          fees_amount: feesAmount,
          gross_amount: amount,
        },
      });

      if (txError) {
        console.error('⚠️ [wallet-restaurant-topup] Transaction log error:', txError);
      }

      // Notification (optionnelle)
      console.log('📧 [wallet-restaurant-topup] Sending notification to restaurant');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Recharge effectuée avec succès',
          transaction_ref: transactionRef,
          net_amount: netAmount,
          fees_amount: feesAmount,
          new_balance: (wallet!.balance || 0) + netAmount,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error('Paiement Mobile Money échoué');
    }
  } catch (error: any) {
    console.error('❌ [wallet-restaurant-topup] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors de la recharge',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
