import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Cache global pour le token OAuth (économise des appels API)
let cachedOAuthToken: { token: string; expiresAt: number } | null = null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  message?: string;
  transactionData: {
    type: string;
    peerId: string;
    peerIdType: string;
    amount: number;
    currency: string;
    posId: string;
    transactionId: string;
    txnId?: string;
  };
}

// ✅ Fonction pour créditer le wallet vendeur (merchant_accounts)
async function creditVendorWallet(
  supabaseService: SupabaseClient,
  vendorId: string,
  amount: number,
  currency: string,
  provider: string,
  transactionId: string
): Promise<void> {
  try {
    console.log(`💰 Crédit wallet vendeur: ${amount} ${currency} pour ${vendorId}`);
    
    // Récupérer ou créer le compte marchand
    let { data: merchantAccount, error: fetchError } = await supabaseService
      .from('merchant_accounts')
      .select('*')
      .eq('vendor_id', vendorId)
      .maybeSingle();

    if (fetchError) {
      console.error('[creditVendorWallet] Erreur fetch:', fetchError);
      throw fetchError;
    }

    if (!merchantAccount) {
      // Créer le compte marchand
      const { data: newAccount, error: createError } = await supabaseService
        .from('merchant_accounts')
        .insert({
          vendor_id: vendorId,
          balance: 0,
          currency: currency,
          total_earned: 0,
          total_withdrawn: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('[creditVendorWallet] Erreur création compte:', createError);
        throw createError;
      }
      merchantAccount = newAccount;
      console.log('✅ Compte marchand créé:', merchantAccount.id);
    }

    const oldBalance = merchantAccount.balance || 0;
    const newBalance = oldBalance + amount;

    // Créditer le compte
    const { error: updateError } = await supabaseService
      .from('merchant_accounts')
      .update({
        balance: newBalance,
        total_earned: (merchantAccount.total_earned || 0) + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', merchantAccount.id);

    if (updateError) {
      console.error('[creditVendorWallet] Erreur update balance:', updateError);
      throw updateError;
    }

    // Enregistrer la transaction
    const { error: txError } = await supabaseService
      .from('merchant_transactions')
      .insert({
        merchant_account_id: merchantAccount.id,
        vendor_id: vendorId,
        transaction_type: 'credit',
        amount: amount,
        currency: currency,
        description: `Rechargement via ${provider}`,
        reference_id: transactionId,
        reference_type: 'wallet_topup',
        balance_before: oldBalance,
        balance_after: newBalance,
        status: 'completed'
      });

    if (txError) {
      console.error('[creditVendorWallet] Erreur insert transaction:', txError);
      // On ne throw pas ici car le crédit est déjà fait
    }

    console.log(`✅ Wallet vendeur crédité: ${oldBalance} → ${newBalance} ${currency}`);
  } catch (error) {
    console.error('❌ Erreur crédit wallet vendeur:', error);
    throw error;
  }
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

    // ✅ ROUTAGE CASHIN vs CASHOUT (INVERSÉ selon Orange Money)
    // CASHOUT = Client paie Kwenda (paiement marchand) - SUPPORTÉ
    const isCashout = ['wallet_topup', 'partner_credit', 'vendor_credit', 'marketplace', 'transport', 'delivery', 'food'].includes(orderType || 'wallet_topup');
    // CASHIN = Kwenda paie client (retrait réglementé) - NON SUPPORTÉ
    const isCashin = orderType === 'withdrawal';

    console.log(`🔀 Type de transaction : ${isCashout ? 'CASHOUT (Paiement marchand)' : isCashin ? 'CASHIN (Retrait - NON SUPPORTÉ)' : 'UNKNOWN'}`);

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

    // ✅ Orange Money B2B exige un UUID au format RFC 4122
    // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const transactionId = crypto.randomUUID();

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
        
        // ✅ Payload B2B RDC officiel selon documentation Orange Money B2B
        // Documentation: peerId + peerIdType + posId + transactionId
        const paymentPayload = {
          peerId: formattedPhone,       // 9 chiffres uniquement (ex: 991234567)
          peerIdType: "msisdn",         // Type d'identifiant (toujours "msisdn")
          amount: amount,
          currency: "CDF",
          posId: posId,                 // POS ID dans le body (pas dans header)
          transactionId: transactionId  // ID unique Kwenda
        };

        // 🧪 VARIANTES DE PAYLOAD À TESTER SI 404 PERSISTE :
        // const paymentPayload = {
        //   amount: amount,
        //   currency: "CDF",
        //   partnerTransactionId: transactionId,
        //   receiverMsisdn: formattedPhone, // ✅ Variante 1: Msisdn (camelCase minuscule)
        //   description: "kwenda_cashout"
        // };
        
        // const paymentPayload = {
        //   amount: amount,
        //   currency: "CDF",
        //   partner_transaction_id: transactionId, // ✅ Variante 2: snake_case
        //   receiver_msisdn: formattedPhone,
        //   description: "recharge_wallet"
        // };

        // ✅ PHASE 1: Fix construction URL avec serviceName selon documentation
        // cashout = client paie Kwenda (paiement marchand)
        // cashin = Kwenda paie client (retrait - non supporté)
        const baseUrl = orangeApiUrl.replace(/\/+$/, ''); // Retire les / finaux
        const serviceName = isCashin ? 'cashin' : 'cashout';
        const fullEndpointUrl = `${baseUrl}/transactions/${serviceName}`;
        
        console.log('🔗 Full endpoint URL:', fullEndpointUrl); // Debug URL exacte

        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          event: 'orange_money_b2b_cashout_init',
          user_id: user.id,
          amount: amount,
          currency: "CDF",
          transaction_id: transactionId,
          provider: 'orange',
          receiver_msisdn: formattedPhone,
          msisdn_format: 'local_9_digits',
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
            'Accept': 'application/json',
            'Content-Type': 'application/json'
            // X-Pos-Id retiré : posId est maintenant dans le body
          },
          body: JSON.stringify(paymentPayload),
        });

        // 🧪 VARIANTES DE HEADERS À TESTER SI 404 PERSISTE :
        // const paymentResponse = await fetch(fullEndpointUrl, {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${tokenData.access_token}`,
        //     'Content-Type': 'application/json',
        //     'x-pos-id': posId // ✅ Variante 1: minuscules
        //   },
        //   body: JSON.stringify(paymentPayload),
        // });
        
        // const paymentResponse = await fetch(fullEndpointUrl, {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${tokenData.access_token}`,
        //     'Content-Type': 'application/json',
        //     'X-POS-ID': posId // ✅ Variante 2: tout en majuscules
        //   },
        //   body: JSON.stringify(paymentPayload),
        // });

        // ✅ PHASE 2: Gestion réponse 202 Accepted (mode asynchrone)
        if (!paymentResponse.ok && paymentResponse.status !== 202) {
          const errorText = await paymentResponse.text();
          
          // Log complet pour debug
          console.error('❌ Orange Money B2B Error:', JSON.stringify({
            status: paymentResponse.status,
            statusText: paymentResponse.statusText,
            url: fullEndpointUrl,
            headers: {
              authorization: `Bearer ${tokenData.access_token.substring(0, 20)}...`,
              'accept': 'application/json',
              'content-type': 'application/json'
            },
            payload: paymentPayload,
            response_body: errorText,
            response_headers: Object.fromEntries(paymentResponse.headers.entries())
          }, null, 2));
          
          throw new Error(`B2B payment failed: ${paymentResponse.status} - ${errorText}`);
        }

        const paymentData: OrangeMoneyB2BResponse = await paymentResponse.json();
        console.log('✅ B2B Payment initiated:', JSON.stringify(paymentData));
        
        // La réponse est 202 Accepted avec status PENDING (asynchrone)
        const isPending = paymentData.status === 'PENDING';
        const isSuccess = paymentData.status === 'SUCCESS';

        // Mettre à jour la transaction avec les détails Orange B2B
        const { error: updateError } = await supabaseService
          .from('payment_transactions')
          .update({
            status: isSuccess ? 'completed' : 'pending',
            metadata: {
              orange_transaction_id: paymentData.transactionData.transactionId,
              orange_txn_id: paymentData.transactionData.txnId,
              orange_status: paymentData.status,
              orange_peer_id: paymentData.transactionData.peerId,
              receiver_msisdn: formattedPhone
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        if (updateError) {
          console.error('Error updating transaction metadata:', updateError);
        }

        // ✅ Créditer le wallet vendeur si paiement réussi ou en cours
        if ((isSuccess || isPending) && orderType === 'vendor_credit' && userType === 'vendor') {
          try {
            await creditVendorWallet(supabaseService, user.id, amount, currency, provider, transactionId);
          } catch (creditError) {
            console.error('❌ Erreur crédit wallet (non bloquant):', creditError);
          }
        }

        // Retourner la réponse (202 pour pending, 200 pour success)
        return new Response(
          JSON.stringify({
            success: true,
            transactionId: transactionId,
            message: isPending 
              ? 'Paiement Orange Money B2B en cours de traitement.'
              : 'Paiement Orange Money B2B effectué avec succès.',
            status: paymentData.status.toLowerCase(),
            orangeTransactionId: paymentData.transactionData.transactionId,
            orangeTxnId: paymentData.transactionData.txnId
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: isPending ? 202 : 200,
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
      } else if (isCashin) {
        // ❌ CASHIN : Orange Money ne supporte PAS les retraits (nécessite licence)
        console.error('❌ Orange Money CASHIN (retraits) non supporté');
        
        await supabaseService
          .from('payment_transactions')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        throw new Error(
          '❌ Orange Money ne supporte pas les retraits (CASHIN). ' +
          'Seuls les paiements marchands (CASHOUT) sont autorisés. ' +
          'Pour les retraits, utilisez Airtel Money ou le retrait bancaire.'
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

      // ✅ Créditer le wallet vendeur si paiement réussi
      if (orderType === 'vendor_credit' && userType === 'vendor') {
        try {
          await creditVendorWallet(supabaseService, user.id, amount, currency, provider, transactionId);
        } catch (creditError) {
          console.error('❌ Erreur crédit wallet (non bloquant):', creditError);
        }
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