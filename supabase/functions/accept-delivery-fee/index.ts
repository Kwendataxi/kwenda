import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
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

    const { orderId, buyerId, deliveryFeePaymentMethod = 'wallet' } = await req.json();

    console.log('💰 Buyer accepting delivery fees:', { orderId, buyerId });

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('*, marketplace_delivery_assignments(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Commande introuvable');
    }

    if (order.buyer_id !== buyerId) {
      throw new Error('Accès non autorisé');
    }

    if (order.status !== 'pending_buyer_approval') {
      throw new Error(`Impossible d'accepter: commande en statut ${order.status}`);
    }

    // 1. Créer escrow PRODUIT (montant HT livraison)
    const productAmount = order.total_amount - (order.delivery_fee || 0);
    const { data: existingEscrow } = await supabase
      .from('escrow_payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingEscrow) {
      const { error: escrowUpdateError } = await supabase
        .from('escrow_payments')
        .update({
          amount: productAmount,
          status: 'held'
        })
        .eq('id', existingEscrow.id);

      if (escrowUpdateError) throw escrowUpdateError;
    } else {
      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .insert({
          order_id: orderId,
          buyer_id: buyerId,
          seller_id: order.seller_id,
          amount: productAmount,
          payment_method: 'wallet',
          status: 'held'
        });

      if (escrowError) throw escrowError;
    }

    // 2. Gérer l'escrow LIVRAISON selon le mode de paiement
    const deliveryFee = order.delivery_fee || 0;
    let actualPaymentMethod = deliveryFeePaymentMethod;

    if (deliveryFeePaymentMethod === 'wallet') {
      // Débiter le wallet client pour les frais de livraison
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance, bonus_balance')
        .eq('user_id', buyerId)
        .single();

      if (walletError || !wallet) throw new Error('Portefeuille introuvable');

      const bonusBalance = Number(wallet.bonus_balance || 0);
      const mainBalance = Number(wallet.balance || 0);
      const totalBalance = bonusBalance + mainBalance;

      // Si solde insuffisant, basculer automatiquement en cash
      if (totalBalance < deliveryFee) {
        console.log('💵 Solde insuffisant, bascule automatique vers cash:', { totalBalance, deliveryFee });
        actualPaymentMethod = 'cash_on_delivery';
      } else {
        // Priorité : bonus si couvre 100%, sinon balance principal
        if (bonusBalance >= deliveryFee) {
          const { error: updateError } = await supabase
            .from('user_wallets')
            .update({
              bonus_balance: bonusBalance - deliveryFee,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', buyerId);

          if (updateError) throw updateError;
        } else {
          const { error: updateError } = await supabase
            .from('user_wallets')
            .update({
              balance: mainBalance - deliveryFee,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', buyerId);

          if (updateError) throw updateError;
        }

        // Créer escrow livraison (status: held)
        const { error: deliveryEscrowError } = await supabase
          .from('delivery_escrow_payments')
          .insert({
            order_id: orderId,
            buyer_id: buyerId,
            amount: deliveryFee,
            payment_method: 'wallet',
            status: 'held'
          });

        if (deliveryEscrowError) throw deliveryEscrowError;
      }
    }

    // Si paiement cash (choisi ou basculé automatiquement)
    if (actualPaymentMethod === 'cash_on_delivery') {
      // Créer escrow livraison en attente de cash (status: pending_cash)
      const { error: deliveryEscrowError } = await supabase
        .from('delivery_escrow_payments')
        .insert({
          order_id: orderId,
          buyer_id: buyerId,
          amount: deliveryFee,
          payment_method: 'cash_on_delivery',
          status: 'pending_cash'
        });

      if (deliveryEscrowError) throw deliveryEscrowError;
    }

    // 3. Mettre à jour la commande avec la méthode de paiement réellement utilisée
    const { error: updateError } = await supabase
      .from('marketplace_orders')
      .update({
        delivery_fee_approved_by_buyer: true,
        delivery_fee_payment_method: actualPaymentMethod,
        status: 'confirmed',
        payment_status: 'held',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Si livreur Kwenda demandé, lancer dispatch
    if (order.vendor_delivery_method === 'kwenda' && !order.marketplace_delivery_assignments?.length) {
      console.log('🚚 Triggering Kwenda delivery dispatch');
      
      try {
        await supabase.functions.invoke('delivery-dispatcher', {
          body: {
            orderId,
            pickupCoordinates: order.pickup_coordinates,
            deliveryCoordinates: order.delivery_coordinates,
            deliveryType: 'marketplace'
          }
        });
      } catch (dispatchError) {
        console.error('⚠️ Error dispatching delivery:', dispatchError);
        // Ne pas bloquer la validation si le dispatch échoue
      }
    }

    // Notifier le vendeur
    const { error: notifError } = await supabase
      .from('push_notifications')
      .insert({
        user_id: order.seller_id,
        title: 'Client a accepté',
        message: `Le client a accepté les frais de livraison (${order.delivery_fee} FC). Commande confirmée !`,
        notification_type: 'marketplace_order',
        metadata: {
          order_id: orderId,
          total_amount: order.total_amount
        }
      });

    if (notifError) {
      console.error('⚠️ Error sending notification:', notifError);
    }

    console.log('✅ Delivery fee accepted successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        orderId,
        status: 'confirmed'
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