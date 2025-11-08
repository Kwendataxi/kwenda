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

    const { cartItems, userId, userCoordinates } = await req.json();

    console.log('🛒 Processing marketplace checkout', { userId, itemCount: cartItems.length });

    // 1. Calculer le total
    const totalAmount = cartItems.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );

    console.log('💰 Total amount:', totalAmount);

    // 2. Vérifier et débiter le wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance, bonus_balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      console.error('❌ Wallet error:', walletError);
      throw new Error('Portefeuille introuvable');
    }

    const availableBalance = (wallet.balance || 0) + (wallet.bonus_balance || 0);
    
    if (availableBalance < totalAmount) {
      console.error('❌ Insufficient balance:', { available: availableBalance, required: totalAmount });
      throw new Error(`Solde insuffisant. Requis: ${totalAmount} CDF | Disponible: ${availableBalance} CDF`);
    }

    // 3. Débiter le wallet (priorité bonus si suffisant)
    let paidWithBonus = false;
    if ((wallet.bonus_balance || 0) >= totalAmount) {
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ 
          bonus_balance: (wallet.bonus_balance || 0) - totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
      paidWithBonus = true;
      console.log('✅ Paid with bonus balance');
    } else {
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ 
          balance: (wallet.balance || 0) - totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
      console.log('✅ Paid with main balance');
    }

    // 4. Créer les commandes et les transactions escrow
    const orderIds: string[] = [];
    
    for (const item of cartItems) {
      const orderTotal = item.price * item.quantity;

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          product_id: item.product_id || item.id,
          buyer_id: userId,
          seller_id: item.seller_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_amount: orderTotal, // ❌ Produit uniquement, sans delivery_fee
          status: 'pending',
          payment_status: 'paid',
          delivery_coordinates: userCoordinates,
          vendor_confirmation_status: 'awaiting_confirmation',
          delivery_payment_status: 'pending' // 🆕 Livraison sera payée séparément
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        throw orderError;
      }

      orderIds.push(order.id);
      console.log(`✅ Order created: ${order.id}`);

      // Créer la transaction escrow (UNIQUEMENT produit)
      const platformFee = orderTotal * 0.05;
      const sellerAmount = orderTotal - platformFee;

      const { error: escrowError } = await supabase
        .from('escrow_transactions')
        .insert({
          order_id: order.id,
          buyer_id: userId,
          seller_id: item.seller_id,
          amount: orderTotal, // ⚠️ Produit uniquement, pas la livraison
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          status: 'held',
          currency: 'CDF',
          transaction_type: 'marketplace_order'
        });

      if (escrowError) {
        console.error('❌ Escrow creation error:', escrowError);
        throw escrowError;
      }

      console.log(`✅ Escrow created for order: ${order.id}`);

      // Logger l'activité
      await supabase.from('activity_logs').insert({
        user_id: userId,
        activity_type: 'marketplace_purchase',
        description: `Achat - ${item.name}`,
        amount: -orderTotal,
        currency: 'CDF',
        reference_type: 'marketplace_order',
        reference_id: order.id
      });

      // Notifier le vendeur
      await supabase.from('system_notifications').insert({
        user_id: item.seller_id,
        title: 'Nouvelle commande payée',
        message: `Vous avez reçu une commande payée pour ${item.name}. Montant: ${orderTotal} CDF`,
        notification_type: 'marketplace_order',
        data: { order_id: order.id, amount: orderTotal }
      });
    }

    console.log(`✅ Checkout complete. ${orderIds.length} orders created`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderIds, 
        totalAmount,
        paidWithBonus 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
