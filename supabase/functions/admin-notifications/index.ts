import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!adminCheck) {
      throw new Error('Accès administrateur requis');
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (action === 'stats') {
      // Get notification statistics
      const { data: stats } = await supabase
        .from('admin_notifications')
        .select('type, severity, is_read, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const summary = {
        total: stats?.length || 0,
        unread: stats?.filter(n => !n.is_read).length || 0,
        by_type: stats?.reduce((acc: any, n: any) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {}),
        by_severity: stats?.reduce((acc: any, n: any) => {
          acc[n.severity] = (acc[n.severity] || 0) + 1;
          return acc;
        }, {}),
        recent: stats?.slice(0, 10)
      };

      return new Response(
        JSON.stringify({ success: true, stats: summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send') {
      const { type, title, message, severity = 'info', data = {} } = await req.json();

      const { error: insertError } = await supabase
        .from('admin_notifications')
        .insert({
          type,
          title,
          message,
          severity,
          data,
          is_read: false
        });

      if (insertError) throw insertError;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'admin_notification_sent',
        description: `Notification admin envoyée: ${title}`,
        metadata: { type, severity }
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Notification créée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Action inconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in admin-notifications:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
