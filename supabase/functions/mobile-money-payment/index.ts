import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Cache global pour le token OAuth (économise des appels API)
let cachedOAuthToken: { token: string; expiresAt: number } | null = null;

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
  orderType?: 'transport' | 'delivery' | 'marketplace' | 'wallet_topup' | 'partner_credit' | 'vendor_credit';
  userType?: 'client' | 'partner' | 'vendor' | 'restaurant';
}

interface OrangeMoneyTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

interface OrangeMoneyB2BResponse {
  transactionId: string;
  transactionStatus: string;
  partnerTransactionId: string;
  amount: number;
  currency: string;
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

    const { amount, provider, phoneNumber, currency = "CDF", orderId, orderType, userType = 'client' }: PaymentRequest = await req.json();

    console.log('💰 Mobile Money Payment Request:', {
      amount,
      provider,
      phoneNumber: phoneNumber?.substring(0, 5) + '***',
      orderId,
      orderType
    });

    // ✅ ROUTAGE CASHIN vs CASHOUT
    const isCashout = orderType === 'withdrawal';
    const isCashin = ['wallet_topup', 'partner_credit', 'vendor_credit', 'marketplace', 'transport', 'delivery', 'food'].includes(orderType || 'wallet_topup');

    console.log(`🔀 Type de transaction : ${isCashout ? 'CASHOUT (B2B)' : isCashin ? 'CASHIN (WebPay)' : 'UNKNOWN'}`);

    if (!amount || !provider || !phoneNumber) {
      throw new Error("Missing required fields: amount, provider, phoneNumber");
    }

