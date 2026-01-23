import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface FCMNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  category: 'transport' | 'delivery' | 'marketplace' | 'food' | 'lottery' | 'chat' | 'payment' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data?: Record<string, any>;
  image_url?: string;
  action_url?: string;
  actions?: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
  ttl?: number; // Time to live in seconds
  collapse_key?: string; // For grouping similar notifications
}

interface FCMMessage {
  message: {
    token: string;
    notification: {
      title: string;
      body: string;
      image?: string;
    };
    data: Record<string, string>;
    android?: {
      priority: 'normal' | 'high';
      ttl: string;
      notification: {
        icon?: string;
        color?: string;
        sound?: string;
        click_action?: string;
        channel_id?: string;
      };
    };
    apns?: {
      payload: {
        aps: {
          alert: {
            title: string;
            body: string;
          };
          sound?: string;
          badge?: number;
          category?: string;
          'mutable-content'?: number;
        };
      };
    };
    webpush?: {
      notification: {
        icon?: string;
        badge?: string;
        actions?: Array<{ action: string; title: string }>;
      };
      fcm_options?: {
        link?: string;
      };
    };
  };
}

// Get FCM access token using service account
async function getFCMAccessToken(): Promise<string | null> {
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  
  if (!serviceAccountJson) {
    console.log("⚠️ FIREBASE_SERVICE_ACCOUNT not configured, using fallback");
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Create JWT for FCM
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/firebase.messaging"
    };

    // Sign JWT (simplified - in production use proper JWT signing)
    // For now, return null to use fallback method
    console.log("📱 FCM service account configured for project:", serviceAccount.project_id);
    return null;
  } catch (error) {
    console.error("❌ Error parsing service account:", error);
    return null;
  }
}

// Send push via FCM HTTP v1 API
async function sendFCMPush(token: string, notification: FCMNotificationRequest): Promise<boolean> {
  const accessToken = await getFCMAccessToken();
  
  if (!accessToken) {
    // Fallback: Use Supabase Realtime
    return false;
  }

  const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
  
  const fcmMessage: FCMMessage = {
    message: {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        image: notification.image_url,
      },
      data: {
        category: notification.category,
        priority: notification.priority,
        action_url: notification.action_url || '',
        ...Object.fromEntries(
          Object.entries(notification.data || {}).map(([k, v]) => [k, String(v)])
        ),
      },
      android: {
        priority: notification.priority === 'urgent' || notification.priority === 'high' ? 'high' : 'normal',
        ttl: `${notification.ttl || 86400}s`,
        notification: {
          icon: 'ic_notification',
          color: '#3B82F6',
          sound: 'default',
          channel_id: `kwenda_${notification.category}`,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            sound: 'default',
            badge: 1,
            category: notification.category.toUpperCase(),
            'mutable-content': 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          actions: notification.actions?.map(a => ({
            action: a.id,
            title: a.title,
          })),
        },
        fcm_options: notification.action_url ? {
          link: notification.action_url,
        } : undefined,
      },
    },
  };

  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmMessage),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ FCM error:', error);
      return false;
    }

    console.log('✅ FCM push sent successfully');
    return true;
  } catch (error) {
    console.error('❌ FCM request failed:', error);
    return false;
  }
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

    const notification: FCMNotificationRequest = await req.json();

    if (!notification.user_id || !notification.title || !notification.body) {
      throw new Error("Missing required fields: user_id, title, body");
    }

    console.log(`📱 [PUSH-V2] Sending ${notification.priority} notification to user ${notification.user_id}`);
    console.log(`📱 Category: ${notification.category}, Title: ${notification.title}`);

    // Get user's FCM token
    const { data: tokenData } = await supabaseClient
      .from('push_notification_tokens')
      .select('token, platform')
      .eq('user_id', notification.user_id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    let deliveryMethod = 'realtime';
    let fcmSent = false;

    // Try FCM first if token exists
    if (tokenData?.token) {
      console.log(`📱 Found FCM token for platform: ${tokenData.platform}`);
      fcmSent = await sendFCMPush(tokenData.token, notification);
      if (fcmSent) {
        deliveryMethod = 'fcm';
      }
    }

    // Always save to notification log for history
    const { data: logEntry, error: logError } = await supabaseClient
      .from('user_notification_logs')
      .insert({
        user_id: notification.user_id,
        title: notification.title,
        message: notification.body,
        category: notification.category,
        priority: notification.priority,
        action_url: notification.action_url,
        metadata: {
          ...notification.data,
          image_url: notification.image_url,
          actions: notification.actions,
          delivery_method: deliveryMethod,
          fcm_sent: fcmSent,
        },
        is_read: false,
        is_archived: false,
      })
      .select()
      .single();

    if (logError) {
      console.error('⚠️ Error saving notification log:', logError);
    }

    // Also send via Supabase Realtime for in-app notifications
    const channel = supabaseClient.channel(`notifications:${notification.user_id}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'new_notification',
      payload: {
        id: logEntry?.id || crypto.randomUUID(),
        title: notification.title,
        message: notification.body,
        category: notification.category,
        priority: notification.priority,
        action_url: notification.action_url,
        image_url: notification.image_url,
        actions: notification.actions,
        data: notification.data || {},
        timestamp: new Date().toISOString(),
        delivery_method: deliveryMethod,
      }
    });

    // Update activity log
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: notification.user_id,
        activity_type: 'push_notification_v2',
        description: `Notification ${notification.category}: ${notification.title}`,
        metadata: {
          notification_id: logEntry?.id,
          category: notification.category,
          priority: notification.priority,
          delivery_method: deliveryMethod,
          fcm_sent: fcmSent,
        }
      });

    console.log(`✅ [PUSH-V2] Notification delivered via ${deliveryMethod}`);

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: logEntry?.id,
        delivery_method: deliveryMethod,
        fcm_sent: fcmSent,
        message: `Notification envoyée via ${deliveryMethod}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ [PUSH-V2] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
