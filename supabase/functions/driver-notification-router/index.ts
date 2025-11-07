import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRouteRequest {
  orderType: 'taxi' | 'delivery' | 'marketplace';
  orderId: string;
  orderData: any;
  targetRadius?: number; // km
  pickupLat?: number;
  pickupLng?: number;
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

    const { 
      orderType, 
      orderId, 
      orderData, 
      targetRadius = 10,
      pickupLat,
      pickupLng 
    }: NotificationRouteRequest = await req.json();

    console.log(`📡 Routing ${orderType} order ${orderId} to eligible drivers`);

    // 1. Déterminer le service_type requis
    let requiredServiceType: 'taxi' | 'delivery';
    
    if (orderType === 'taxi') {
      requiredServiceType = 'taxi';
    } else {
      // delivery et marketplace nécessitent un livreur
      requiredServiceType = 'delivery';
    }

    console.log(`🎯 Required service type: ${requiredServiceType}`);

    // 2. Récupérer UNIQUEMENT les chauffeurs du bon type via RPC
    const { data: eligibleDrivers, error: driversError } = await supabase
      .rpc('get_drivers_by_service_type', {
        service_filter: requiredServiceType,
        is_online_filter: true
      });

    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: driversError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`✅ Found ${eligibleDrivers?.length || 0} eligible ${requiredServiceType} drivers`);

    if (!eligibleDrivers || eligibleDrivers.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          notifiedCount: 0,
          message: `No ${requiredServiceType} drivers online`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 3. Filtrer par distance si coordonnées fournies
    let targetDrivers = eligibleDrivers;
    
    if (pickupLat && pickupLng) {
      targetDrivers = eligibleDrivers.filter(driver => {
        if (!driver.current_location?.lat || !driver.current_location?.lng) {
          return false;
        }
        
        const distance = calculateDistance(
          pickupLat,
          pickupLng,
          driver.current_location.lat,
          driver.current_location.lng
        );
        
        return distance <= targetRadius;
      });
      
      console.log(`📍 ${targetDrivers.length} drivers within ${targetRadius}km radius`);
    }

    // 4. Créer les notifications selon le type de commande
    const notifications = [];
    
    for (const driver of targetDrivers) {
      let notificationData;
      
      if (orderType === 'taxi') {
        notificationData = {
          driver_id: driver.driver_id,
          booking_id: orderId,
          message: `Nouvelle course taxi: ${orderData.pickup_location || 'Lieu de départ'} → ${orderData.destination || 'Destination'}`,
          notification_type: 'new_booking',
          priority: 'medium',
          expires_at: new Date(Date.now() + 60000).toISOString() // 60s
        };
      } else if (orderType === 'delivery') {
        notificationData = {
          driver_id: driver.driver_id,
          order_id: orderId,
          message: `Nouvelle livraison ${orderData.delivery_type || ''}: ${orderData.pickup_location || 'Retrait'} → ${orderData.delivery_location || 'Livraison'}`,
          notification_type: 'new_delivery',
          priority: orderData.delivery_type === 'flash' ? 'high' : 'medium',
          delivery_type: orderData.delivery_type,
          estimated_distance_km: orderData.distance_km,
          estimated_price: orderData.estimated_price,
          expires_at: new Date(Date.now() + 90000).toISOString() // 90s
        };
      } else if (orderType === 'marketplace') {
        notificationData = {
          driver_id: driver.driver_id,
          order_id: orderId,
          message: `Livraison marketplace: ${orderData.pickup_location || 'Retrait vendeur'}`,
          notification_type: 'marketplace_delivery',
          priority: 'high',
          delivery_fee: orderData.delivery_fee,
          expires_at: new Date(Date.now() + 90000).toISOString()
        };
      }
      
      notifications.push(notificationData);
    }

    // 5. Insérer les notifications dans la bonne table
    let insertResult;
    
    if (orderType === 'taxi') {
      insertResult = await supabase
        .from('driver_notifications')
        .insert(notifications);
    } else {
      insertResult = await supabase
        .from('delivery_driver_alerts')
        .insert(notifications);
    }

    if (insertResult.error) {
      console.error('❌ Error inserting notifications:', insertResult.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: insertResult.error.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 6. Log l'activité
    await supabase.from('activity_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      activity_type: 'dispatch',
      description: `Routed ${orderType} order to ${notifications.length} ${requiredServiceType} drivers`,
      metadata: {
        order_id: orderId,
        order_type: orderType,
        service_type: requiredServiceType,
        notified_drivers: notifications.length,
        radius_km: targetRadius
      }
    });

    console.log(`✅ Successfully notified ${notifications.length} drivers`);

    return new Response(
      JSON.stringify({ 
        success: true,
        notifiedCount: notifications.length,
        serviceType: requiredServiceType,
        message: `Notified ${notifications.length} ${requiredServiceType} drivers`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('💥 Routing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper: Calcul de distance Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
