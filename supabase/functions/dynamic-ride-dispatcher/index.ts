import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DynamicDispatchRequest {
  bookingId: string;
  pickupLat: number;
  pickupLng: number;
  serviceType: 'taxi' | 'delivery';
  vehicleClass?: string;
  priority?: 'normal' | 'high' | 'urgent';
  maxSearchRadius?: number;
}

interface SearchAttempt {
  radius: number;
  driversFound: number;
  success: boolean;
  searchTime: number;
  selectedDriver?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      bookingId, 
      pickupLat, 
      pickupLng, 
      serviceType, 
      vehicleClass, 
      priority = 'normal',
      maxSearchRadius = 50
    } = await req.json() as DynamicDispatchRequest;

    console.log(`🔄 [DynamicDispatch] Recherche dynamique pour booking ${bookingId}`);
    console.log(`📍 Position: ${pickupLat}, ${pickupLng} | Service: ${serviceType} | Priorité: ${priority}`);

    // Rayons de recherche progressifs
    const searchRadii = priority === 'urgent' 
      ? [5, 10, 15, 25, 50]
      : priority === 'high' 
      ? [5, 10, 20, 35]
      : [5, 10, 15, 25];

    const searchAttempts: SearchAttempt[] = [];
    let finalDriver: any = null;
    let totalSearchTime = 0;

    // Notification utilisateur de début de recherche
    await supabase.from('delivery_notifications').insert([{
      user_id: (await supabase.from(`${serviceType === 'taxi' ? 'transport_bookings' : 'delivery_orders'}`)
        .select('user_id')
        .eq('id', bookingId)
        .single()).data?.user_id,
      title: 'Recherche en cours',
      message: 'Recherche d\'un chauffeur dans votre zone...',
      notification_type: 'status_update',
      metadata: { bookingId, searchRadius: searchRadii[0] }
    }]);

    // Recherche par cercles concentriques
    for (let i = 0; i < searchRadii.length; i++) {
      const radius = searchRadii[i];
      const attemptStart = Date.now();
      
      console.log(`🔍 [DynamicDispatch] Tentative ${i + 1}/${searchRadii.length} - Rayon: ${radius}km`);

      try {
        // Recherche stricte avec validation temps réel
        const { data: drivers, error } = await supabase.rpc('find_nearby_drivers', {
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          max_distance_km: radius,
          vehicle_class_filter: vehicleClass
        });

        if (error) {
          console.error(`❌ [DynamicDispatch] Erreur RPC rayon ${radius}km:`, error);
          continue;
        }

        // Filtrage strict des chauffeurs vraiment disponibles WITH RIDES VERIFICATION
        const availableDrivers = (drivers || []).filter((driver: any) => {
          const lastPing = new Date(driver.last_ping || 0);
          const pingAgeMinutes = (Date.now() - lastPing.getTime()) / (1000 * 60);
          
          return driver.is_online && 
                 driver.is_available && 
                 pingAgeMinutes < 2 && // Ping obligatoire < 2 minutes
                 (driver.balance || 0) >= (driver.minimum_balance || 1000) && // Solde suffisant
                 (driver.rides_remaining || 0) > 0; // ✅ NOUVEAU : Courses restantes
        });

        const searchTime = Date.now() - attemptStart;
        totalSearchTime += searchTime;

        const attempt: SearchAttempt = {
          radius,
          driversFound: availableDrivers.length,
          success: availableDrivers.length > 0,
          searchTime
        };

        console.log(`📊 [DynamicDispatch] Rayon ${radius}km: ${availableDrivers.length} chauffeurs actifs`);

        if (availableDrivers.length > 0) {
          // Calculer score et sélectionner le meilleur
          const scoredDrivers = availableDrivers.map((driver: any) => ({
            ...driver,
            score: calculateDriverScore(driver, priority, radius)
          })).sort((a: any, b: any) => b.score - a.score);

          finalDriver = scoredDrivers[0];
          attempt.selectedDriver = finalDriver;
          attempt.success = true;
          
          console.log(`🎯 [DynamicDispatch] Chauffeur sélectionné: ${finalDriver.driver_id} (Score: ${finalDriver.score}, Distance: ${finalDriver.distance_km}km)`);
          break;
        }

        searchAttempts.push(attempt);

        // Notification extension de recherche (sauf dernier rayon)
        if (i < searchRadii.length - 1) {
          await supabase.from('delivery_notifications').insert([{
            user_id: (await supabase.from(`${serviceType === 'taxi' ? 'transport_bookings' : 'delivery_orders'}`)
              .select('user_id')
              .eq('id', bookingId)
              .single()).data?.user_id,
            title: 'Extension de recherche',
            message: `Extension de la recherche à ${searchRadii[i + 1]}km...`,
            notification_type: 'status_update',
            metadata: { bookingId, searchRadius: searchRadii[i + 1], attempt: i + 1 }
          }]);

          // Délai entre tentatives
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (attemptError) {
        console.error(`❌ [DynamicDispatch] Erreur tentative rayon ${radius}km:`, attemptError);
        searchAttempts.push({
          radius,
          driversFound: 0,
          success: false,
          searchTime: Date.now() - attemptStart
        });
      }
    }

    // Résultat final
    if (finalDriver) {
      // Assigner le chauffeur
      const updateTable = serviceType === 'taxi' ? 'transport_bookings' : 'delivery_orders';
      
      await supabase
        .from(updateTable)
        .update({
          driver_id: finalDriver.driver_id,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      // Marquer chauffeur comme occupé
      await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', finalDriver.driver_id);

      // ✅ NOUVEAU : Consommer une course
      try {
        const { data: consumeResult, error: consumeError } = await supabase.functions.invoke('consume-ride', {
          body: {
            driver_id: finalDriver.driver_id,
            booking_id: bookingId,
            service_type: serviceType
          }
        });

        if (consumeError) {
          console.warn('⚠️ Erreur consommation course:', consumeError);
        } else {
          console.log(`✅ Course consommée. Courses restantes: ${consumeResult?.rides_remaining || 0}`);
        }
      } catch (consumeErr) {
        console.error('❌ Erreur critique consume-ride:', consumeErr);
      }

      // Notification succès
      await supabase.from('delivery_notifications').insert([{
        user_id: (await supabase.from(updateTable)
          .select('user_id')
          .eq('id', bookingId)
          .single()).data?.user_id,
        title: 'Chauffeur trouvé !',
        message: `Chauffeur assigné - Arrivée estimée: ${Math.ceil(finalDriver.distance_km * 2.5)} min`,
        notification_type: 'driver_assigned',
        metadata: { 
          bookingId, 
          driverId: finalDriver.driver_id,
          distance: finalDriver.distance_km,
          searchAttempts: searchAttempts.length + 1,
          rides_remaining: finalDriver.rides_remaining || 0
        }
      }]);

      // Log succès
      await supabase.from('activity_logs').insert([{
        activity_type: 'dynamic_dispatch_success',
        description: `Chauffeur trouvé après recherche dynamique`,
        metadata: {
          bookingId,
          driverId: finalDriver.driver_id,
          searchAttempts: searchAttempts.length + 1,
          totalSearchTime,
          finalRadius: finalDriver.distance_km,
          priority,
          serviceType
        }
      }]);

      return new Response(JSON.stringify({
        success: true,
        driver: {
          driver_id: finalDriver.driver_id,
          distance_km: finalDriver.distance_km,
          estimated_arrival_minutes: Math.ceil(finalDriver.distance_km * 2.5),
          score: finalDriver.score,
          rides_remaining: finalDriver.rides_remaining || 0
        },
        searchDetails: {
          attempts: searchAttempts.length + 1,
          totalSearchTime,
          maxRadiusUsed: searchAttempts[searchAttempts.length - 1]?.radius || searchRadii[0]
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else {
      // Aucun chauffeur trouvé - suggestions alternatives
      await supabase.from('delivery_notifications').insert([{
        user_id: (await supabase.from(`${serviceType === 'taxi' ? 'transport_bookings' : 'delivery_orders'}`)
          .select('user_id')
          .eq('id', bookingId)
          .single()).data?.user_id,
        title: 'Aucun chauffeur disponible',
        message: 'Nous vous suggérons de réessayer dans quelques minutes ou de programmer votre course.',
        notification_type: 'no_driver_available',
        metadata: { 
          bookingId, 
          searchAttempts: searchAttempts.length,
          maxRadiusSearched: Math.max(...searchRadii)
        }
      }]);

      // Log échec
      await supabase.from('activity_logs').insert([{
        activity_type: 'dynamic_dispatch_failed',
        description: `Aucun chauffeur disponible après recherche dynamique`,
        metadata: {
          bookingId,
          searchAttempts: searchAttempts.length,
          totalSearchTime,
          maxRadiusSearched: Math.max(...searchRadii),
          priority,
          serviceType
        }
      }]);

      return new Response(JSON.stringify({
        success: false,
        message: `Aucun chauffeur disponible dans un rayon de ${Math.max(...searchRadii)}km`,
        searchDetails: {
          attempts: searchAttempts.length,
          totalSearchTime,
          maxRadiusSearched: Math.max(...searchRadii)
        },
        suggestions: [
          'Réessayer dans 5-10 minutes',
          'Programmer pour plus tard',
          'Vérifier les heures de pointe'
        ]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error('❌ [DynamicDispatch] Erreur générale:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

function calculateDriverScore(driver: any, priority: string, searchRadius: number): number {
  const distanceScore = Math.max(0, 100 - (driver.distance_km * 10));
  const ratingScore = (driver.rating_average || 0) * 20;
  const experienceScore = Math.min(50, (driver.total_rides || 0) * 0.5);
  const availabilityBonus = driver.is_verified ? 20 : 0;
  const proximityBonus = searchRadius <= 10 ? 15 : searchRadius <= 25 ? 10 : 5;
  
  // ✅ NOUVEAU : Bonus pour courses restantes élevées
  const ridesBonus = Math.min(15, (driver.rides_remaining || 0) * 1.5);
  
  const priorityMultiplier = priority === 'urgent' ? 1.4 : priority === 'high' ? 1.2 : 1.0;
  
  return (distanceScore + ratingScore + experienceScore + availabilityBonus + proximityBonus + ridesBonus) * priorityMultiplier;
}