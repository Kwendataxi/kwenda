import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TopUpRequest {
  amount: number;
  provider: string;
  phone: string;
  currency?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorisation manquante');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Parse request body
    const { amount, provider, phone, currency = 'CDF' }: TopUpRequest = await req.json();

    // Validate input
    if (!amount || amount <= 0) {
      throw new Error('Montant invalide');
    }

    if (!provider || !['airtel', 'orange', 'mpesa'].includes(provider)) {
      throw new Error('Opérateur non supporté');
    }

    if (!phone) {
      throw new Error('Numéro de téléphone requis');
    }

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get or create user wallet
    let { data: wallet, error: walletError } = await supabaseService
      .from('user_wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabaseService
        .from('user_wallets')
        .insert({
          user_id: user.id,
          balance: 0,
          currency: currency,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Erreur création wallet: ${createError.message}`);
      }
      wallet = newWallet;
    } else if (walletError) {
      throw new Error(`Erreur wallet: ${walletError.message}`);
    }

    const currentBalance = wallet?.balance || 0;

    // Generate transaction ID
    const transactionId = `top_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment transaction record
    const { error: paymentError } = await supabaseService
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        currency: currency,
        payment_method: `${provider}_money`,
        payment_provider: provider,
        transaction_id: transactionId,
        status: 'processing'
      });

    if (paymentError) {
      throw new Error(`Erreur transaction: ${paymentError.message}`);
    }

    // Simulate Mobile Money payment processing
    console.log(`Processing ${provider} Money payment: ${amount} ${currency} from ${phone}`);
    
    // Add realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simulate success rate (90% success)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      // Update wallet balance
      const newBalance = currentBalance + amount;
      
      const { error: updateWalletError } = await supabaseService
        .from('user_wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateWalletError) {
        throw new Error(`Erreur mise à jour wallet: ${updateWalletError.message}`);
      }

      // Create wallet transaction record
      const { error: walletTxError } = await supabaseService
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          transaction_type: 'credit',
          amount: amount,
          currency: currency,
          description: `Rechargement via ${provider} Money`,
          reference_type: 'topup',
          status: 'completed',
          payment_method: `${provider}_money`,
          balance_before: currentBalance,
          balance_after: newBalance
        });

      if (walletTxError) {
        console.error('Wallet transaction error:', walletTxError);
      }

      // Update payment transaction status
      await supabaseService
        .from('payment_transactions')
        .update({ status: 'completed' })
        .eq('transaction_id', transactionId);

      // Log activity
      await supabaseService
        .from('activity_logs')
        .insert({
          user_id: user.id,
          activity_type: 'payment',
          description: `Rechargement Kwenda Pay: ${amount} ${currency} via ${provider} Money`,
          amount: amount,
          currency: currency,
          reference_type: 'wallet_topup',
          metadata: {
            provider: provider,
            phone: phone,
            transaction_id: transactionId
          }
        });

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transactionId,
          message: 'Rechargement réussi',
          new_balance: newBalance
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );

    } else {
      // Payment failed - update transaction status
      await supabaseService
        .from('payment_transactions')
        .update({ status: 'failed' })
        .eq('transaction_id', transactionId);

      throw new Error('Échec du paiement Mobile Money. Veuillez réessayer.');
    }

  } catch (error: any) {
    console.error('Wallet top-up error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur interne du serveur'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});