import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  special_instructions?: string;
}

interface OrderData {
  restaurant_id: string;
  items: OrderItem[];
  delivery_address: string;
  delivery_phone: string;
  delivery_coordinates?: { lat: number; lng: number };
  delivery_instructions?: string;
  payment_method: 'kwenda_pay' | 'cash';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non authentifié');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Session invalide');
    }

    const orderData: OrderData = await req.json();
    console.log('📦 Nouvelle commande food:', { user_id: user.id, restaurant_id: orderData.restaurant_id });

    if (!orderData.restaurant_id || !orderData.items || orderData.items.length === 0) {
      throw new Error('Données invalides');
    }

    // Récupérer le restaurant avec son user_id
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurant_profiles')
      .select('id, user_id, restaurant_name, is_active, verification_status, average_preparation_time')
      .eq('id', orderData.restaurant_id)
      .eq('is_active', true)
      .eq('verification_status', 'approved')
      .single();

    if (restaurantError || !restaurant) {
      throw new Error('Restaurant non disponible');
    }

    const productIds = orderData.items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('food_products')
      .select('id, name, price, is_available')
      .in('id', productIds)
      .eq('restaurant_id', orderData.restaurant_id)
      .eq('is_available', true)
      .eq('moderation_status', 'approved');

    if (productsError || !products || products.length !== orderData.items.length) {
      throw new Error('Produits non disponibles');
    }

    const subtotal = orderData.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + ((product?.price || 0) * item.quantity);
    }, 0);

    // Service fee = 5% du subtotal (séparé de la commission restaurant)
    const serviceFee = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + serviceFee;

    let walletId: string | null = null;

    if (orderData.payment_method === 'kwenda_pay') {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('id, balance, bonus_balance')
        .eq('user_id', user.id)
        .single();

      if (!wallet) {
        return new Response(
          JSON.stringify({ error: 'wallet_not_found', message: 'Portefeuille introuvable' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      walletId = wallet.id;
      const bonusBalance = Number(wallet.bonus_balance || 0);
      const mainBalance = Number(wallet.balance || 0);
      const totalAvailable = bonusBalance + mainBalance;

      if (totalAvailable < totalAmount) {
        return new Response(
          JSON.stringify({ 
            error: 'insufficient_funds',
            message: 'Solde insuffisant',
            required: totalAmount,
            available: totalAvailable,
            bonus: bonusBalance,
            main: mainBalance
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      // Règle: Bonus utilisable UNIQUEMENT si couvre 100% du montant
      let transactionType: string;
      let transactionDescription: string;
      let paidWithBonus = false;

      if (bonusBalance >= totalAmount) {
        await supabase
          .from('user_wallets')
          .update({ 
            bonus_balance: bonusBalance - totalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        transactionType = 'food_order_bonus';
        transactionDescription = `Commande Food (BONUS) - ${restaurant.restaurant_name}`;
        paidWithBonus = true;
        console.log(`💰 Paiement avec BONUS : ${totalAmount} CDF`);
      } else {
        await supabase
          .from('user_wallets')
          .update({ 
            balance: mainBalance - totalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        transactionType = 'food_order';
        transactionDescription = `Commande Food - ${restaurant.restaurant_name}`;
        console.log(`💰 Paiement avec BALANCE : ${totalAmount} CDF`);
      }

      // Logger transaction wallet
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        transaction_type: transactionType,
        amount: -totalAmount,
        currency: 'CDF',
        description: transactionDescription,
        status: 'completed',
        metadata: {
          order_type: 'food',
          restaurant_id: orderData.restaurant_id,
          restaurant_name: restaurant.restaurant_name,
          paid_with: paidWithBonus ? 'bonus' : 'main_balance'
        }
      });

      // Logger activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: paidWithBonus ? 'bonus_payment' : 'wallet_payment',
        description: transactionDescription,
        amount: -totalAmount,
        currency: 'CDF',
        reference_type: 'food_order',
        reference_id: orderData.restaurant_id
      });
    }

    // Créer la commande
    const orderNumber = `FOOD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const { data: order, error: orderError } = await supabase
      .from('food_orders')
      .insert({
        order_number: orderNumber,
        customer_id: user.id,
        restaurant_id: orderData.restaurant_id,
        items: orderData.items.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            product_id: item.product_id,
            name: product?.name || 'Produit',
            quantity: item.quantity,
            price: product?.price || 0,
            special_instructions: item.special_instructions || ''
          };
        }),
        subtotal,
        delivery_fee: 0,
        service_fee: serviceFee,
        total_amount: totalAmount,
        delivery_payment_status: 'not_required',
        currency: 'CDF',
        delivery_address: orderData.delivery_address,
        delivery_coordinates: orderData.delivery_coordinates || {},
        delivery_phone: orderData.delivery_phone,
        delivery_instructions: orderData.delivery_instructions,
        payment_method: orderData.payment_method,
        payment_status: orderData.payment_method === 'kwenda_pay' ? 'completed' : 'pending',
        paid_at: orderData.payment_method === 'kwenda_pay' ? new Date().toISOString() : null,
        status: 'pending',
        estimated_preparation_time: restaurant.average_preparation_time || 30
      })
      .select()
      .single();

    if (orderError) throw orderError;

    console.log('✅ Commande créée:', order.id);

    // ✅ CORRECTION: Créer escrow dans escrow_payments (pas escrow_transactions)
    // IMPORTANT: seller_id = restaurant.user_id (pas restaurant_id)
    if (orderData.payment_method === 'kwenda_pay') {
      const { error: escrowError } = await supabase
        .from('escrow_payments')
        .insert({
          order_id: order.id,
          buyer_id: user.id,
          seller_id: restaurant.user_id, // ✅ USER_ID du restaurant, pas restaurant_id
          amount: subtotal, // Montant produit uniquement (service_fee = plateforme)
          currency: 'CDF',
          payment_method: 'wallet',
          status: 'held',
          held_at: new Date().toISOString()
        });

      if (escrowError) {
        console.error('❌ Escrow creation error:', escrowError);
        // CRITICAL: Log mais ne pas bloquer car commande déjà créée
      } else {
        console.log(`✅ Escrow créé dans escrow_payments: ${subtotal} CDF pour restaurant user ${restaurant.user_id}`);
      }
    }

    // Créer les items de commande
    await supabase.from('food_order_items').insert(
      orderData.items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product?.price || 0,
          special_instructions: item.special_instructions || ''
        };
      })
    );

    // Notifier le restaurant
    await supabase.from('system_notifications').insert({
      user_id: restaurant.user_id,
      title: '🍽️ Nouvelle commande !',
      message: `Nouvelle commande #${orderNumber} - ${totalAmount.toLocaleString()} CDF`,
      notification_type: 'food_order',
      data: { order_id: order.id, amount: totalAmount }
    });

    console.log('ℹ️ Livraison sera demandée par le restaurant via request-food-delivery');

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        order_number: orderNumber,
        total_amount: totalAmount,
        estimated_time: restaurant.average_preparation_time || 30
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
