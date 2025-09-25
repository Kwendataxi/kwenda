import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WithdrawalRequest {
  amount: number;
  paymentMethod: 'mobile_money';
  paymentDetails: {
    provider: string;
    phoneNumber: string;
  };
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { amount, paymentMethod, paymentDetails }: WithdrawalRequest = await req.json();

    if (!amount || amount <= 0) {
      throw new Error("Invalid withdrawal amount");
    }

    if (paymentMethod !== 'mobile_money') {
      throw new Error("Only mobile money withdrawals are supported");
    }

    if (!paymentDetails.provider || !paymentDetails.phoneNumber) {
      throw new Error("Payment details are incomplete");
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check available balance
    const { data: earnings, error: earningsError } = await supabaseService
      .from('vendor_earnings')
      .select('amount')
      .eq('vendor_id', user.id)
      .eq('status', 'available');

    if (earningsError) throw earningsError;

    const availableBalance = earnings?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;

    if (amount > availableBalance) {
      throw new Error(`Solde insuffisant. Disponible: ${availableBalance} CDF`);
    }

    // Calculate fees (2% for mobile money)
    const fees = Math.round(amount * 0.02);
    const netAmount = amount - fees;

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabaseService
      .from('vendor_withdrawals')
      .insert({
        vendor_id: user.id,
        amount: amount,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: 'pending',
        fees: fees,
        net_amount: netAmount
      })
      .select()
      .single();

    if (withdrawalError) throw withdrawalError;

    // Process mobile money payment
    const { data: paymentResult, error: paymentError } = await supabaseService.functions.invoke('mobile-money-payment', {
      body: {
        amount: netAmount,
        provider: paymentDetails.provider,
        phoneNumber: paymentDetails.phoneNumber,
        currency: 'CDF',
        orderId: withdrawal.id,
        orderType: 'withdrawal'
      }
    });

    if (paymentError) {
      // Update withdrawal status to failed
      await supabaseService
        .from('vendor_withdrawals')
        .update({ status: 'failed' })
        .eq('id', withdrawal.id);
      
      throw new Error('Échec du paiement mobile money');
    }

    if (paymentResult.success) {
      // Update withdrawal status to completed
      await supabaseService
        .from('vendor_withdrawals')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString(),
          transaction_reference: paymentResult.transactionId
        })
        .eq('id', withdrawal.id);

      // Mark earnings as withdrawn
      await supabaseService
        .from('vendor_earnings')
        .update({ 
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString()
        })
        .eq('vendor_id', user.id)
        .eq('status', 'available');

      return new Response(
        JSON.stringify({
          success: true,
          withdrawalId: withdrawal.id,
          transactionId: paymentResult.transactionId,
          amount: amount,
          fees: fees,
          netAmount: netAmount,
          message: `Retrait de ${netAmount} CDF effectué avec succès`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Update withdrawal status to failed
      await supabaseService
        .from('vendor_withdrawals')
        .update({ status: 'failed' })
        .eq('id', withdrawal.id);
      
      throw new Error('Échec du retrait');
    }

  } catch (error) {
    console.error('Vendor withdrawal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Erreur lors du retrait'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});