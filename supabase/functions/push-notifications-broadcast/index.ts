import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface BroadcastRequest {
  title: string;
  message: string;
  type: 'system' | 'promo' | 'urgent' | 'update' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'clients' | 'drivers' | 'partners' | 'vendors' | 'admins';
  target_city?: string;
  target_user_ids?: string[];
  data?: Record<string, any>;
  scheduled_at?: string;
}

interface SendResult {
  user_id: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const results: SendResult[] = [];

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authorization token");
    }

    // Check if user is admin
    const { data: adminCheck } = await supabaseClient
      .from('admins')
      .select('id, admin_level')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminCheck) {
      throw new Error("Only admins can broadcast notifications");
    }

    const body = await req.json();
    const { 
      title, 
      message, 
      type = 'system', 
      priority = 'normal', 
      target_audience,
      target_type,  // Fallback for legacy frontend
      target_city,
      target_user_ids,
      data 
    } = body;

    // Support both field names for compatibility
    const audience = target_audience || target_type || null;

    if (!title || !message || !audience) {
      throw new Error("Missing required fields: title, message, target_audience");
    }

    console.log(`📢 Admin ${user.email} broadcasting ${priority} ${type} notification to ${audience}`);

    // Build user query based on target audience
    let userIds: string[] = [];

    if (target_user_ids && target_user_ids.length > 0) {
      // Specific users provided
      userIds = target_user_ids;
    } else {
      // Query users based on audience
      switch (audience) {
        case 'clients': {
          let query = supabaseClient.from('clients').select('user_id').eq('is_active', true);
          if (target_city) query = query.eq('city', target_city);
          const { data: clients } = await query;
          userIds = clients?.map(c => c.user_id) || [];
          break;
        }
        case 'drivers': {
          let query = supabaseClient.from('chauffeurs').select('user_id').eq('is_active', true);
          const { data: drivers } = await query;
          userIds = drivers?.map(d => d.user_id) || [];
          break;
        }
        case 'partners': {
          const { data: partners } = await supabaseClient
            .from('partenaires')
            .select('user_id')
            .eq('is_active', true);
          userIds = partners?.map(p => p.user_id) || [];
          break;
        }
        case 'vendors': {
          let query = supabaseClient.from('vendor_profiles').select('user_id').eq('is_active', true);
          if (target_city) query = query.eq('city', target_city);
          const { data: vendors } = await query;
          userIds = vendors?.map(v => v.user_id) || [];
          break;
        }
        case 'admins': {
          const { data: admins } = await supabaseClient
            .from('admins')
            .select('user_id')
            .eq('is_active', true);
          userIds = admins?.map(a => a.user_id) || [];
          break;
        }
        case 'all': {
          // Get all active users from auth.users (via profiles or clients)
          const { data: allClients } = await supabaseClient
            .from('clients')
            .select('user_id')
            .eq('is_active', true);
          const { data: allDrivers } = await supabaseClient
            .from('chauffeurs')
            .select('user_id')
            .eq('is_active', true);
          const { data: allPartners } = await supabaseClient
            .from('partenaires')
            .select('user_id')
            .eq('is_active', true);
          const { data: allVendors } = await supabaseClient
            .from('vendor_profiles')
            .select('user_id')
            .eq('is_active', true);

          const allIds = new Set([
            ...(allClients?.map(c => c.user_id) || []),
            ...(allDrivers?.map(d => d.user_id) || []),
            ...(allPartners?.map(p => p.user_id) || []),
            ...(allVendors?.map(v => v.user_id) || [])
          ]);
          userIds = Array.from(allIds);
          break;
        }
      }
    }

    console.log(`📊 Found ${userIds.length} target users for broadcast`);

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No users found for target audience",
          stats: { total: 0, sent: 0, failed: 0 }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create broadcast record
    const { data: broadcast, error: broadcastError } = await supabaseClient
      .from('admin_notifications')
      .insert({
        title,
        message,
        type: 'broadcast',
        severity: priority === 'urgent' ? 'critical' : priority === 'high' ? 'warning' : 'info',
        data: {
          broadcast_type: type,
          target_audience: audience,
          target_city,
          user_count: userIds.length,
          sent_by: user.id
        },
        is_read: false
      })
      .select()
      .single();

    // Batch insert notifications
    const BATCH_SIZE = 100;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE);
      
      const notifications = batch.map(userId => ({
        user_id: userId,
        title,
        message,
        notification_type: type,
        priority,
        data: data || {},
        is_sent: false
      }));

      const { data: inserted, error: insertError } = await supabaseClient
        .from('push_notifications')
        .insert(notifications)
        .select('id, user_id');

      if (insertError) {
        console.error(`❌ Batch insert error:`, insertError);
        failedCount += batch.length;
        batch.forEach(uid => results.push({ user_id: uid, success: false, error: insertError.message }));
        continue;
      }

      // Send realtime notifications
      for (const notification of inserted || []) {
        try {
          const channel = supabaseClient.channel(`notifications:${notification.user_id}`);
          await channel.send({
            type: 'broadcast',
            event: 'new_notification',
            payload: {
              id: notification.id,
              title,
              message,
              type,
              priority,
              data: data || {},
              timestamp: new Date().toISOString()
            }
          });

          // Mark as sent
          await supabaseClient
            .from('push_notifications')
            .update({ is_sent: true, sent_at: new Date().toISOString() })
            .eq('id', notification.id);

          sentCount++;
          results.push({ user_id: notification.user_id, success: true });
        } catch (sendError) {
          console.error(`⚠️ Send error for user ${notification.user_id}:`, sendError);
          failedCount++;
          results.push({ 
            user_id: notification.user_id, 
            success: false, 
            error: sendError instanceof Error ? sendError.message : 'Unknown error' 
          });
        }
      }

      console.log(`📤 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${inserted?.length || 0} sent`);
    }

    const duration = Date.now() - startTime;

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'broadcast_notification',
        description: `Broadcast "${title}" to ${audience} (${sentCount} sent, ${failedCount} failed)`,
        metadata: {
          broadcast_id: broadcast?.id,
          target_audience: audience,
          target_city,
          total_users: userIds.length,
          sent_count: sentCount,
          failed_count: failedCount,
          duration_ms: duration
        }
      });

    console.log(`✅ Broadcast complete: ${sentCount} sent, ${failedCount} failed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Broadcast envoyé à ${sentCount} utilisateurs`,
        stats: {
          total: userIds.length,
          sent: sentCount,
          failed: failedCount,
          duration_ms: duration
        },
        broadcast_id: broadcast?.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Broadcast error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "Échec de l'envoi du broadcast"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
