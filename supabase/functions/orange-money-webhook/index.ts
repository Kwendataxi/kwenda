import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-orange-signature",
};

interface OrangeWebhookPayload {
  notif_token: string;
  order_id: string;
  status: string; // 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'PENDING'
  amount: string;
  pay_token: string;
  txnid: string;
  notif_date: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔔 Orange Money Webhook received");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Vérifier la signature Orange Money (sécurité)
    const signature = req.headers.get("x-orange-signature");
    const webhookSecret = Deno.env.get("ORANGE_MONEY_WEBHOOK_SECRET");
    
    if (!signature || !webhookSecret) {
      console.error("❌ Missing webhook signature or secret");
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        { headers: corsHeaders, status: 401 }
      );
    }

    const payload: OrangeWebhookPayload = await req.json();
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

      const { error: walletError } = await supabaseService
        .from('user_wallets')
        .update({
          balance: supabaseService.rpc('increment', { 
            x: transaction.amount 
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', transaction.user_id);

      if (walletError) {
        console.error("❌ Error updating wallet:", walletError);
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
