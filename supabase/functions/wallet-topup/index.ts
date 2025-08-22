import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log("🚀 Début du processus de topup");
    
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

    console.log(`👤 Utilisateur authentifié: ${user.id}`);

    // Parse request body
    const { amount, provider, phone, currency = 'CDF' } = await req.json();
    
    console.log(`📝 Données reçues:`, { amount, provider, phone, currency });

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

    console.log(`✅ Validation passée - Provider: ${provider}`);

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
      console.log("💳 Création d'un nouveau wallet");
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
    console.log(`💰 Balance actuelle: ${currentBalance}`);

    // Generate transaction ID
    const transactionId = `top_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔗 Transaction ID généré: ${transactionId}`);

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

    console.log(`💳 Transaction créée en DB avec status 'processing'`);

    // 🚨 GESTION SPÉCIFIQUE ORANGE MONEY
    if (provider === "orange") {
      console.log("🍊 === DÉBUT TRAITEMENT ORANGE MONEY ===");
      
      const ORANGE_CLIENT_ID = Deno.env.get("ORANGE_CLIENT_ID");
      const ORANGE_CLIENT_SECRET = Deno.env.get("ORANGE_CLIENT_SECRET");
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

      console.log("🔑 Variables d'environnement Orange:");
      console.log(`   - CLIENT_ID: ${ORANGE_CLIENT_ID ? 'Défini' : 'MANQUANT'}`);
      console.log(`   - CLIENT_SECRET: ${ORANGE_CLIENT_SECRET ? 'Défini' : 'MANQUANT'}`);
      console.log(`   - SUPABASE_URL: ${SUPABASE_URL ? 'Défini' : 'MANQUANT'}`);

      if (!ORANGE_CLIENT_ID || !ORANGE_CLIENT_SECRET) {
        throw new Error("Variables d'environnement Orange manquantes");
      }

      try {
        // 1. Authentification Orange
        console.log("🔐 Tentative d'authentification Orange...");
        const authString = btoa(`${ORANGE_CLIENT_ID}:${ORANGE_CLIENT_SECRET}`);
        
        const tokenRes = await fetch("https://api.orange.com/oauth/v3/token", {
          method: "POST",
          headers: {
            "Authorization": `Basic ${authString}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "grant_type=client_credentials",
        });

        const tokenData = await tokenRes.json();
        console.log("🔑 Réponse authentification Orange:", tokenData);

        if (!tokenRes.ok) {
          console.error("❌ Échec authentification Orange:", tokenData);
          throw new Error(`Orange Auth failed: ${JSON.stringify(tokenData)}`);
        }

        const accessToken = tokenData.access_token;
        console.log("✅ Token Orange obtenu");

        // 2. Initialisation du paiement
        console.log("💳 Initialisation du paiement Orange...");
        const callbackUrl = `${SUPABASE_URL}/functions/v1/orange-callback`;
        console.log(`📞 Callback URL: ${callbackUrl}`);

        const paymentPayload = {
          order_id: transactionId,
          amount: amount,
          currency: currency,
          lang: "fr",
          reference: "wallet-topup",
          return_url: callbackUrl,
          cancel_url: callbackUrl,
          notif_url: callbackUrl,
        };

        console.log("📤 Payload paiement:", paymentPayload);

        const paymentRes = await fetch("https://api.orange.com/orange-money-webpay/dev/v1/webpayment", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentPayload),
        });

        const paymentData = await paymentRes.json();
        console.log("💳 Réponse paiement Orange:", paymentData);

        if (!paymentRes.ok) {
          console.error("❌ Échec initialisation paiement:", paymentData);
          throw new Error(`Orange payment init failed: ${JSON.stringify(paymentData)}`);
        }

        console.log("✅ Paiement Orange initialisé avec succès");
        console.log(`🌐 URL de paiement: ${paymentData.payment_url}`);

        // Mettre à jour le statut de la transaction
        await supabaseService
          .from('payment_transactions')
          .update({ 
            status: 'pending',
            metadata: paymentData 
          })
          .eq('transaction_id', transactionId);

        console.log("🍊 === FIN TRAITEMENT ORANGE MONEY ===");

        return new Response(
          JSON.stringify({
            success: true,
            transaction_id: transactionId,
            payment_url: paymentData.payment_url,
            message: "Veuillez valider le paiement Orange Money",
            provider: "orange"
          }),
          { 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json" 
            }, 
            status: 200 
          }
        );

      } catch (orangeError) {
        console.error("💥 Erreur Orange Money:", orangeError);
        
        // Mettre à jour le statut en échec
        await supabaseService
          .from('payment_transactions')
          .update({ status: 'failed' })
          .eq('transaction_id', transactionId);

        throw new Error(`Erreur Orange Money: ${orangeError.message}`);
      }
    }

    // === TRAITEMENT AUTRES PROVIDERS (Airtel, M-Pesa) ===
    console.log(`📱 Traitement ${provider} Money`);

    // Simulate Mobile Money payment processing
    console.log(`Processing ${provider} Money payment: ${amount} ${currency} from ${phone}`);
    
    // Add realistic delay
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Simulate success rate (90% success)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      // Get commission settings for wallet top-up
      const { data: commissionData, error: commissionError } = await supabaseService
        .from('commission_settings')
        .select('*')
        .eq('service_type', 'wallet_topup')
        .eq('is_active', true)
        .maybeSingle();

      if (commissionError) {
        console.error('Error fetching commission settings:', commissionError);
      }

      const adminRate = commissionData?.admin_rate || 2.5;
      const adminCommission = amount * adminRate / 100;
      const netAmount = amount - adminCommission;

      console.log(`Processing payment: ${amount} CDF, Admin commission: ${adminCommission} CDF, Net amount: ${netAmount} CDF`);

      // Update wallet balance with net amount
      const newBalance = currentBalance + netAmount;
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

      // Create wallet transaction records...
      // [Rest of the existing wallet transaction logic]

      return new Response(JSON.stringify({
        success: true,
        transaction_id: transactionId,
        message: `Rechargement réussi. Montant crédité: ${netAmount.toFixed(0)} CDF (frais: ${adminCommission.toFixed(0)} CDF)`,
        new_balance: newBalance,
        gross_amount: amount,
        admin_commission: adminCommission,
        net_amount: netAmount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } else {
      // Payment failed
      await supabaseService
        .from('payment_transactions')
        .update({ status: 'failed' })
        .eq('transaction_id', transactionId);

      throw new Error('Échec du paiement Mobile Money. Veuillez réessayer.');
    }

  } catch (error) {
    console.error('💥 Erreur globale wallet top-up:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erreur interne du serveur'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});