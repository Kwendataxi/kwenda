import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryOrder {
  id: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: string;
  estimated_price: number;
  user_id: string;
  sender_phone?: string;
  recipient_phone?: string;
  sender_name?: string;
  recipient_name?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, pickupLat, pickupLng, deliveryType } = await req.json();

    console.log(`🚚 Looking for driver for delivery order ${orderId}`);
    console.log(`📍 Pickup location: ${pickupLat}, ${pickupLng}`);
    console.log(`🚛 Delivery type: ${deliveryType}`);

    // Phase 4: Recherche en cascade 5km → 10km → 15km → 20km
    const radiusLevels = [5, 10, 15, 20];
    let drivers: any[] = [];
    let finalRadius = 5;

    for (const radius of radiusLevels) {
      console.log(`🔍 Searching drivers within ${radius}km...`);
      
      const { data, error } = await supabase.rpc('find_nearby_drivers', {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        service_type_param: 'delivery',
        radius_km: radius
      });

      if (error) {
        console.error(`❌ Error finding drivers at ${radius}km:`, error);
        continue;
      }

      if (data && data.length > 0) {
        drivers = data;
        finalRadius = radius;
        console.log(`✅ Found ${drivers.length} drivers at ${radius}km`);
        break;
      }
    }

    if (!drivers || drivers.length === 0) {
      console.log('❌ No drivers available for delivery in 20km radius');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun livreur disponible dans votre zone (rayon 20km)',
          drivers_searched: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${drivers.length} available drivers at ${finalRadius}km`);
    
    // PHASE 3: Récupérer les détails et vérifier si déjà assigné
    const { data: orderDetails, error: orderError } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('❌ Could not get order details:', orderError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order not found'
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // PHASE 3: Ne pas notifier si déjà assigné
    if (orderDetails.driver_id) {
      console.log(`⚠️ Order ${orderId} already assigned to driver ${orderDetails.driver_id}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Order already assigned',
          orderId,
          assignedDriverId: orderDetails.driver_id
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Phase 4: Scoring multi-critères pour sélectionner le meilleur
    const scoredDrivers = drivers.map(driver => {
      const distanceScore = (1 / (driver.distance_km + 0.1)) * 40;
      const ratingScore = (driver.rating_average || 0) * 4;
      const ridesScore = Math.min((driver.rides_remaining || 0) * 2, 20);
      const timeScore = 10;
      const refusalScore = 10;
      
      return {
        ...driver,
        total_score: distanceScore + ratingScore + ridesScore + timeScore + refusalScore
      };
    }).sort((a, b) => b.total_score - a.total_score);

    // Phase 4: Notifier les TOP 5 chauffeurs
    const topDrivers = scoredDrivers.slice(0, Math.min(5, scoredDrivers.length));
    
    console.log(`🎯 Notifying top ${topDrivers.length} drivers`);

    // PHASE 3 & 4: Envoyer des alertes avec expiration
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 minutes
    
    const alertPromises = topDrivers.map(async (driver, index) => {
      const { error: alertError } = await supabase
        .from('delivery_driver_alerts')
        .insert([{
          order_id: orderId,
          driver_id: driver.driver_id,
          alert_type: 'new_delivery_request',
          distance_km: driver.distance_km,
          response_status: 'sent',
          expires_at: expiresAt,
          order_details: {
            pickup_location: orderDetails?.pickup_location,
            delivery_location: orderDetails?.delivery_location,
            estimated_price: orderDetails?.estimated_price,
            delivery_type: deliveryType
          }
        }]);

      if (alertError) {
        console.warn(`⚠️ Could not create alert for driver ${driver.driver_id}:`, alertError);
      } else {
        console.log(`✅ Alert sent to driver #${index + 1} (${driver.driver_id}) - Expires in 3min - Distance: ${driver.distance_km.toFixed(1)}km - Score: ${driver.total_score.toFixed(1)}`);
      }
    });

    await Promise.all(alertPromises);
    
    // Sélectionner le meilleur chauffeur pour l'assignation par défaut (si pas de réponse)
    const selectedDriver = topDrivers[0];
    
    console.log(`🎯 Selected best driver ${selectedDriver.driver_id} - Score: ${selectedDriver.total_score.toFixed(1)}`);

    // Note: Ne pas assigner automatiquement, attendre l'acceptation via les alertes
    // L'assignation se fera dans le hook useDriverOrderNotifications.acceptOrder()


    console.log('✅ Driver notifications sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        drivers_notified: topDrivers.length,
        selected_driver: {
          id: selectedDriver.driver_id,
          distance: selectedDriver.distance_km,
          score: selectedDriver.total_score,
          vehicle_class: selectedDriver.vehicle_class,
          rides_remaining: selectedDriver.rides_remaining || 0
        },
        search_radius: finalRadius,
        message: `${topDrivers.length} livreur(s) notifié(s) - En attente d'acceptation`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Delivery dispatcher error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Erreur lors de l\'assignation du livreur'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});