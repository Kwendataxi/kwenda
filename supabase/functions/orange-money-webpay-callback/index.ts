import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ✅ Orange Money WebPay - Callback Handler
 * 
 * Gère le retour utilisateur après paiement Orange Money WebPay (CASHIN)
 * L'utilisateur est redirigé ici après avoir entré son PIN sur la page Orange
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const transactionId = url.searchParams.get('transaction_id');
    const status = url.searchParams.get('status');
    const orderReference = url.searchParams.get('order_reference');

    console.log('📱 Orange Money WebPay Callback:', { transactionId, status, orderReference });

    if (!transactionId || !status || !orderReference) {
      throw new Error('Paramètres manquants');
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer la transaction
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_reference', orderReference)
      .single();

    if (txError || !transaction) {
      console.error('❌ Transaction non trouvée:', txError);
      // Rediriger vers page d'erreur
      return Response.redirect(`${Deno.env.get('APP_URL')}/payment-failed?reason=transaction_not_found`, 302);
    }

    // Mettre à jour le statut
    if (status === 'success' || status === 'completed') {
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString(),
          metadata: { ...transaction.metadata, callback_status: status }
        })
        .eq('id', transaction.id);

      console.log('✅ Transaction marquée comme complétée');
      
      // Rediriger vers page de succès
      return Response.redirect(`${Deno.env.get('APP_URL')}/payment-success?amount=${transaction.amount}`, 302);
    } else {
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'failed',
          metadata: { ...transaction.metadata, callback_status: status }
        })
        .eq('id', transaction.id);

      console.log('❌ Transaction échouée');
      
      // Rediriger vers page d'échec
      return Response.redirect(`${Deno.env.get('APP_URL')}/payment-failed?reason=${status}`, 302);
    }

  } catch (error) {
    console.error('❌ Callback error:', error);
    return Response.redirect(`${Deno.env.get('APP_URL')}/payment-failed?reason=callback_error`, 302);
  }
});
