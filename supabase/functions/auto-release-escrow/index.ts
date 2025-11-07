import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Utiliser la clé de service pour les opérations automatiques
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting auto-release escrow job...');

    // Trouver les commandes livrées depuis plus de 7 jours sans confirmation client
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: ordersToRelease, error: fetchError } = await supabaseClient
      .from('marketplace_orders')
      .select('id, buyer_id, seller_id, total_amount, delivered_at')
      .eq('status', 'delivered')
      .lt('delivered_at', sevenDaysAgo.toISOString())
      .is('completed_at', null);

    if (fetchError) throw fetchError;

    if (!ordersToRelease || ordersToRelease.length === 0) {
      console.log('No orders to auto-release');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No orders to release',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${ordersToRelease.length} orders to auto-release`);

    const results = [];
    
    for (const order of ordersToRelease) {
      try {
        console.log(`Processing order ${order.id}...`);

        // Marquer la commande comme complétée
        const { error: updateError } = await supabaseClient
          .from('marketplace_orders')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            customer_feedback: 'Auto-complété après 7 jours',
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`Error updating order ${order.id}:`, updateError);
          results.push({ orderId: order.id, success: false, error: updateError.message });
          continue;
        }

        // Libérer les fonds via la fonction release-escrow-payment
        const { data: releaseData, error: releaseError } = await supabaseClient.functions.invoke('release-escrow-payment', {
          body: { orderId: order.id }
        });

        if (releaseError) {
          console.error(`Error releasing escrow for order ${order.id}:`, releaseError);
          results.push({ orderId: order.id, success: false, error: releaseError.message });
          continue;
        }

        // Notifier l'acheteur
        await supabaseClient.from('push_notifications').insert({
          user_id: order.buyer_id,
          title: '✅ Commande automatiquement confirmée',
          message: `Votre commande a été automatiquement confirmée après 7 jours de livraison.`,
          notification_type: 'marketplace_order',
          metadata: { order_id: order.id, auto_released: true }
        });

        // Notifier le vendeur
        await supabaseClient.from('push_notifications').insert({
          user_id: order.seller_id,
          title: '💰 Paiement auto-libéré',
          message: `Les fonds de votre commande ont été automatiquement libérés après 7 jours.`,
          notification_type: 'marketplace_payment',
          metadata: { 
            order_id: order.id, 
            auto_released: true,
            amount: releaseData?.sellerAmount || 0
          }
        });

        // Logger l'activité
        await supabaseClient.from('activity_logs').insert({
          activity_type: 'escrow_auto_released',
          description: `Paiement auto-libéré après 7 jours de livraison`,
          reference_id: order.id,
          reference_type: 'marketplace_order',
          metadata: {
            delivered_at: order.delivered_at,
            released_at: new Date().toISOString(),
            seller_amount: releaseData?.sellerAmount
          }
        });

        results.push({ orderId: order.id, success: true, amount: releaseData?.sellerAmount });
        console.log(`Successfully auto-released order ${order.id}`);

      } catch (orderError: any) {
        console.error(`Error processing order ${order.id}:`, orderError);
        results.push({ orderId: order.id, success: false, error: orderError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Auto-release job completed: ${successCount} succeeded, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Auto-released ${successCount} orders`,
        results,
        summary: {
          total: ordersToRelease.length,
          succeeded: successCount,
          failed: failureCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in auto-release job:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
