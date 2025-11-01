import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`Assigning delivery for order: ${orderId}`);

    // 1. Récupérer la commande avec les infos du restaurant
    const { data: order, error: orderError } = await supabase
      .from('food_orders')
      .select(`
        *,
        restaurant:restaurant_profiles(
          id,
          restaurant_name,
          city,
          address,
          coordinates
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(
        JSON.stringify({ error: 'Commande non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.restaurant) {
      return new Response(
        JSON.stringify({ error: 'Restaurant non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Trouver un livreur disponible dans la même ville
    const { data: drivers, error: driverError } = await supabase
      .from('delivery_partners')
      .select('user_id, display_name, phone_number')
      .eq('is_available', true)
      .eq('city', order.restaurant.city)
      .eq('is_active', true)
      .limit(5);

    if (driverError) {
      console.error('Driver fetch error:', driverError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la recherche de livreur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!drivers || drivers.length === 0) {
      console.log('No available drivers found');
      return new Response(
        JSON.stringify({ error: 'Aucun livreur disponible dans cette ville' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sélectionner le premier livreur disponible
    const driver = drivers[0];
    console.log(`Selected driver: ${driver.user_id} - ${driver.display_name}`);

    // 3. Créer la mission de livraison
    const { error: deliveryError } = await supabase
      .from('delivery_orders')
      .insert({
        user_id: order.customer_id,
        driver_id: driver.user_id,
        delivery_type: 'food',
        pickup_location: order.restaurant.address || 'Adresse du restaurant',
        pickup_coordinates: order.restaurant.coordinates,
        delivery_location: order.delivery_address,
        delivery_coordinates: order.delivery_coordinates,
        total_price: order.delivery_fee,
        status: 'assigned',
        notes: `Commande Food #${order.order_number}`,
        food_order_id: orderId
      });

    if (deliveryError) {
      console.error('Delivery creation error:', deliveryError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création de la livraison' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Mettre à jour le statut de la commande
    const { error: updateError } = await supabase
      .from('food_orders')
      .update({
        status: 'picked_up',
        driver_id: driver.user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
    }

    // 5. Notifier le livreur
    await supabase.from('delivery_notifications').insert({
      user_id: driver.user_id,
      title: '📦 Nouvelle livraison Food',
      message: `Restaurant: ${order.restaurant.restaurant_name} → ${order.delivery_address}`,
      notification_type: 'new_delivery',
      related_order_id: orderId
    });

    // 6. Notifier le client
    await supabase.from('delivery_notifications').insert({
      user_id: order.customer_id,
      title: '🚗 Livreur assigné',
      message: `${driver.display_name} va livrer votre commande`,
      notification_type: 'order_update',
      related_order_id: orderId
    });

    console.log(`Delivery assigned successfully to driver ${driver.display_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        driverName: driver.display_name,
        driverPhone: driver.phone_number
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
