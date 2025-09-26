import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type_id: string;
  template_id?: string;
  title: string;
  content: string;
  target_type: 'all_users' | 'all_clients' | 'all_drivers' | 'all_partners' | 'all_admins' | 'specific_users' | 'active_drivers' | 'verified_drivers' | 'zone_users';
  target_criteria?: {
    user_ids?: string[];
    role?: string;
    status?: string;
    zone?: string;
    city?: string;
    verification_status?: string;
  };
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_for?: string;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
}

interface TemplateRenderRequest {
  template_id: string;
  variables: Record<string, any>;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Vérifier les permissions
    const { data: permissions } = await supabase.rpc('get_user_roles', { _user_id: user.id });
    const hasNotificationPermission = permissions?.some((p: any) => 
      p.permissions?.includes('notifications_write') || p.permissions?.includes('notifications_admin')
    );

    if (!hasNotificationPermission) {
      throw new Error('Insufficient permissions');
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'send':
        return await handleSendNotification(req, supabase, user.id);
      case 'render-template':
        return await handleRenderTemplate(req, supabase);
      case 'stats':
        return await handleGetStats(req, supabase, user.id);
      default:
        throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in admin-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

async function handleSendNotification(req: Request, supabase: any, senderId: string): Promise<Response> {
  const notificationData: NotificationRequest = await req.json();
  
  console.log('Sending notification:', notificationData);

  // Créer l'enregistrement de notification admin
  const { data: adminNotification, error: createError } = await supabase
    .from('admin_notifications')
    .insert({
      type_id: notificationData.type_id,
      template_id: notificationData.template_id,
      sender_id: senderId,
      title: notificationData.title,
      content: notificationData.content,
      target_type: notificationData.target_type,
      target_criteria: notificationData.target_criteria,
      priority: notificationData.priority || 'normal',
      scheduled_for: notificationData.scheduled_for,
      status: notificationData.scheduled_for ? 'scheduled' : 'sending'
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create notification: ${createError.message}`);
  }

  // Si c'est programmé, ne pas envoyer maintenant
  if (notificationData.scheduled_for) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification scheduled successfully',
        notification_id: adminNotification.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Déterminer les destinataires
  let targetUsers: any[] = [];
  
  try {
    switch (notificationData.target_type) {
      case 'all_users':
        // Tous les utilisateurs avec limite de sécurité
        const { data: allUsers } = await supabase
          .from('clients')
          .select('user_id')
          .eq('is_active', true)
          .limit(1000);
        targetUsers = allUsers || [];
        break;

      case 'all_clients':
        const { data: clients } = await supabase
          .from('clients')
          .select('user_id')
          .eq('is_active', true)
          .limit(1000);
        targetUsers = clients || [];
        break;

      case 'all_drivers':
        const { data: drivers } = await supabase
          .from('chauffeurs')
          .select('user_id')
          .eq('is_active', true)
          .limit(1000);
        targetUsers = drivers || [];
        break;

      case 'all_partners':
        const { data: partners } = await supabase
          .from('partenaires')
          .select('user_id')
          .eq('is_active', true)
          .limit(1000);
        targetUsers = partners || [];
        break;

      case 'all_admins':
        const { data: admins } = await supabase
          .from('admins')
          .select('user_id')
          .eq('is_active', true)
          .limit(100);
        targetUsers = admins || [];
        break;

      case 'active_drivers':
        const { data: activeDrivers } = await supabase
          .from('chauffeurs')
          .select('user_id')
          .eq('is_active', true)
          .in('verification_status', ['verified', 'approved'])
          .limit(1000);
        targetUsers = activeDrivers || [];
        break;

      case 'verified_drivers':
        const { data: verifiedDrivers } = await supabase
          .from('chauffeurs')
          .select('user_id')
          .eq('verification_status', 'verified')
          .eq('is_active', true)
          .limit(1000);
        targetUsers = verifiedDrivers || [];
        break;

      case 'specific_users':
        targetUsers = (notificationData.target_criteria?.user_ids || []).map((id: string) => ({ user_id: id }));
        break;

      case 'zone_users':
        // Ciblage par zone géographique pour les chauffeurs
        const city = notificationData.target_criteria?.city || 'Kinshasa';
        const { data: zoneDrivers } = await supabase
          .from('chauffeurs')
          .select('user_id')
          .contains('service_areas', [city])
          .eq('is_active', true)
          .limit(1000);
        targetUsers = zoneDrivers || [];
        break;
    }

    console.log(`Targeting ${targetUsers.length} users`);

    // Créer les notifications individuelles
    const userNotifications = targetUsers.map(user => ({
      admin_notification_id: adminNotification.id,
      user_id: user.user_id,
      title: notificationData.title,
      content: notificationData.content,
      priority: notificationData.priority || 'normal',
      action_url: notificationData.action_url,
      action_label: notificationData.action_label,
      expires_at: notificationData.expires_at
    }));

    if (userNotifications.length > 0) {
      const { error: insertError } = await supabase
        .from('user_notifications')
        .insert(userNotifications);

      if (insertError) {
        console.error('Error inserting user notifications:', insertError);
        throw new Error(`Failed to create user notifications: ${insertError.message}`);
      }
    }

    // Mettre à jour les statistiques de la notification admin
    await supabase
      .from('admin_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_recipients: targetUsers.length,
        successful_sends: targetUsers.length,
        failed_sends: 0
      })
      .eq('id', adminNotification.id);

    console.log(`Notification sent successfully to ${targetUsers.length} users`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${targetUsers.length} users`,
        notification_id: adminNotification.id,
        recipients_count: targetUsers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending notifications:', error);
    
    // Marquer comme échoué
    await supabase
      .from('admin_notifications')
      .update({
        status: 'failed',
        total_recipients: targetUsers.length,
        successful_sends: 0,
        failed_sends: targetUsers.length
      })
      .eq('id', adminNotification.id);

    throw error;
  }
}

async function handleRenderTemplate(req: Request, supabase: any): Promise<Response> {
  const { template_id, variables }: TemplateRenderRequest = await req.json();

  const { data: template, error } = await supabase
    .from('admin_notification_templates')
    .select('title_template, content_template')
    .eq('id', template_id)
    .eq('is_active', true)
    .single();

  if (error || !template) {
    throw new Error('Template not found');
  }

  // Remplacement simple des variables {{variable}}
  let renderedTitle = template.title_template;
  let renderedContent = template.content_template;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    renderedTitle = renderedTitle.replace(new RegExp(placeholder, 'g'), String(value));
    renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), String(value));
  });

  return new Response(
    JSON.stringify({
      title: renderedTitle,
      content: renderedContent
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetStats(req: Request, supabase: any, userId: string): Promise<Response> {
  const { data: stats, error } = await supabase.rpc('get_notification_stats', { admin_id: userId });

  if (error) {
    throw new Error(`Failed to get stats: ${error.message}`);
  }

  return new Response(
    JSON.stringify(stats),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(handler);