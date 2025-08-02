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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
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

    // Validate input
    if (!amount || !provider || !phoneNumber) {
      throw new Error("Missing required fields: amount, provider, phoneNumber");
    }

    // Supported providers
    const supportedProviders = ['airtel', 'orange', 'mpesa'];
    if (!supportedProviders.includes(provider.toLowerCase())) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Generate transaction ID
    const transactionId = `KWENDA_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create Supabase service client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Insert payment transaction record
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

    // Simulate mobile money payment processing
    // In a real implementation, this would integrate with actual mobile money APIs
    console.log(`Processing ${provider} payment for ${amount} ${currency} to ${phoneNumber}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate payment success (90% success rate for demo)
    const paymentSuccess = Math.random() > 0.1;

    if (paymentSuccess) {
      // Update transaction status to completed
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
      // Update transaction status to failed
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
        error: error.message,
        message: 'Échec du paiement. Veuillez réessayer.'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});