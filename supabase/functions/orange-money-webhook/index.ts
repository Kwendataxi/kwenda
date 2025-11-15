import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrangeWebhookPayload {
  notif_token?: string;
  order_id?: string;
  status?: string; // 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'PENDING'
  amount?: string;
  pay_token?: string;
  txnid?: string;
  notif_date?: string;
  action?: string; // Pour le test Orange
}

// ✅ Fonction de vérification BasicAuth
function verifyBasicAuth(req: Request): { authorized: boolean; reason?: string } {
  const authHeader = req.headers.get('Authorization');
  
  // Cas 1 : Pas d'Authorization header → 401
  if (!authHeader) {
    return { authorized: false, reason: 'Missing Authorization header' };
  }
  
  // Cas 2 : Authorization header présent mais pas Basic
  if (!authHeader.startsWith('Basic ')) {
    return { authorized: false, reason: 'Authorization must use Basic scheme' };
  }
  
  // Cas 3 : Comparer avec le secret stocké
  const expectedAuth = Deno.env.get('ORANGE_MONEY_BASIC_AUTH');
  
  if (!expectedAuth) {
    console.error('❌ ORANGE_MONEY_BASIC_AUTH not configured!');
    return { authorized: false, reason: 'Server configuration error' };
  }
  
  // Extraire le token (après "Basic ")
  const providedToken = authHeader.substring(6);
  
  // Cas 4 : Token incorrect (ou modifié avec %) → 401
  if (providedToken !== expectedAuth) {
    console.warn(`⚠️ Invalid BasicAuth token: ${providedToken.substring(0, 10)}...`);
    return { authorized: false, reason: 'Invalid credentials' };
  }
  
  // Cas 5 : Token valide → OK
  return { authorized: true };
}

