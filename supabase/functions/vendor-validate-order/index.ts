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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId, vendorId, deliveryFee, deliveryMethod, selfDelivery } = await req.json();

    console.log('🔄 Vendor validation request:', { orderId, vendorId, deliveryFee, deliveryMethod });

    // Vérifier que l'utilisateur est bien le vendeur de la commande
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('*, marketplace_products(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Commande introuvable');
    }

    if (order.seller_id !== vendorId) {
      throw new Error('Accès non autorisé: vous n\'êtes pas le vendeur de cette commande');
    }

    if (order.status !== 'pending') {
      throw new Error(`Impossible de valider: commande déjà en statut ${order.status}`);
    }

    // Calculer le nouveau montant total
    const subtotal = order.unit_price * order.quantity;
    const totalAmount = subtotal + deliveryFee;

    // Mettre à jour la commande
    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update({
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        vendor_approved_at: new Date().toISOString(),
        vendor_delivery_method: deliveryMethod,
        status: 'pending_buyer_approval', // Nouveau statut en attente client
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Si le vendeur livre lui-même, créer l'assignation
    if (selfDelivery) {
      const { error: assignmentError } = await supabase
        .from('marketplace_delivery_assignments')
        .insert({
          order_id: orderId,
          driver_id: vendorId,
          assigned_by_vendor: true,
          status: 'assigned',
          vendor_delivery_notes: 'Livraison par le vendeur'
        });

      if (assignmentError) {
        console.error('⚠️ Error creating self-delivery assignment:', assignmentError);
      }
    }

    // Notifier le client
    const { error: notifError } = await supabase
      .from('push_notifications')
      .insert({
        user_id: order.buyer_id,
        title: 'Commande validée',
        message: `Le vendeur a validé votre commande. Frais de livraison: ${deliveryFee} FC. Total: ${totalAmount} FC`,
        notification_type: 'marketplace_order',
        metadata: {
          order_id: orderId,
          delivery_fee: deliveryFee,
          total_amount: totalAmount,
          delivery_method: deliveryMethod
        }
      });

    if (notifError) {
      console.error('⚠️ Error sending notification:', notifError);
    }

    console.log('✅ Order validated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId,
        deliveryFee,
        totalAmount,
        status: 'pending_buyer_approval'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});