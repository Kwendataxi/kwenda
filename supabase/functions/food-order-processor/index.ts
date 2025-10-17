import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FoodOrderRequest {
  restaurant_id: string;
  items: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    options?: any;
  }>;
  delivery_address: string;
  delivery_coordinates: { lat: number; lng: number };
  delivery_phone: string;
  delivery_instructions?: string;
  payment_method: 'kwenda_pay' | 'cash_on_delivery';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData: FoodOrderRequest = await req.json();

    console.log('🍽️ Food Order Processor');
    console.log('🏪 Restaurant ID:', orderData.restaurant_id);
    console.log('📦 Items:', orderData.items.length);
    console.log('💳 Payment Method:', orderData.payment_method);

    // 1. Vérifier que le restaurant est actif et son modèle de paiement
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurant_profiles')
      .select(`
        *,
        restaurant_subscriptions(
          id,
          status,
          end_date,
          plan_id
        )
      `)
      .eq('id', orderData.restaurant_id)
      .eq('is_active', true)
      .eq('verification_status', 'approved')
      .single();

    if (restaurantError || !restaurant) {
      console.error('❌ Restaurant not available:', restaurantError);
      return new Response(
        JSON.stringify({ error: 'Restaurant non disponible' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('💳 Payment Model:', restaurant.payment_model);

    // Vérifier selon le modèle de paiement
    if (restaurant.payment_model === 'subscription') {
      // Mode abonnement : vérifier qu'un abonnement actif existe
      const activeSubscription = restaurant.restaurant_subscriptions?.find(
        (sub: any) => sub.status === 'active' && new Date(sub.end_date) > new Date()
      );

      if (!activeSubscription) {
        console.error('❌ No active subscription');
        return new Response(
          JSON.stringify({ error: 'Restaurant sans abonnement actif' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Vérifier la disponibilité des produits
    const productIds = orderData.items.map((item) => item.product_id);
    const { data: products, error: productsError } = await supabaseClient
      .from('food_products')
      .select('id, is_available, stock_quantity, price')
      .in('id', productIds)
      .eq('restaurant_id', orderData.restaurant_id)
      .eq('moderation_status', 'approved');

    if (productsError || !products || products.length !== orderData.items.length) {
      console.error('❌ Products validation failed:', productsError);
      return new Response(
        JSON.stringify({ error: 'Certains produits ne sont pas disponibles' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier stock
    for (const item of orderData.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product?.is_available) {
        return new Response(
          JSON.stringify({ error: `Produit ${item.name} non disponible` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (product.stock_quantity !== null && product.stock_quantity < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Stock insuffisant pour ${item.name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Calculer les montants
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = 5000; // Frais de livraison fixes (à adapter selon zone)
    const serviceFee = 0; // Supprimé : pas de service fee client
    const totalAmount = subtotal + deliveryFee + serviceFee;

    console.log('💰 Subtotal:', subtotal);
    console.log('🚚 Delivery Fee:', deliveryFee);
    console.log('💵 Total:', totalAmount);

    // 4. Si paiement KwendaPay, vérifier le solde et débiter
    if (orderData.payment_method === 'kwenda_pay') {
      const { data: wallet, error: walletError } = await supabaseClient
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        return new Response(
          JSON.stringify({ error: 'Portefeuille non trouvé', needsTopUp: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (wallet.balance < totalAmount) {
        return new Response(
          JSON.stringify({
            error: 'Solde insuffisant',
            needsTopUp: true,
            required: totalAmount,
            current: wallet.balance,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Débiter le wallet
      const { error: debitError } = await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          transaction_type: 'debit',
          amount: totalAmount,
          currency: 'CDF',
          description: `Commande repas - ${restaurant.restaurant_name}`,
          payment_method: 'kwenda_pay',
          status: 'completed',
          reference_type: 'food_order',
        });

      if (debitError) {
        console.error('❌ Payment failed:', debitError);
        return new Response(
          JSON.stringify({ error: 'Échec du paiement' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Payment successful');
    }

    // 5. Créer la commande
    const { data: order, error: orderError } = await supabaseClient
      .from('food_orders')
      .insert({
        customer_id: user.id,
        restaurant_id: orderData.restaurant_id,
        items: orderData.items,
        subtotal,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        total_amount: totalAmount,
        currency: 'CDF',
        delivery_address: orderData.delivery_address,
        delivery_coordinates: orderData.delivery_coordinates,
        delivery_phone: orderData.delivery_phone,
        delivery_instructions: orderData.delivery_instructions,
        payment_method: orderData.payment_method,
        payment_status: orderData.payment_method === 'kwenda_pay' ? 'completed' : 'pending',
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order creation failed:', orderError);
      // Rembourser si la commande échoue
      if (orderData.payment_method === 'kwenda_pay') {
        const { data: wallet } = await supabaseClient
          .from('user_wallets')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (wallet) {
          await supabaseClient.from('wallet_transactions').insert({
            user_id: user.id,
            wallet_id: wallet.id,
            transaction_type: 'credit',
            amount: totalAmount,
            currency: 'CDF',
            description: 'Remboursement commande échouée',
            payment_method: 'kwenda_pay',
            status: 'completed',
            reference_type: 'refund',
          });
        }
      }

      return new Response(
        JSON.stringify({ error: 'Échec de la création de la commande' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Order created:', order.order_number);

    // 6. Décrémenter le stock des produits
    for (const item of orderData.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (product && product.stock_quantity !== null) {
        await supabaseClient
          .from('food_products')
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq('id', item.product_id);
      }
    }

    // 7. Créer commission si modèle = 'commission'
    if (restaurant.payment_model === 'commission') {
      const { data: rateData, error: rateError } = await supabaseClient
        .rpc('get_restaurant_commission_rate', { p_restaurant_id: orderData.restaurant_id });

      const commissionRate = rateError ? 5.00 : (rateData || 5.00);
      const commissionAmount = Math.round(subtotal * (commissionRate / 100));

      const { error: commissionError } = await supabaseClient
        .from('restaurant_commissions')
        .insert({
          restaurant_id: orderData.restaurant_id,
          order_id: order.id,
          order_subtotal: subtotal,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          currency: 'CDF',
          status: 'pending'
        });

      if (commissionError) {
        console.error('⚠️ Commission creation failed:', commissionError);
      } else {
        console.log(`💰 Commission créée: ${commissionAmount} CDF (${commissionRate}% de ${subtotal} CDF)`);
      }
    } else {
      console.log('✅ Restaurant avec abonnement - Pas de commission');
    }

    // 8. Créer notification pour le restaurant
    await supabaseClient.from('delivery_notifications').insert({
      user_id: restaurant.user_id,
      title: '🍽️ Nouvelle commande !',
      message: `Nouvelle commande #${order.order_number} - ${totalAmount} CDF`,
      notification_type: 'new_order',
      delivery_order_id: order.id,
    });

    console.log('🎉 Order processed successfully!');

    return new Response(
      JSON.stringify({
        success: true,
        order,
        message: 'Commande créée avec succès',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Order processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
