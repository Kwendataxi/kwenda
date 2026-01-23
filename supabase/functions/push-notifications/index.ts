import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface NotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type: 'ride_request' | 'delivery_request' | 'marketplace_order' | 'system' | 'urgent';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: any;
  sound?: boolean;
  vibration?: boolean;
  timeout?: number;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const { user_id, title, message, type, priority = 'normal', data, sound = true, vibration = true, timeout = 30000 }: NotificationRequest = await req.json();

    if (!user_id || !title || !message || !type) {
      throw new Error("Missing required fields: user_id, title, message, type");
    }

    console.log(`📱 Sending ${priority} notification to user ${user_id}: ${title}`);

    // Insérer dans la table des notifications
    const { data: notification, error: insertError } = await supabaseClient
      .from('push_notifications')
      .insert({
        user_id: user_id,
        title: title,
        message: message,
        notification_type: type,
        priority: priority,
        data: data || {},
        is_sent: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database insert error:', insertError);
      throw new Error('Failed to create notification record');
    }

    // Envoyer notification temps réel via Supabase Realtime
    const channel = supabaseClient.channel(`notifications:${user_id}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'new_notification',
      payload: {
        id: notification.id,
        title: title,
        message: message,
        type: type,
        priority: priority,
        data: data || {},
        sound: sound,
        vibration: vibration,
        timeout: timeout,
        timestamp: new Date().toISOString()
      }
    });

    // Marquer comme envoyée
    const { error: updateError } = await supabaseClient
      .from('push_notifications')
      .update({ 
        is_sent: true,
        sent_at: new Date().toISOString() 
      })
      .eq('id', notification.id);

    if (updateError) {
      console.error('⚠️ Error updating notification status:', updateError);
    }

    // Log de l'activité
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user_id,
        activity_type: 'notification_sent',
        description: `Notification ${type} envoyée: ${title}`,
        metadata: {
          notification_id: notification.id,
          type: type,
          priority: priority,
          title: title
        }
      });

    console.log(`✅ Notification sent successfully to user ${user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        message: `Notification envoyée avec succès`,
        delivery_method: 'realtime'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Push notification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Échec de l\'envoi de la notification'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});