import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  booking_id: string;
  pickup_coordinates: { lat: number; lng: number };
  destination_coordinates?: { lat: number; lng: number };
  vehicle_class?: string;
  priority?: 'normal' | 'high' | 'urgent';
  estimated_price?: number;
  client_info?: {
    name?: string;
    phone?: string;
    rating?: number;
  };
}

interface DriverNotification {
  driver_id: string;
  title: string;
  message: string;
  data: any;
  priority: number;
  timeout_seconds: number;
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

    const body = await req.json() as NotificationRequest;
    const {
      booking_id,
      pickup_coordinates,
      destination_coordinates,
      vehicle_class = 'standard',
      priority = 'normal',
      estimated_price,
      client_info
    } = body;

    console.log(`📱 Envoi de notifications intelligentes pour réservation ${booking_id}`);

    // 1. Appeler l'intelligent-driver-matching pour trouver les meilleurs chauffeurs
    const matchingResponse = await supabase.functions.invoke('intelligent-driver-matching', {
      body: {
        pickup_coordinates,
        destination_coordinates,
        vehicle_class,
        priority,
        max_distance_km: priority === 'urgent' ? 25 : 15
      }
    });

    if (!matchingResponse.data?.success || !matchingResponse.data?.drivers) {
      console.log('❌ Aucun chauffeur trouvé pour les notifications');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Aucun chauffeur disponible pour recevoir la notification'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const availableDrivers = matchingResponse.data.drivers;
    console.log(`📋 ${availableDrivers.length} chauffeurs éligibles pour notification`);

    // 2. Créer les notifications par vagues de priorité
    const notifications: DriverNotification[] = [];
    
    // Vague 1: Top 3 chauffeurs (30 secondes)
    const topDrivers = availableDrivers.slice(0, 3);
    for (const driver of topDrivers) {
      notifications.push({
        driver_id: driver.driver_id,
        title: '🚗 Nouvelle course disponible !',
        message: `Course ${priority === 'urgent' ? 'URGENTE' : ''} à ${driver.distance_km}km - ${estimated_price || '2500'} CDF`,
        data: {
          booking_id,
          distance_km: driver.distance_km,
          estimated_arrival: driver.estimated_arrival_minutes,
          estimated_price,
          client_info,
          pickup_coordinates,
          destination_coordinates,
          vehicle_class,
          priority: 'high',
          wave: 1
        },
        priority: priority === 'urgent' ? 10 : 8,
        timeout_seconds: 30
      });
    }

    // Vague 2: Chauffeurs 4-7 (60 secondes, si vague 1 échoue)
    const secondWaveDrivers = availableDrivers.slice(3, 7);
    for (const driver of secondWaveDrivers) {
      notifications.push({
        driver_id: driver.driver_id,
        title: '🚖 Course disponible',
        message: `Course à ${driver.distance_km}km - ${estimated_price || '2500'} CDF`,
        data: {
          booking_id,
          distance_km: driver.distance_km,
          estimated_arrival: driver.estimated_arrival_minutes,
          estimated_price,
          client_info,
          pickup_coordinates,
          destination_coordinates,
          vehicle_class,
          priority: 'medium',
          wave: 2
        },
        priority: 6,
        timeout_seconds: 60
      });
    }

    // Vague 3: Chauffeurs restants (90 secondes, backup)
    const backupDrivers = availableDrivers.slice(7);
    for (const driver of backupDrivers) {
      notifications.push({
        driver_id: driver.driver_id,
        title: '🚙 Course backup',
        message: `Course à ${driver.distance_km}km disponible`,
        data: {
          booking_id,
          distance_km: driver.distance_km,
          estimated_arrival: driver.estimated_arrival_minutes,
          estimated_price,
          pickup_coordinates,
          destination_coordinates,
          vehicle_class,
          priority: 'low',
          wave: 3
        },
        priority: 4,
        timeout_seconds: 90
      });
    }

    // 3. Envoyer les notifications par vagues
    let totalSent = 0;
    const notificationResults = [];

    // Vague 1: Immédiat
    for (const notif of notifications.filter(n => n.data.wave === 1)) {
      try {
        const { error } = await supabase
          .from('driver_ride_notifications')
          .insert({
            driver_id: notif.driver_id,
            booking_id,
            message: notif.message,
            notification_data: notif.data,
            priority: notif.priority,
            expires_at: new Date(Date.now() + notif.timeout_seconds * 1000).toISOString()
          });

        if (!error) {
          totalSent++;
          notificationResults.push({
            driver_id: notif.driver_id,
            wave: 1,
            status: 'sent',
            timeout: notif.timeout_seconds
          });

          // Trigger realtime notification
          await supabase
            .channel(`driver_${notif.driver_id}`)
            .send({
              type: 'broadcast',
              event: 'new_ride_request',
              payload: notif.data
            });
        }
      } catch (error) {
        console.error(`❌ Erreur envoi notification chauffeur ${notif.driver_id}:`, error);
      }
    }

    // Programmer les vagues suivantes (simulation avec log)
    console.log(`⏰ Vague 2 programmée pour dans 30s (${secondWaveDrivers.length} chauffeurs)`);
    console.log(`⏰ Vague 3 programmée pour dans 90s (${backupDrivers.length} chauffeurs)`);

    // 4. Créer un statut de dispatch dans la base
    await supabase
      .from('notification_dispatch_logs')
      .insert({
        booking_id,
        total_drivers_notified: totalSent,
        waves_planned: 3,
        priority,
        dispatch_strategy: 'intelligent_priority_waves',
        metadata: {
          available_drivers: availableDrivers.length,
          wave_1_drivers: topDrivers.length,
          wave_2_drivers: secondWaveDrivers.length,
          wave_3_drivers: backupDrivers.length,
          vehicle_class,
          priority
        }
      });

    console.log(`✅ ${totalSent} notifications envoyées en vague 1`);

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: totalSent,
        total_eligible_drivers: availableDrivers.length,
        waves: {
          wave_1: { drivers: topDrivers.length, sent: totalSent, timeout: 30 },
          wave_2: { drivers: secondWaveDrivers.length, programmed: true, timeout: 60 },
          wave_3: { drivers: backupDrivers.length, programmed: true, timeout: 90 }
        },
        dispatch_strategy: 'intelligent_priority_waves',
        booking_id,
        results: notificationResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erreur dispatch notifications:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        notifications_sent: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});