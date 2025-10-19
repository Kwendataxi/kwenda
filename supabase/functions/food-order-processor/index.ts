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

    // 🚚 PHASE 1: Dispatcher les livreurs disponibles
    try {
      const driversNotified = await dispatchFoodDelivery({
        orderId: order.id,
        restaurantId: orderData.restaurant_id,
        restaurantName: restaurant.restaurant_name,
        deliveryAddress: orderData.delivery_address,
        deliveryCoords: orderData.delivery_coordinates,
        estimatedPrice: deliveryFee
      });
      
      console.log(`📡 ${driversNotified} chauffeurs notifiés pour commande ${order.id}`);
    } catch (dispatchError) {
      console.error('⚠️ Erreur dispatch livreurs (non bloquant):', dispatchError);
    }

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚚 DISPATCHER INTELLIGENT FOOD DELIVERY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface DispatchParams {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  deliveryAddress: string;
  deliveryCoords?: { lat: number; lng: number };
  estimatedPrice: number;
}

async function dispatchFoodDelivery(params: DispatchParams): Promise<number> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // 1. Récupérer les coordonnées du restaurant
  const { data: restaurant, error: restError } = await supabase
    .from('restaurant_profiles')
    .select('latitude, longitude')
    .eq('id', params.restaurantId)
    .single();

  if (restError || !restaurant?.latitude || !restaurant?.longitude) {
    console.error('❌ Restaurant coordinates not found:', restError);
    return 0;
  }

  const restaurantCoords = { lat: restaurant.latitude, lng: restaurant.longitude };

  // 2. Trouver chauffeurs éligibles avec service_type contenant 'delivery' ou 'food_delivery'
  const { data: driverProfiles, error: driverError } = await supabase
    .from('chauffeurs')
    .select(`
      user_id,
      display_name,
      rating_average,
      service_type,
      vehicle_class
    `)
    .eq('is_active', true)
    .eq('verification_status', 'verified');

  if (driverError || !driverProfiles) {
    console.error('❌ Error fetching drivers:', driverError);
    return 0;
  }

  // Filtrer les chauffeurs qui font de la livraison
  const eligibleDrivers = driverProfiles.filter(d => 
    d.service_type?.includes('delivery') || 
    d.service_type?.includes('food_delivery')
  );

  if (eligibleDrivers.length === 0) {
    console.log('⚠️ Aucun chauffeur livraison disponible');
    return 0;
  }

  // 3. Récupérer leurs préférences et dernière position
  const driverIds = eligibleDrivers.map(d => d.user_id);
  const { data: preferences } = await supabase
    .from('driver_service_preferences')
    .select('driver_id, last_known_latitude, last_known_longitude')
    .in('driver_id', driverIds)
    .eq('is_active', true);

  // 4. Vérifier abonnements actifs (courses restantes)
  const { data: subscriptions } = await supabase
    .from('driver_subscriptions')
    .select('driver_id, rides_remaining')
    .in('driver_id', driverIds)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString());

  const driversWithRides = new Set(
    subscriptions?.filter(s => s.rides_remaining > 0).map(s => s.driver_id) || []
  );

  // 5. Calculer distances et scorer
  const rankedDrivers = eligibleDrivers
    .map(driver => {
      const pref = preferences?.find(p => p.driver_id === driver.user_id);
      const lat = pref?.last_known_latitude || restaurantCoords.lat;
      const lng = pref?.last_known_longitude || restaurantCoords.lng;
      
      const distance = haversineDistance(
        restaurantCoords,
        { lat, lng }
      );

      const hasRides = driversWithRides.has(driver.user_id);
      const rating = driver.rating_average || 0;

      // Score = -distance (plus proche = meilleur) + bonus rating
      const score = -distance + (rating * 0.1) + (hasRides ? 100 : 0);

      return {
        driver_id: driver.user_id,
        driver_name: driver.display_name,
        distance,
        rating,
        hasRides,
        score
      };
    })
    .filter(d => d.distance <= 15 && d.hasRides) // Max 15km et doit avoir des courses
    .sort((a, b) => b.score - a.score);

  // 6. Notifier les 5 meilleurs chauffeurs
  const topDrivers = rankedDrivers.slice(0, 5);
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 min

  const alertsToInsert = topDrivers.map(driver => ({
    driver_id: driver.driver_id,
    order_id: params.orderId,
    alert_type: 'food_delivery',
    distance_km: driver.distance,
    order_details: {
      pickup_location: params.restaurantName,
      delivery_location: params.deliveryAddress,
      estimated_price: params.estimatedPrice,
      delivery_type: 'food'
    },
    expires_at: expiresAt
  }));

  if (alertsToInsert.length > 0) {
    const { error: alertError } = await supabase
      .from('delivery_driver_alerts')
      .insert(alertsToInsert);

    if (alertError) {
      console.error('❌ Error creating driver alerts:', alertError);
      return 0;
    }

    console.log(`✅ ${alertsToInsert.length} chauffeurs notifiés:`, 
      topDrivers.map(d => `${d.driver_name} (${d.distance.toFixed(1)}km)`).join(', ')
    );
  }

  return alertsToInsert.length;
}

/**
 * Formule de Haversine pour calculer distance entre 2 points GPS (en km)
 */
function haversineDistance(
  coords1: { lat: number; lng: number },
  coords2: { lat: number; lng: number }
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) *
      Math.cos(toRad(coords2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
