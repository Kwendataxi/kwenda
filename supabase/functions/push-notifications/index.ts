import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to log webhook audit
async function logWebhookAudit(supabase: any, payload: any, response: any, error?: string) {
  try {
    await supabase.rpc('log_webhook_audit', {
      p_webhook_type: 'push_notification',
      p_payload: payload,
      p_response: response,
      p_status: error ? 'error' : 'success',
      p_error_message: error || null
    });
  } catch (auditError) {
    console.error('Failed to log webhook audit:', auditError);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestPayload = await req.json();
  
  try {
    const { user_id, title, message, type, priority = 'normal', data = {} } = requestPayload;
    
    if (!user_id || !title || !message) {
      const errorResponse = { error: 'user_id, title, and message are required' };
      await logWebhookAudit(null, requestPayload, errorResponse, 'Validation failed');
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Sending notification to user: ${user_id}`);

    // 1. Insérer la notification dans la base
    const { data: notification, error: dbError } = await supabase
      .from('push_notifications')
      .insert({
        user_id,
        title,
        message,
        notification_type: type || 'general',
        priority,
        data,
        is_sent: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Envoyer via FCM si configuré
    let fcmSuccess = false;
    if (fcmServerKey) {
      try {
        // Récupérer le FCM token de l'utilisateur
        const { data: profile } = await supabase
          .from('profiles')
          .select('fcm_token')
          .eq('user_id', user_id)
          .single();

        if (profile?.fcm_token) {
          const fcmPayload = {
            to: profile.fcm_token,
            notification: {
              title,
              body: message,
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: type || 'general'
            },
            data: {
              notification_id: notification.id,
              type: type || 'general',
              priority,
              ...data
            }
          };

          const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${fcmServerKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fcmPayload),
          });

          const fcmResult = await fcmResponse.json();
          fcmSuccess = fcmResult.success === 1;
          console.log('FCM result:', fcmResult);
        }
      } catch (fcmError) {
        console.error('FCM error:', fcmError);
      }
    }

    // 3. Envoyer via Supabase Realtime
    try {
      await supabase
        .channel(`notifications:${user_id}`)
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: {
            id: notification.id,
            title,
            message,
            type: type || 'general',
            priority,
            data,
            timestamp: new Date().toISOString()
          }
        });
    } catch (realtimeError) {
      console.error('Realtime error:', realtimeError);
    }

    // 4. Marquer comme envoyée
    await supabase
      .from('push_notifications')
      .update({ 
        is_sent: true,
        sent_at: new Date().toISOString(),
        fcm_success: fcmSuccess
      })
      .eq('id', notification.id);

    const successResponse = {
      success: true,
      notification_id: notification.id,
      fcm_sent: fcmSuccess
    };

    // Log success audit
    await logWebhookAudit(supabase, requestPayload, successResponse);

    return new Response(JSON.stringify(successResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Push notification error:', error);
    const errorResponse = { 
      error: 'Internal server error',
      details: error.message 
    };
    
    // Log error audit
    await logWebhookAudit(supabase, requestPayload, errorResponse, error.message);
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});