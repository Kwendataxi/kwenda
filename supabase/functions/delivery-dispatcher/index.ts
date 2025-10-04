import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapping des types de livraison vers les classes de véhicules
const DELIVERY_TO_VEHICLE_MAPPING: Record<string, string> = {
  'flash': 'moto',        // Livraison express → Moto-taxi
  'flex': 'standard',     // Livraison standard → Véhicule standard
  'maxicharge': 'truck'   // Gros colis → Camion/Truck
};

const getVehicleClassForDelivery = (deliveryType: string): string | null => {
  const normalizedType = deliveryType.toLowerCase();
  return DELIVERY_TO_VEHICLE_MAPPING[normalizedType] || null;
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
  city?: string;
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

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🚚 DELIVERY DISPATCHER INVOKED`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`📍 Pickup: (${pickupLat}, ${pickupLng})`);
    console.log(`🚛 Delivery Type: ${deliveryType}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Récupérer les détails de la commande pour la ville
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

    // Ne pas notifier si déjà assigné
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

    // Déterminer la classe de véhicule requise et la ville
    const requiredVehicleClass = getVehicleClassForDelivery(deliveryType);
    const userCity = orderDetails.city || 'Kinshasa';

    console.log(`🚗 Type de livraison: ${deliveryType} → Véhicule requis: ${requiredVehicleClass}`);
    console.log(`🌍 Ville de commande: ${userCity}`);

    // Recherche en cascade avec filtres véhicule + ville (jusqu'à 50km max dans la même ville)
    const radiusLevels = [5, 10, 15, 20, 30, 50];
    let drivers: any[] = [];
    let finalRadius = 5;

    for (const radius of radiusLevels) {
      console.log(`🔍 Searching ${requiredVehicleClass} vehicles within ${radius}km in ${userCity}...`);
      console.log(`   RPC Parameters:`, {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        service_type_param: 'delivery',
        radius_km: radius,
        vehicle_class_filter: requiredVehicleClass,
        user_city_param: userCity
      });
      
      const { data, error } = await supabase.rpc('find_nearby_drivers', {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        service_type_param: 'delivery',
        radius_km: radius,
        vehicle_class_filter: requiredVehicleClass,
        user_city_param: userCity
      });
      
      console.log(`   RPC Response:`, { data, error });

      if (error) {
        console.error(`❌ RPC Error at ${radius}km:`, {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        continue;
      }

      console.log(`   RPC Success - Found ${data?.length || 0} ${requiredVehicleClass} drivers in ${userCity}`);
      
      if (data && data.length > 0) {
        drivers = data;
        finalRadius = radius;
        console.log(`✅ MATCH! ${drivers.length} ${requiredVehicleClass} driver(s) found at ${radius}km in ${userCity}`);
        console.log(`   Driver IDs:`, drivers.map(d => d.driver_id));
        break;
      } else {
        console.log(`   No ${requiredVehicleClass} drivers in ${userCity}, expanding to ${radiusLevels[radiusLevels.indexOf(radius) + 1] || 'max'}km...`);
      }
    }
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    if (!drivers || drivers.length === 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ AUCUN CHAUFFEUR TROUVÉ');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Raisons possibles:');
      console.log(`  1. Aucun ${requiredVehicleClass} en ligne dans ${userCity} (rayon 50km)`);
      console.log('  2. Tous les chauffeurs sont occupés (is_available=false)');
      console.log('  3. Aucun chauffeur avec delivery_enabled=true');
      console.log('  4. last_ping trop ancien (>30min)');
      console.log(`  5. Aucun ${requiredVehicleClass} dans service_areas="${userCity}"`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Aucun ${requiredVehicleClass} disponible dans ${userCity} (rayon 50km)`,
          drivers_searched: 0,
          debug: {
            searched_radiuses: radiusLevels,
            service_type: 'delivery',
            required_vehicle: requiredVehicleClass,
            city: userCity,
            timestamp: new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ DRIVERS FOUND: ${drivers.length} ${requiredVehicleClass} at ${finalRadius}km in ${userCity}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    drivers.forEach((driver, idx) => {
      console.log(`Driver #${idx + 1}:`, {
        id: driver.driver_id,
        distance: driver.distance_km + 'km',
        vehicle: driver.vehicle_class,
        available: driver.is_available,
        rating: driver.rating_average,
        rides_remaining: driver.rides_remaining
      });
    });
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
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