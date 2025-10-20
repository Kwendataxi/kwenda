import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  amount: number;
  provider: string;
  phoneNumber: string;
  currency?: string;
  orderId?: string;
  orderType?: 'transport' | 'delivery' | 'marketplace';
}

interface OrangeMoneyTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

interface OrangeMoneyPaymentResponse {
  status: string;
  order_id: string;
  pay_token: string;
  notif_token: string;
  payment_url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { amount, provider, phoneNumber, currency = "CDF", orderId, orderType }: PaymentRequest = await req.json();

    if (!amount || !provider || !phoneNumber) {
      throw new Error("Missing required fields: amount, provider, phoneNumber");
    }

    const supportedProviders = ['airtel', 'orange', 'mpesa'];
    if (!supportedProviders.includes(provider.toLowerCase())) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Validation spécifique Orange Money
    if (provider.toLowerCase() === 'orange') {
      // Montant min/max pour Orange Money Congo
      if (amount < 500 || amount > 500000) {
        throw new Error('Montant Orange Money doit être entre 500 et 500,000 CDF');
      }

      // Validation format téléphone Congo (+243...)
      const phoneRegex = /^\+?243[0-9]{9}$/;
      const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Format téléphone invalide. Utilisez +243XXXXXXXXX');
      }

      // Rate limiting : vérifier nombre de requêtes récentes
      const { data: recentTxs, error: rateLimitError } = await supabaseService
        .from('payment_transactions')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('payment_provider', 'orange')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()); // 1 minute

      if (!rateLimitError && recentTxs && recentTxs.length >= 5) {
        throw new Error('Trop de requêtes. Veuillez patienter 1 minute.');
      }
    }

    const transactionId = `KWENDA_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: transaction, error: insertError } = await supabaseService
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        currency: currency,
        payment_method: 'mobile_money',
        payment_provider: provider,
        transaction_id: transactionId,
        status: 'processing',
        booking_id: orderType === 'transport' ? orderId : null,
        delivery_id: orderType === 'delivery' ? orderId : null,
        product_id: orderType === 'marketplace' ? orderId : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to create payment record');
    }

    console.log(`Processing ${provider} payment for ${amount} ${currency} to ${phoneNumber}`);
    
    // ===== INTÉGRATION ORANGE MONEY RÉELLE =====
    if (provider.toLowerCase() === 'orange') {
      try {
        console.log('🍊 Starting Orange Money API integration');

        const orangeApiUrl = Deno.env.get('ORANGE_MONEY_API_URL');
        const clientId = Deno.env.get('ORANGE_MONEY_CLIENT_ID');
        const clientSecret = Deno.env.get('ORANGE_MONEY_CLIENT_SECRET');
        const authHeader = Deno.env.get('ORANGE_MONEY_AUTH_HEADER');
        const merchantId = Deno.env.get('ORANGE_MONEY_MERCHANT_ID');

        if (!orangeApiUrl || !clientId || !clientSecret || !authHeader || !merchantId) {
          throw new Error('Orange Money API configuration missing');
        }

        // Étape 1 : Obtenir le token OAuth
        console.log('🔑 Getting OAuth token...');
        const tokenResponse = await fetch(`${orangeApiUrl}/oauth/token`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('❌ Token error:', errorText);
          throw new Error(`OAuth token failed: ${tokenResponse.status}`);
        }

        const tokenData: OrangeMoneyTokenResponse = await tokenResponse.json();
        console.log('✅ OAuth token obtained');

        // Étape 2 : Initier le paiement
        console.log('💳 Initiating payment...');
        const cleanPhone = phoneNumber.replace(/^\+?243/, ''); // Retirer +243
        
        const paymentPayload = {
          merchant_key: merchantId,
          currency: 'OUV', // Orange Unit Value pour CDF
          order_id: transactionId,
          amount: amount,
          return_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/orange-money-webhook`,
          cancel_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/orange-money-webhook`,
          notif_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/orange-money-webhook`,
          lang: 'fr',
          reference: `KWENDA-${Date.now()}`,
        };

        const paymentResponse = await fetch(`${orangeApiUrl}/webpayment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(paymentPayload),
        });

        if (!paymentResponse.ok) {
          const errorText = await paymentResponse.text();
          console.error('❌ Payment initiation error:', errorText);
          throw new Error(`Payment initiation failed: ${paymentResponse.status}`);
        }

        const paymentData: OrangeMoneyPaymentResponse = await paymentResponse.json();
        console.log('✅ Payment initiated:', paymentData.order_id);

        // Mettre à jour la transaction avec les détails Orange
        const { error: updateError } = await supabaseService
          .from('payment_transactions')
          .update({
            status: 'processing',
            metadata: {
              orange_order_id: paymentData.order_id,
              orange_pay_token: paymentData.pay_token,
              orange_notif_token: paymentData.notif_token,
              orange_payment_url: paymentData.payment_url,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        if (updateError) {
          console.error('Error updating transaction metadata:', updateError);
        }

        // Retourner la réponse avec l'URL de paiement
        return new Response(
          JSON.stringify({
            success: true,
            transactionId: transactionId,
            message: 'Paiement Orange Money initié. Suivez les instructions sur votre téléphone.',
            status: 'processing',
            paymentUrl: paymentData.payment_url,
            payToken: paymentData.pay_token,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );

      } catch (orangeError) {
        console.error('❌ Orange Money integration error:', orangeError);
        
        // Marquer la transaction comme échouée
        await supabaseService
          .from('payment_transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        throw new Error(
          orangeError instanceof Error 
            ? orangeError.message 
            : 'Erreur Orange Money. Veuillez réessayer.'
        );
      }
    }

    // ===== FALLBACK POUR AUTRES PROVIDERS (Airtel, M-Pesa) =====
    console.log(`⚠️ Using simulation for provider: ${provider}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate payment success (90% success rate for demo)
    const paymentSuccess = Math.random() > 0.1;

    if (paymentSuccess) {
      const { error: updateError } = await supabaseService
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          transactionId: transactionId,
          message: `Paiement de ${amount} ${currency} effectué avec succès via ${provider}`,
          status: 'completed'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      const { error: updateError } = await supabaseService
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }

      throw new Error('Payment failed. Please try again or use a different payment method.');
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Échec du paiement. Veuillez réessayer.'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});