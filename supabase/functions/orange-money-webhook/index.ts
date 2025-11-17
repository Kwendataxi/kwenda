import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrangeMoneyWebhookPayload {
  partnerTransactionId: string;
  transactionStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId?: string;
  amount?: number;
  currency?: string;
  peerId?: string;
  errorCode?: string;
  errorMessage?: string;
}

serve(async (req) => {
  // Gérer le path /notifications requis par Orange
  const url = new URL(req.url);
  if (!url.pathname.endsWith('/notifications') && req.method !== 'OPTIONS') {
    return new Response(
      JSON.stringify({ error: 'Invalid endpoint. Use /notifications' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    console.log('🍊 [orange-money-webhook] Notification reçue');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: OrangeMoneyWebhookPayload = await req.json();
    console.log('📱 [orange-money-webhook] Payload:', JSON.stringify(payload));

    const {
      partnerTransactionId,
      transactionStatus,
      transactionId,
      amount,
      currency,
      peerId,
      errorCode,
      errorMessage
    } = payload;

    if (!partnerTransactionId || !transactionStatus) {
      console.error('❌ Missing required fields');
      throw new Error('Missing partnerTransactionId or transactionStatus');
    }

    // Récupérer la transaction en attente
    const { data: pendingTx, error: txError } = await supabaseClient
      .from('payment_transactions')
      .select('*')
      .eq('transaction_id', partnerTransactionId)
      .single();

    if (txError || !pendingTx) {
      console.error('❌ [orange-money-webhook] Transaction not found:', txError);
      // Retourner 200 quand même pour éviter les retry d'Orange
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Transaction not found but acknowledged'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('✅ [orange-money-webhook] Transaction found:', pendingTx.id);

    // Traiter selon le statut
    if (transactionStatus === 'SUCCESS') {
      // Mettre à jour le statut de la transaction
      const { error: updateError } = await supabaseClient
        .from('payment_transactions')
        .update({
          status: 'completed',
          metadata: {
            ...pendingTx.metadata,
            orange_transaction_id: transactionId,
            completed_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingTx.id);

      if (updateError) {
        console.error('❌ [orange-money-webhook] Update error:', updateError);
        throw updateError;
      }

      console.log('✅ [orange-money-webhook] Payment confirmed');

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
    } else if (transactionStatus === 'FAILED') {
      // Marquer comme échoué
      await supabaseClient
        .from('payment_transactions')
        .update({
          status: 'failed',
          metadata: {
            ...pendingTx.metadata,
            orange_transaction_id: transactionId,
            error_code: errorCode,
            error_message: errorMessage,
            failure_reason: errorMessage || 'Payment failed',
            failed_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingTx.id);

      console.log('❌ [orange-money-webhook] Payment failed');

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
    } else if (transactionStatus === 'PENDING') {
      // Mettre à jour avec le statut pending
      await supabaseClient
        .from('payment_transactions')
        .update({
          status: 'pending',
          metadata: {
            ...pendingTx.metadata,
            orange_transaction_id: transactionId,
            pending_at: new Date().toISOString(),
            webhook_received_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingTx.id);

      console.log('⏳ [orange-money-webhook] Payment pending');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment pending status recorded',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      throw new Error(`Unknown status: ${transactionStatus}`);
    }
  } catch (error: any) {
    console.error('❌ [orange-money-webhook] Error:', error);
    // Toujours retourner 200 pour éviter les retry infinis d'Orange
    return new Response(
      JSON.stringify({
        success: true,
        error: error.message,
        message: 'Error acknowledged'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
