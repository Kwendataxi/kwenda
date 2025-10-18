/**
 * ✅ PHASE 4: UNIFIED DISPATCHER
 * 
 * Fusionne toutes les Edge Functions dispatch:
 * - ride-dispatcher (taxi)
 * - delivery-dispatcher (livraison)
 * - smart-ride-dispatcher (intelligent)
 * 
 * Avantages:
 * - Code unifié et maintenable
 * - Rate limiting commun
 * - Logs standardisés
 * - Circuit breaker partagé
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, RATE_LIMITS } from "../_shared/ratelimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// TYPES
// ============================================

interface UnifiedDispatchRequest {
  orderType: 'taxi' | 'delivery' | 'marketplace';
  orderId: string;
  pickupLat: number;
  pickupLng: number;
  deliveryLat?: number;
  deliveryLng?: number;
  serviceType?: string;
  vehicleClass?: string;
  deliveryType?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  city?: string;
}

interface DriverMatch {
  driver_id: string;
  distance_km: number;
  vehicle_class: string;
  rating_average: number;
  total_rides: number;
  is_verified: boolean;
  rides_remaining: number;
  score: number;
}

// ============================================
// MAPPING DELIVERY TYPES
// ============================================

const DELIVERY_TO_VEHICLE_MAPPING: Record<string, string> = {
  'flash': 'moto',
  'flex': 'standard',
  'maxicharge': 'truck'
};

const getVehicleClassForDelivery = (deliveryType: string): string | null => {
  const normalizedType = deliveryType.toLowerCase();
  return DELIVERY_TO_VEHICLE_MAPPING[normalizedType] || null;
};

// ============================================
// SCORING ALGORITHM
// ============================================

function calculateDriverScore(
  driver: any,
  priority: string = 'normal',
  orderType: 'taxi' | 'delivery' | 'marketplace' = 'taxi'
): number {
  const distanceScore = Math.max(0, 100 - (driver.distance_km * 10));
  const ratingScore = (driver.rating_average || 0) * 20;
  const experienceScore = Math.min(50, (driver.total_rides || 0) * 0.5);
  const verificationBonus = driver.is_verified ? 20 : 0;
  const ridesBonus = Math.min(15, (driver.rides_remaining || 0) * 1.5);

  // Bonus selon type de commande
  let typeBonus = 0;
  if (orderType === 'delivery') {
    typeBonus = (driver.vehicle_class === 'moto') ? 10 : 5;
  }

  const priorityMultiplier = priority === 'urgent' ? 1.3 : priority === 'high' ? 1.2 : 1.0;

  return (distanceScore + ratingScore + experienceScore + verificationBonus + ridesBonus + typeBonus) * priorityMultiplier;
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return withRateLimit(req, RATE_LIMITS.CLIENT, async (req) => {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const request = await req.json() as UnifiedDispatchRequest;
      const {
        orderType,
        orderId,
        pickupLat,
        pickupLng,
        deliveryLat,
        deliveryLng,
        serviceType = 'taxi',
        vehicleClass,
        deliveryType,
        priority = 'normal',
        city = 'Kinshasa'
      } = request;

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🎯 UNIFIED DISPATCHER - ${orderType.toUpperCase()}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 Order ID: ${orderId}`);
      console.log(`📍 Pickup: (${pickupLat}, ${pickupLng})`);
      console.log(`🏙️ City: ${city}`);
      console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // ============================================
      // DÉTERMINER VÉHICULE REQUIS
      // ============================================

      let requiredVehicleClass = vehicleClass;

      if (orderType === 'delivery' && deliveryType) {
        requiredVehicleClass = getVehicleClassForDelivery(deliveryType);
        console.log(`🚛 Delivery type: ${deliveryType} → Vehicle: ${requiredVehicleClass}`);
      }

      // ============================================
      // RECHERCHE DRIVERS EN CASCADE
      // ============================================

      const radiusLevels = [5, 10, 15, 20, 30, 50];
      let drivers: any[] = [];
      let finalRadius = 5;

      for (const radius of radiusLevels) {
        console.log(`🔍 Searching ${requiredVehicleClass || 'any'} vehicles within ${radius}km in ${city}...`);

        const { data, error } = await supabase.rpc('find_nearby_drivers', {
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          service_type_param: orderType === 'taxi' ? 'taxi' : 'delivery',
          radius_km: radius,
          vehicle_class_filter: requiredVehicleClass,
          user_city_param: city
        });

        if (error) {
          console.error(`❌ RPC Error at ${radius}km:`, error);
          continue;
        }

        console.log(`   Found ${data?.length || 0} driver(s)`);

        if (data && data.length > 0) {
          drivers = data;
          finalRadius = radius;
          console.log(`✅ MATCH! ${drivers.length} driver(s) at ${radius}km`);
          break;
        }
      }

      // ============================================
      // AUCUN DRIVER TROUVÉ
      // ============================================

      if (!drivers || drivers.length === 0) {
        console.log(`❌ NO DRIVERS FOUND`);

        await supabase.from('activity_logs').insert([{
          activity_type: `${orderType}_dispatch_failed`,
          description: `No drivers found for ${orderType} order ${orderId}`,
          metadata: {
            orderId,
            orderType,
            pickupLat,
            pickupLng,
            city,
            priority,
            vehicleClass: requiredVehicleClass,
            searchRadii: radiusLevels
          }
        }]);

        return new Response(
          JSON.stringify({
            success: false,
            message: `Aucun ${requiredVehicleClass || 'chauffeur'} disponible dans ${city} (rayon 50km)`,
            drivers_searched: 0,
            retry_suggested: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ============================================
      // SCORING ET SÉLECTION
      // ============================================

      const scoredDrivers = drivers.map(driver => ({
        ...driver,
        score: calculateDriverScore(driver, priority, orderType)
      })).sort((a: DriverMatch, b: DriverMatch) => b.score - a.score);

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`✅ FOUND ${scoredDrivers.length} DRIVERS`);
      scoredDrivers.forEach((d, i) => {
        console.log(`  #${i + 1}: ${d.driver_id} - Score: ${d.score.toFixed(1)} - Dist: ${d.distance_km}km`);
      });
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // ============================================
      // ASSIGNATION OU NOTIFICATION
      // ============================================

      if (orderType === 'taxi') {
        // TAXI: Assignation automatique au meilleur
        const selectedDriver = scoredDrivers[0];

        const { error: updateError } = await supabase
          .from('transport_bookings')
          .update({
            driver_id: selectedDriver.driver_id,
            status: 'driver_assigned',
            driver_assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Marquer driver busy
        await supabase.from('driver_locations').update({
          is_available: false,
          updated_at: new Date().toISOString()
        }).eq('driver_id', selectedDriver.driver_id);

        // Consommer course
        await supabase.functions.invoke('consume-ride', {
          body: {
            driver_id: selectedDriver.driver_id,
            booking_id: orderId,
            service_type: 'transport'
          }
        });

        // Notification
        await supabase.from('driver_ride_notifications').insert([{
          driver_id: selectedDriver.driver_id,
          booking_id: orderId,
          notification_type: 'ride_request',
          title: `Nouvelle course ${serviceType.toUpperCase()}`,
          message: `Distance: ${selected Driver.distance_km.toFixed(1)}km`,
          metadata: { score: selectedDriver.score, priority },
          status: 'pending',
          expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString()
        }]);

        return new Response(
          JSON.stringify({
            success: true,
            driver: {
              driver_id: selectedDriver.driver_id,
              distance_km: selectedDriver.distance_km,
              score: selectedDriver.score
            },
            message: 'Driver assigned successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } else {
        // DELIVERY: Notifier top 5 drivers
        const topDrivers = scoredDrivers.slice(0, 5);
        const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();

        const alertPromises = topDrivers.map(async driver => {
          await supabase.from('delivery_driver_alerts').insert([{
            order_id: orderId,
            driver_id: driver.driver_id,
            alert_type: 'new_delivery_request',
            distance_km: driver.distance_km,
            response_status: 'sent',
            expires_at: expiresAt,
            order_details: {
              estimated_price: request.estimatedPrice || 0,
              delivery_type: deliveryType
            }
          }]);
        });

        await Promise.all(alertPromises);

        return new Response(
          JSON.stringify({
            success: true,
            drivers_notified: topDrivers.length,
            selected_driver: {
              id: topDrivers[0].driver_id,
              distance: topDrivers[0].distance_km,
              score: topDrivers[0].score
            },
            search_radius: finalRadius,
            message: `${topDrivers.length} drivers notified`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (error) {
      console.error('❌ Unified dispatcher error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  });
});
