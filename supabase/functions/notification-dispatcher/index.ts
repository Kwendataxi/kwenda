import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DispatchRequest {
  event_type: 'ride_request' | 'delivery_request' | 'order_status' | 'driver_found' | 'payment_success';
  target_users?: string[];
  target_roles?: string[];
  data: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  zone_filter?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { event_type, target_users, target_roles, data, priority = 'normal', zone_filter }: DispatchRequest = await req.json();

    if (!event_type || !data) {
      throw new Error("Missing required fields: event_type, data");
    }

    console.log(`📡 Dispatching ${event_type} notifications with priority ${priority}`);

    let recipients: string[] = [];

    // Déterminer les destinataires selon le type d'événement
    if (target_users && target_users.length > 0) {
      recipients = target_users;
    } else {
      // Logique de ciblage automatique selon l'événement
      switch (event_type) {
        case 'ride_request':
          // Notifier les chauffeurs disponibles dans la zone
          const { data: nearbyDrivers } = await supabaseClient
            .from('driver_locations')
            .select('driver_id')
            .eq('is_online', true)
            .eq('is_available', true)
            .gte('last_ping', new Date(Date.now() - 5 * 60 * 1000).toISOString());

          recipients = nearbyDrivers?.map(d => d.driver_id) || [];
          break;

        case 'delivery_request':
          // Notifier les livreurs disponibles
          const { data: availableDrivers } = await supabaseClient
            .from('driver_service_preferences')
            .select('driver_id')
            .contains('service_types', ['delivery'])
            .eq('is_active', true);

          recipients = availableDrivers?.map(d => d.driver_id) || [];
          break;

        case 'order_status':
          // Notifier le client et le vendeur concernés
          if (data.buyer_id) recipients.push(data.buyer_id);
          if (data.seller_id) recipients.push(data.seller_id);
          break;

        default:
          if (target_roles && target_roles.length > 0) {
            const { data: roleUsers } = await supabaseClient
              .from('user_roles')
              .select('user_id')
              .in('role', target_roles)
              .eq('is_active', true);

            recipients = roleUsers?.map(u => u.user_id) || [];
          }
      }
    }

    if (recipients.length === 0) {
      console.log('⚠️ No recipients found for notification dispatch');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No recipients found',
          recipients_count: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Générer le contenu de la notification selon l'événement
    const notificationContent = generateNotificationContent(event_type, data);

    // Envoyer les notifications en parallèle
    const notificationPromises = recipients.map(async (userId) => {
      try {
        const { data: result, error } = await supabaseClient.functions.invoke('push-notifications', {
          body: {
            user_id: userId,
            title: notificationContent.title,
            message: notificationContent.message,
            type: event_type,
            priority: priority,
            data: data,
            sound: priority === 'urgent' || priority === 'high',
            vibration: priority === 'urgent'
          }
        });

        if (error) {
          console.error(`❌ Failed to send notification to ${userId}:`, error);
          return { userId, success: false, error: error.message };
        }

        return { userId, success: true };
      } catch (error) {
        console.error(`❌ Error sending notification to ${userId}:`, error);
        return { userId, success: false, error: error.message };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`📊 Notification dispatch complete: ${successCount} success, ${failureCount} failures`);

    // Log de l'activité de dispatch
    await supabaseClient
      .from('activity_logs')
      .insert({
        activity_type: 'notification_dispatch',
        description: `Dispatch ${event_type}: ${successCount}/${results.length} envoyées`,
        metadata: {
          event_type: event_type,
          recipients_count: results.length,
          success_count: successCount,
          failure_count: failureCount,
          priority: priority
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        event_type: event_type,
        recipients_count: results.length,
        success_count: successCount,
        failure_count: failureCount,
        results: results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Notification dispatcher error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function generateNotificationContent(eventType: string, data: any): { title: string; message: string } {
  switch (eventType) {
    case 'ride_request':
      return {
        title: '🚗 Nouvelle course disponible',
        message: `${data.pickup_location || 'Nouvelle course'} → ${data.destination || 'Destination à confirmer'}`
      };

    case 'delivery_request':
      return {
        title: '📦 Nouvelle livraison assignée',
        message: `Livraison ${data.delivery_type || 'standard'} - ${data.pickup_location || 'Point de collecte'}`
      };

    case 'order_status':
      return {
        title: '📱 Mise à jour commande',
        message: `Votre commande est maintenant: ${data.status || 'mise à jour'}`
      };

    case 'driver_found':
      return {
        title: '✅ Chauffeur trouvé',
        message: `Votre chauffeur arrive dans ${data.estimated_arrival || '5'} minutes`
      };

    case 'payment_success':
      return {
        title: '💰 Paiement confirmé',
        message: `Paiement de ${data.amount || '0'} ${data.currency || 'CDF'} traité avec succès`
      };

    default:
      return {
        title: '🔔 Nouvelle notification',
        message: data.message || 'Vous avez une nouvelle notification'
      };
  }
}