serve(async (req) => {
  // ✅ Vérifier que le path est /notifications (requis par Orange)
  const url = new URL(req.url);
  
  if (!url.pathname.endsWith('/notifications')) {
    return new Response(
      JSON.stringify({ error: 'Invalid endpoint. Use /notifications' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  }

  console.log(`🔔 Orange Money Webhook received on ${url.pathname}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Valider la méthode HTTP
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  }

  try {
    // ✅ Vérifier BasicAuth AVANT tout traitement
    const authCheck = verifyBasicAuth(req);

    if (!authCheck.authorized) {
      console.warn(`❌ BasicAuth failed: ${authCheck.reason}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      );
    }

    console.log('✅ BasicAuth verified');

    // ✅ Gérer le test Orange {"action":"test"}
    const body: OrangeWebhookPayload = await req.json();

    if (body.action === 'test') {
      console.log('🧪 Orange Money test request detected');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Webhook endpoint is properly configured' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // ✅ Continuer avec le traitement normal du webhook
    console.log("📦 Processing Orange Money notification...");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const payload = body as OrangeWebhookPayload;
    
    if (!payload.order_id || !payload.status) {
      throw new Error('Missing required fields: order_id or status');
    }
    console.log("📦 Webhook payload:", {
      order_id: payload.order_id,
      status: payload.status,
      amount: payload.amount,
      txnid: payload.txnid
    });

    // Récupérer la transaction avec les métadonnées
    const { data: transaction, error: txError } = await supabaseService
      .from("payment_transactions")
      .select("*")
      .eq("transaction_id", payload.order_id)
      .single();

    if (txError || !transaction) {
      console.error("❌ Transaction not found:", payload.order_id);
      throw new Error("Transaction not found");
    }

    console.log("📦 Transaction found:", {
      id: transaction.id,
      user_id: transaction.user_id,
      metadata: transaction.metadata
    });

    if (payload.status === "SUCCESS") {
      console.log("✅ Payment successful, crediting wallet...");

      const amount = parseFloat(payload.amount || transaction.amount);
      const userType = transaction.metadata?.user_type || 'client';
      const orderType = transaction.metadata?.order_type || 'wallet_topup';

      console.log(`💰 Crediting ${amount} ${transaction.currency} for ${userType} (${orderType})`);

      // Créditer le wallet selon le type d'utilisateur
      if (userType === 'partner' || orderType === 'partner_credit') {
        // Créditer partner_profiles.balance
        const { data: partner } = await supabaseService
          .from('partner_profiles')
          .select('balance')
          .eq('user_id', transaction.user_id)
          .single();

        if (partner) {
          await supabaseService
            .from('partner_profiles')
            .update({ 
              balance: (partner.balance || 0) + amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', transaction.user_id);

          // Logger dans activity_logs
          await supabaseService.from('activity_logs').insert({
            user_id: transaction.user_id,
            activity_type: 'partner_wallet_topup',
            description: `Rechargement Orange Money +${amount} ${transaction.currency}`,
            amount: amount,
            currency: transaction.currency,
            reference_type: 'payment',
            reference_id: transaction.id
          });
        }

      } else if (userType === 'vendor' || orderType === 'vendor_credit') {
        // Créditer vendor_wallets.balance
        const { data: wallet } = await supabaseService
          .from('vendor_wallets')
          .select('balance')
          .eq('vendor_id', transaction.user_id)
          .eq('currency', transaction.currency)
          .single();

        if (wallet) {
          await supabaseService
            .from('vendor_wallets')
            .update({ 
              balance: (wallet.balance || 0) + amount,
              updated_at: new Date().toISOString()
            })
            .eq('vendor_id', transaction.user_id)
            .eq('currency', transaction.currency);

          // Logger transaction vendeur
          await supabaseService.from('vendor_wallet_transactions').insert({
            vendor_id: transaction.user_id,
            transaction_type: 'credit',
            amount: amount,
            currency: transaction.currency,
            description: `Rechargement Orange Money`,
            reference_id: transaction.id,
            reference_type: 'payment',
            status: 'completed'
          });
        }

      } else {
        // Créditer user_wallets.balance (client/restaurant)
        const { data: wallet } = await supabaseService
          .from('user_wallets')
          .select('balance')
          .eq('user_id', transaction.user_id)
          .single();

        if (wallet) {
          await supabaseService
            .from('user_wallets')
            .update({ 
              balance: (wallet.balance || 0) + amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', transaction.user_id);

          // Logger dans wallet_transactions
          await supabaseService.from('wallet_transactions').insert({
            user_id: transaction.user_id,
            amount: amount,
            transaction_type: 'credit',
            description: `Rechargement Orange Money`,
            status: 'completed',
            reference_id: transaction.id,
            reference_type: 'payment'
          });
        }
      }

      // Mettre à jour le statut de la transaction
      await supabaseService
        .from("payment_transactions")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
          metadata: {
            ...transaction.metadata,
            orange_txnid: payload.txnid,
            completed_at: new Date().toISOString()
          }
        })
        .eq("transaction_id", payload.order_id);

      // Envoyer notification
      await supabaseService.from('system_notifications').insert({
        user_id: transaction.user_id,
        title: '✅ Rechargement réussi',
        message: `Votre wallet a été crédité de ${amount} ${transaction.currency} via Orange Money`,
        type: 'wallet_topup',
        priority: 'high',
        data: { transaction_id: transaction.id, amount, currency: transaction.currency }
      });

      // Log détaillé du succès
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'wallet_credited_success',
        user_id: transaction.user_id,
        user_type: transaction.metadata?.userType || 'client',
        amount: amount,
        currency: transaction.currency,
        transaction_id: payload.order_id,
        orange_txnid: payload.txnid,
        payment_provider: 'orange'
      }));

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment processed and wallet credited",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (payload.status === "FAILED") {
      console.log(`❌ Payment failed`);
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'payment_failed',
        user_id: transaction.user_id,
        transaction_id: payload.order_id,
        amount: transaction.amount,
        currency: transaction.currency,
        reason: payload.status,
        payment_provider: 'orange'
      }));

      await supabaseService
        .from("payment_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          metadata: {
            ...transaction.metadata,
            failure_reason: 'Payment failed by user or system',
            failed_at: new Date().toISOString()
          }
        })
        .eq("transaction_id", payload.order_id);

      // Notification d'échec
      await supabaseService.from('system_notifications').insert({
        user_id: transaction.user_id,
        title: '❌ Rechargement échoué',
        message: `Votre paiement Orange Money a échoué. Veuillez réessayer.`,
        type: 'wallet_topup',
        priority: 'high',
        data: { transaction_id: transaction.id, status: payload.status }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment failure recorded",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (payload.status === "EXPIRED") {
      console.log(`⏰ Payment expired`);
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'payment_expired',
        user_id: transaction.user_id,
        transaction_id: payload.order_id,
        amount: transaction.amount,
        currency: transaction.currency,
        payment_provider: 'orange'
      }));

      await supabaseService
        .from("payment_transactions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          metadata: {
            ...transaction.metadata,
            failure_reason: 'Transaction expirée - délai de paiement dépassé',
            expired_at: new Date().toISOString()
          }
        })
        .eq("transaction_id", payload.order_id);

      // Notification d'expiration
      await supabaseService.from('system_notifications').insert({
        user_id: transaction.user_id,
        title: '⏰ Paiement expiré',
        message: `Le délai de paiement Orange Money a expiré. Veuillez créer une nouvelle transaction.`,
        type: 'wallet_topup',
        priority: 'medium',
        data: { transaction_id: transaction.id, status: 'expired' }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment failure recorded",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      console.log(`ℹ️ Payment status: ${payload.status}`);
      
      await supabaseService
        .from("payment_transactions")
        .update({
          status: "processing",
          updated_at: new Date().toISOString()
        })
        .eq("transaction_id", payload.order_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Status recorded",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (updateError) {
      console.error("❌ Error updating transaction:", updateError);
      throw updateError;
    }

    // Si succès, créditer le wallet
    if (newStatus === 'completed') {
      console.log(`💰 Crediting wallet for user ${transaction.user_id}`);

      // Récupérer le wallet actuel
      const { data: wallet, error: walletFetchError } = await supabaseService
        .from('user_wallets')
        .select('balance')
        .eq('user_id', transaction.user_id)
        .single();

      if (walletFetchError || !wallet) {
        console.error("❌ Error fetching wallet:", walletFetchError);
      } else {
        // Mettre à jour le solde
        const newBalance = (wallet.balance || 0) + transaction.amount;
        
        const { error: walletError } = await supabaseService
          .from('user_wallets')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', transaction.user_id);

        if (walletError) {
          console.error("❌ Error updating wallet:", walletError);
        } else {
          console.log(`✅ Wallet updated: ${wallet.balance} → ${newBalance} CDF`);
        }
      }

      // Logger l'activité
      await supabaseService
        .from('activity_logs')
        .insert({
          user_id: transaction.user_id,
          activity_type: 'wallet_topup',
          description: `Rechargement Orange Money de ${transaction.amount} ${transaction.currency}`,
          amount: transaction.amount,
          currency: transaction.currency,
          reference_type: 'payment_transaction',
          reference_id: transaction.id,
        });

      // Envoyer une notification push (si configuré)
      try {
        await supabaseService
          .from('notifications')
          .insert({
            user_id: transaction.user_id,
            title: '✅ Paiement réussi',
            message: `Votre compte a été crédité de ${transaction.amount} ${transaction.currency} via Orange Money`,
            type: 'payment_success',
            priority: 'high',
            metadata: {
              transaction_id: transaction.id,
              amount: transaction.amount,
              provider: 'orange',
            }
          });
      } catch (notifError) {
        console.warn("⚠️ Could not send notification:", notifError);
      }
    }

    // Si échec, notifier l'utilisateur
    if (newStatus === 'failed') {
      try {
        await supabaseService
          .from('notifications')
          .insert({
            user_id: transaction.user_id,
            title: '❌ Paiement échoué',
            message: `Votre paiement Orange Money de ${transaction.amount} ${transaction.currency} a échoué`,
            type: 'payment_failed',
            priority: 'high',
            metadata: {
              transaction_id: transaction.id,
              amount: transaction.amount,
              provider: 'orange',
            }
          });
      } catch (notifError) {
        console.warn("⚠️ Could not send notification:", notifError);
      }
    }

    console.log("✅ Webhook processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed",
        status: newStatus,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
