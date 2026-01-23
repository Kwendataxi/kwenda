import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization required');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Utilisateur non authentifié');

    const { cartItems, userCoordinates, deliveryAddress } = await req.json();

    console.log('🛒 Processing marketplace order with escrow', { 
      userId: user.id, 
      itemCount: cartItems?.length 
    });

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Panier vide');
    }

    // 1. Calculer le total
    const totalAmount = cartItems.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );

    console.log('💰 Total amount:', totalAmount);

    // 2. Vérifier le wallet
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance, bonus_balance')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      console.error('❌ Wallet error:', walletError);
      throw new Error('Portefeuille introuvable');
    }

    const bonusBalance = Number(wallet.bonus_balance || 0);
    const mainBalance = Number(wallet.balance || 0);

    // Règle: bonus utilisable UNIQUEMENT si couvre 100% du montant
    let paidWithBonus = false;
    let balanceToUse = 0;

    if (bonusBalance >= totalAmount) {
      paidWithBonus = true;
      balanceToUse = bonusBalance;
    } else if (mainBalance >= totalAmount) {
      balanceToUse = mainBalance;
    } else {
      const totalAvailable = mainBalance + bonusBalance;
      throw new Error(`Solde insuffisant. Requis: ${totalAmount} CDF | Disponible: ${totalAvailable} CDF`);
    }

    // 3. Débiter le wallet
    if (paidWithBonus) {
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ 
          bonus_balance: bonusBalance - totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      console.log('✅ Paid with bonus balance');
    } else {
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ 
          balance: mainBalance - totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      console.log('✅ Paid with main balance');
    }

    // 4. Créer les commandes et escrows
    const orderIds: string[] = [];
    const escrowIds: string[] = [];
    
    // Calculer la date de timeout (7 jours)
    const timeoutDate = new Date();
    timeoutDate.setDate(timeoutDate.getDate() + 7);

    for (const item of cartItems) {
      const orderTotal = item.price * item.quantity;
      const platformFee = orderTotal * 0.05; // 5% commission
      const sellerAmount = orderTotal - platformFee;

      // Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .insert({
          product_id: item.product_id || item.id,
          buyer_id: user.id,
          seller_id: item.seller_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_amount: orderTotal,
          status: 'pending',
          payment_status: 'paid',
          delivery_address: deliveryAddress,
          delivery_coordinates: userCoordinates,
          vendor_confirmation_status: 'awaiting_confirmation',
          delivery_payment_status: 'pending',
          escrow_status: 'held' // Nouveau champ
        })
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        throw orderError;
      }

      orderIds.push(order.id);
      console.log(`✅ Order created: ${order.id}`);

      // Créer la transaction escrow
      const { data: escrow, error: escrowError } = await supabase
        .from('escrow_transactions')
        .insert({
          order_id: order.id,
          buyer_id: user.id,
          seller_id: item.seller_id,
          amount: orderTotal,
          platform_fee: platformFee,
          seller_amount: sellerAmount,
          status: 'held',
          currency: 'CDF',
          transaction_type: 'marketplace_order',
          timeout_at: timeoutDate.toISOString() // Timeout après 7 jours
        })
        .select()
        .single();

      if (escrowError) {
        console.error('❌ Escrow creation error:', escrowError);
        // Continuer même si escrow échoue (table peut ne pas exister)
      } else {
        escrowIds.push(escrow.id);
        console.log(`✅ Escrow created: ${escrow.id}`);
      }

      // Logger l'activité
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: paidWithBonus ? 'bonus_payment' : 'wallet_payment',
        description: `Achat marketplace - ${item.name || 'Produit'}`,
        amount: -orderTotal,
        currency: 'CDF',
        reference_type: 'marketplace_order',
        reference_id: order.id
      });

      // Notifier le vendeur
      await supabase.from('system_notifications').insert({
        user_id: item.seller_id,
        title: '🛒 Nouvelle commande payée',
        message: `Commande reçue pour ${item.name || 'un produit'}. Montant: ${orderTotal.toLocaleString()} CDF (en séquestre)`,
        notification_type: 'marketplace_order',
        data: { 
          order_id: order.id, 
          amount: orderTotal,
          escrow_id: escrow?.id,
          escrow_status: 'held'
        }
      });
    }

    console.log(`✅ Checkout complete: ${orderIds.length} orders, ${escrowIds.length} escrows`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderIds,
        escrowIds,
        totalAmount,
        paidWithBonus,
        timeoutDate: timeoutDate.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Process marketplace escrow error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
