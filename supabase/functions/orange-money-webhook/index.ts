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
    console.log("📦 Webhook payload:", {
      order_id: payload.order_id,
      status: payload.status,
      amount: payload.amount,
    });

    // Trouver la transaction correspondante
    const { data: transaction, error: findError } = await supabaseService
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', payload.order_id)
      .single();

    if (findError || !transaction) {
      console.error("❌ Transaction not found:", payload.order_id);
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        { headers: corsHeaders, status: 404 }
      );
    }

    // Mapper le statut Orange Money vers notre système
    let newStatus: string;
    switch (payload.status) {
      case 'SUCCESS':
        newStatus = 'completed';
        break;
      case 'FAILED':
      case 'EXPIRED':
        newStatus = 'failed';
        break;
      case 'PENDING':
        newStatus = 'processing';
        break;
      default:
        newStatus = 'failed';
    }

    console.log(`📝 Updating transaction ${transaction.id} to status: ${newStatus}`);

    // Mettre à jour la transaction
    const { error: updateError } = await supabaseService
      .from('payment_transactions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          orange_txnid: payload.txnid,
          orange_pay_token: payload.pay_token,
          orange_notif_date: payload.notif_date,
        }
      })
      .eq('id', transaction.id);

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