    if (!isCashout && !isCashin) {
      throw new Error(`Type de transaction non supporté : ${orderType}`);
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

      // Validation format téléphone Congo (accepte +243..., 243... ou 0...)
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
      const phoneWithPrefixRegex = /^\+?243[0-9]{9}$/;
      const phoneWithoutPrefixRegex = /^0[0-9]{9}$/;
      
      if (!phoneWithPrefixRegex.test(cleanPhone) && !phoneWithoutPrefixRegex.test(cleanPhone)) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'phone_validation_failed',
          user_id: user.id,
          phone_input: phoneNumber,
          clean_phone: cleanPhone,
          error: 'Invalid phone format'
        }));
        throw new Error('Format téléphone invalide. Utilisez +243XXXXXXXXX ou 0XXXXXXXXX');
      }
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'phone_validation_success',
        user_id: user.id,
        phone_format: cleanPhone.startsWith('0') ? 'local' : 'international'
      }));

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
        metadata: {
          order_type: orderType || 'wallet_topup',
          user_type: userType
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to create payment record');
    }

    console.log(`Processing ${provider} payment for ${amount} ${currency} to ${phoneNumber}`);
    
    // ===== INTÉGRATION ORANGE MONEY =====
    if (provider.toLowerCase() === 'orange') {
      if (isCashout) {
        // ✅ CASHOUT : Utiliser Orange Money B2B API
        try {
          console.log('🍊 Starting Orange Money B2B CASHOUT (retraits vendeurs)');

        const orangeApiUrl = Deno.env.get('ORANGE_MONEY_API_URL');
        const clientId = Deno.env.get('ORANGE_MONEY_CLIENT_ID');
        const clientSecret = Deno.env.get('ORANGE_MONEY_CLIENT_SECRET');
        const posId = Deno.env.get('ORANGE_MONEY_POS_ID');

        if (!orangeApiUrl || !clientId || !clientSecret || !posId) {
          throw new Error('Orange Money API configuration missing');
        }

        // Calculer automatiquement l'auth header si non fourni
        let authHeaderValue = Deno.env.get('ORANGE_MONEY_AUTH_HEADER');
        if (!authHeaderValue) {
          const basicAuth = btoa(`${clientId}:${clientSecret}`);
          authHeaderValue = `Basic ${basicAuth}`;
          console.log('🔑 Auth header calculated automatically');
        }

        // Étape 1 : Obtenir le token OAuth 2-legged
        console.log('🔑 Getting OAuth token...');
        const tokenResponse = await fetch(`https://api.orange.com/oauth/v3/token`, {
          method: 'POST',
          headers: {
            'Authorization': authHeaderValue,
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

        // Étape 2 : Initier le paiement B2B RDC
        console.log('💳 Initiating B2B payment...');
        
        // ✅ Orange Money B2B RDC : Format receiverMSISDN AVEC code pays 243 (12 chiffres total)
        // Documentation officielle : receiverMSISDN = 243 + 9 chiffres
        let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        // Retirer les préfixes existants pour normaliser
        if (formattedPhone.startsWith('+243')) {
          formattedPhone = formattedPhone.substring(4); // +243999123456 → 999123456
        } else if (formattedPhone.startsWith('243')) {
          formattedPhone = formattedPhone.substring(3); // 243999123456 → 999123456
        } else if (formattedPhone.startsWith('0')) {
          formattedPhone = formattedPhone.substring(1); // 0999123456 → 999123456
        }
        
        // Validation finale : doit être exactement 9 chiffres
        if (!/^[0-9]{9}$/.test(formattedPhone)) {
          throw new Error(`Format téléphone invalide pour Orange Money: ${formattedPhone}. Attendu: 9 chiffres`);
        }
        
        // ✅ Payload B2B RDC officiel selon documentation Orange
        const paymentPayload = {
          amount: amount,
          currency: "CDF",
          partnerTransactionId: transactionId,
          receiverMSISDN: `243${formattedPhone}`, // Format international 243XXXXXXXXX
          description: "Kwenda Cashout"
        };

        // ✅ Endpoint officiel Orange Money B2B RDC : /transactions uniquement
        const fullEndpointUrl = `${orangeApiUrl}/transactions`;

        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'orange_money_b2b_cashout_init',
          user_id: user.id,
          amount: amount,
          currency: "CDF",
          transaction_id: transactionId,
          provider: 'orange',
          receiver_msisdn: `243${formattedPhone}`,
          msisdn_format: 'international_with_243',
          original_phone_input: phoneNumber,
          user_type: userType,
          full_endpoint: fullEndpointUrl,
          payload: paymentPayload,
          headers: {
            has_auth: true,
            has_pos_id: true
          }
        }));

        // ✅ Requête HTTP avec headers officiels Orange Money B2B RDC
        const paymentResponse = await fetch(fullEndpointUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
            'X-Pos-Id': posId // Header obligatoire Orange Money B2B RDC
          },
          body: JSON.stringify(paymentPayload),
        });

        if (!paymentResponse.ok) {
          const errorText = await paymentResponse.text();
          console.error('❌ B2B payment error:', errorText);
          throw new Error(`B2B payment failed: ${paymentResponse.status}`);
        }

        const paymentData: OrangeMoneyB2BResponse = await paymentResponse.json();
        console.log('✅ B2B Payment initiated:', paymentData.transactionId);

        // Mettre à jour la transaction avec les détails Orange B2B
        const { error: updateError } = await supabaseService
          .from('payment_transactions')
          .update({
            status: paymentData.transactionStatus === 'SUCCESS' ? 'completed' : 'pending',
            metadata: {
              orange_transaction_id: paymentData.transactionId,
              orange_partner_transaction_id: paymentData.partnerTransactionId,
              orange_status: paymentData.transactionStatus,
              receiver_msisdn: `243${formattedPhone}`
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        if (updateError) {
          console.error('Error updating transaction metadata:', updateError);
        }

        // Retourner la réponse
        return new Response(
          JSON.stringify({
            success: true,
            transactionId: transactionId,
            message: 'Paiement Orange Money B2B initié avec succès.',
            status: paymentData.transactionStatus === 'SUCCESS' ? 'completed' : 'pending',
            orangeTransactionId: paymentData.transactionId
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );

        } catch (orangeError) {
          console.error('❌ Orange Money B2B CASHOUT error:', orangeError);
          
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
              : 'Erreur Orange Money CASHOUT. Veuillez réessayer.'
          );
        }
      } else {
        // ⚠️ CASHIN : Orange Money WebPay pas encore configuré
        console.warn('⚠️ Orange Money WebPay (CASHIN) non disponible');
        
        await supabaseService
          .from('payment_transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        throw new Error(
          '⚠️ Orange Money WebPay (CASHIN) non encore configuré. ' +
          'L\'API B2B ne supporte que les CASHOUT (retraits). ' +
          'Veuillez contacter Orange pour obtenir vos credentials WebPay.'
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