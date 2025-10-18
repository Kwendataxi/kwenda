import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurant_profiles')
      .select('id, restaurant_name, is_active, verification_status, average_preparation_time')
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

    const deliveryFee = 2000;
    const serviceFee = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + deliveryFee + serviceFee;

    if (orderData.payment_method === 'kwenda_pay') {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance, id')
        .eq('user_id', user.id)
        .single();

      if (!wallet || wallet.balance < totalAmount) {
        return new Response(
          JSON.stringify({ 
            error: 'insufficient_funds',
            message: 'Solde insuffisant',
            required: totalAmount,
            available: wallet?.balance || 0
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      await supabase
        .from('user_wallets')
        .update({ balance: wallet.balance - totalAmount })
        .eq('user_id', user.id);

      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        transaction_type: 'food_order',
        amount: -totalAmount,
        currency: 'CDF',
        description: `Commande ${restaurant.restaurant_name}`,
        status: 'completed'
      });
    }

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
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        total_amount: totalAmount,
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

    console.log('✅ Commande créée:', order.id);

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
