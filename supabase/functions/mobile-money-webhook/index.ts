import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📱 [mobile-money-webhook] Received webhook');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('📱 [mobile-money-webhook] Payload:', body);

    const {
      transaction_ref,
      status,
      provider,
      phone_number,
      amount,
      external_transaction_id,
    } = body;

    // Valider la signature du webhook (en production)
    // const signature = req.headers.get('X-Webhook-Signature');
    // if (!verifySignature(body, signature)) {
    //   throw new Error('Invalid webhook signature');
    // }

    // Récupérer la transaction en attente
    const { data: pendingTx, error: txError } = await supabaseClient
      .from('wallet_transactions')
      .select('*, user_wallets(*)')
      .eq('reference_id', transaction_ref)
      .eq('status', 'pending')
      .single();

    if (txError || !pendingTx) {
      console.error('❌ [mobile-money-webhook] Transaction not found:', txError);
      throw new Error('Transaction not found');
    }

    console.log('✅ [mobile-money-webhook] Transaction found:', pendingTx.id);

    if (status === 'success' || status === 'completed') {
      // Créditer le wallet
      const { error: updateError } = await supabaseClient
        .from('user_wallets')
        .update({
          balance: (pendingTx.user_wallets.balance || 0) + pendingTx.amount,
        })
        .eq('id', pendingTx.user_wallets.id);

      if (updateError) {
        console.error('❌ [mobile-money-webhook] Update error:', updateError);
        throw updateError;
      }

      // Mettre à jour le statut de la transaction
      await supabaseClient
        .from('wallet_transactions')
        .update({
          status: 'completed',
          metadata: {
            ...pendingTx.metadata,
            external_transaction_id,
            completed_at: new Date().toISOString(),
          },
        })
        .eq('id', pendingTx.id);

      console.log('✅ [mobile-money-webhook] Payment confirmed and wallet credited');

      // Envoyer notification au restaurant
      console.log('📧 [mobile-money-webhook] Sending success notification');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (status === 'failed' || status === 'cancelled') {
      // Marquer comme échoué
      await supabaseClient
        .from('wallet_transactions')
        .update({
          status: 'failed',
          metadata: {
            ...pendingTx.metadata,
            failure_reason: body.failure_reason || 'Payment failed',
            failed_at: new Date().toISOString(),
          },
        })
        .eq('id', pendingTx.id);

      console.log('❌ [mobile-money-webhook] Payment failed');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment failure recorded',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error(`Unknown status: ${status}`);
    }
  } catch (error: any) {
    console.error('❌ [mobile-money-webhook] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
