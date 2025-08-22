import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("Orange callback reçu:", body);

    const transactionId = body.order_id;
    const status = body.status; // SUCCESS | FAILED

    if (!transactionId) throw new Error("order_id manquant");

    // Récupérer la transaction
    const { data: payment, error: paymentError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("transaction_id", transactionId)
      .single();

    if (paymentError || !payment) throw new Error("Transaction introuvable");

    // Si succès → créditer le wallet
    if (status === "SUCCESS") {
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", payment.user_id)
        .single();

      if (!wallet) throw new Error("Wallet introuvable");

      const newBalance = wallet.balance + payment.amount;

      await supabase.from("user_wallets").update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      }).eq("id", wallet.id);

      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        user_id: payment.user_id,
        transaction_type: "credit",
        amount: payment.amount,
        currency: payment.currency,
        description: `Rechargement via Orange Money`,
        reference_type: "topup",
        status: "completed",
        payment_method: "orange_money",
        balance_before: wallet.balance,
        balance_after: newBalance,
      });

      await supabase.from("payment_transactions")
        .update({ status: "completed" })
        .eq("id", payment.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Sinon → marquer échoué
    await supabase.from("payment_transactions")
      .update({ status: "failed" })
      .eq("id", payment.id);

    return new Response(JSON.stringify({ success: false, message: "Paiement échoué" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Orange callback error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
