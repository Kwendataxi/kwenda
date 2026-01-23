import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ✅ Orange Money Cashout - Webhook Handler
 * 
 * Reçoit les notifications serveur-à-serveur d'Orange Money pour confirmer les paiements CASHOUT
 * Crédite automatiquement le wallet KwendaPay après confirmation de paiement
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();
    console.log('🔔 Orange Money Cashout Webhook:', JSON.stringify(webhookData, null, 2));

    const { 
      transactionId,           // ID Orange (ex: MP240123.1234.A12345)
      partnerTransactionId,     // Notre ID (KWENDA_xxx)
      transactionStatus,        // SUCCESS, FAILED, PENDING
      amount,
      currency
    } = webhookData;

    if (!transactionId || !partnerTransactionId || !transactionStatus) {
      throw new Error('Webhook data incomplet');
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer la transaction
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', partnerTransactionId)
      .single();

    if (txError || !transaction) {
      console.error('❌ Transaction non trouvée:', partnerTransactionId);
      return new Response(
        JSON.stringify({ error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Traiter selon le statut
    if (transactionStatus === 'SUCCESS' || transactionStatus === 'COMPLETED') {
      // ✅ Paiement réussi - Créditer le wallet
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          metadata: { 
            ...transaction.metadata, 
            orange_transaction_id: transactionId,
            confirmed_at: new Date().toISOString()
          }
        })
        .eq('id', transaction.id);

      // Récupérer le wallet actuel
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', transaction.user_id)
        .single();

      const newBalance = (wallet?.balance || 0) + transaction.amount;

      // Créditer le wallet du client
      await supabase
        .from('user_wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', transaction.user_id);

      // Logger la transaction wallet
      await supabase.from('wallet_transactions').insert({
        user_id: transaction.user_id,
        transaction_type: 'credit',
        amount: transaction.amount,
        currency: transaction.currency,
        description: `Rechargement Orange Money confirmé`,
        reference_type: 'topup',
        status: 'completed',
        payment_method: 'orange_money',
        balance_before: wallet?.balance || 0,
        balance_after: newBalance
      });

      // Logger dans activity_logs
      await supabase.from('activity_logs').insert({
        user_id: transaction.user_id,
        activity_type: 'wallet_credit',
        description: `Recharge Orange Money +${transaction.amount} CDF`,
        amount: transaction.amount,
        currency: transaction.currency,
        reference_type: 'topup',
        reference_id: transaction.id
      });

      console.log(`✅ Wallet crédité : +${transaction.amount} CDF (nouveau solde: ${newBalance} CDF)`);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (transactionStatus === 'FAILED' || transactionStatus === 'CANCELLED') {
      // ❌ Paiement échoué
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          metadata: { 
            ...transaction.metadata, 
            orange_transaction_id: transactionId,
            failure_reason: webhookData.message || 'Payment failed'
          }
        })
        .eq('id', transaction.id);

      console.log(`❌ Transaction Cashout échouée: ${transactionId}`);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processed (failed)' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Statut inconnu
    console.warn(`⚠️ Statut Orange Money inconnu: ${transactionStatus}`);
    return new Response(
      JSON.stringify({ success: true, message: 'Unknown status received' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
