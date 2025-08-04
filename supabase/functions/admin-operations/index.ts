import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminOperationRequest {
  operation: 'assign_role' | 'remove_role' | 'validate_driver' | 'bulk_update' | 'get_analytics';
  data: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token d\'authentification manquant' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.substring(7);
    
    // Vérifier l'utilisateur
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Utilisateur non authentifié' }),
        { status: 401, headers: corsHeaders }
      );
    }

    console.log('Admin operation requested by user:', user.id);

    // Vérifier les permissions admin
    const { data: hasAdminPerm, error: permError } = await supabaseClient.rpc('has_permission', {
      _user_id: user.id,
      _permission: 'system_admin'
    });

    if (permError || !hasAdminPerm) {
      return new Response(
        JSON.stringify({ success: false, error: 'Permissions administrateur requises' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const { operation, data }: AdminOperationRequest = await req.json();
    console.log('Processing admin operation:', operation, data);

    let result;

    switch (operation) {
      case 'assign_role':
        result = await assignRole(supabaseClient, data, user.id);
        break;
      
      case 'remove_role':
        result = await removeRole(supabaseClient, data, user.id);
        break;
      
      case 'validate_driver':
        result = await validateDriver(supabaseClient, data, user.id);
        break;
      
      case 'bulk_update':
        result = await bulkUpdate(supabaseClient, data, user.id);
        break;
      
      case 'get_analytics':
        result = await getAnalytics(supabaseClient, data, user.id);
        break;
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Opération non supportée' }),
          { status: 400, headers: corsHeaders }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in admin operations:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur interne du serveur' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function assignRole(supabaseClient: any, data: any, adminId: string) {
  const { userId, role, adminRole } = data;
  
  if (!userId || !role) {
    throw new Error('UserId et role sont requis');
  }

  // Vérifier si l'utilisateur existe
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('Utilisateur introuvable');
  }

  // Assigner le rôle
  const { data: roleData, error: roleError } = await supabaseClient
    .from('user_roles')
    .insert({
      user_id: userId,
      role,
      admin_role: adminRole || null,
      assigned_by: adminId
    })
    .select()
    .single();

  if (roleError) {
    throw new Error(`Erreur lors de l'assignation: ${roleError.message}`);
  }

  // Logger l'activité
  await supabaseClient
    .from('activity_logs')
    .insert({
      user_id: adminId,
      activity_type: 'role_assignment',
      description: `Rôle ${role} ${adminRole ? `(${adminRole})` : ''} assigné à l'utilisateur ${userId}`,
      reference_type: 'user_role',
      reference_id: roleData.id
    });

  return roleData;
}

async function removeRole(supabaseClient: any, data: any, adminId: string) {
  const { userId, role, adminRole } = data;
  
  if (!userId || !role) {
    throw new Error('UserId et role sont requis');
  }

  let query = supabaseClient
    .from('user_roles')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('role', role);

  if (adminRole) {
    query = query.eq('admin_role', adminRole);
  } else {
    query = query.is('admin_role', null);
  }

  const { error: roleError } = await query;

  if (roleError) {
    throw new Error(`Erreur lors de la suppression: ${roleError.message}`);
  }

  // Logger l'activité
  await supabaseClient
    .from('activity_logs')
    .insert({
      user_id: adminId,
      activity_type: 'role_removal',
      description: `Rôle ${role} ${adminRole ? `(${adminRole})` : ''} retiré à l'utilisateur ${userId}`,
      reference_type: 'user_role',
      reference_id: userId
    });

  return { success: true };
}

async function validateDriver(supabaseClient: any, data: any, adminId: string) {
  const { requestId, status, comments } = data;
  
  if (!requestId || !status) {
    throw new Error('RequestId et status sont requis');
  }

  // Mettre à jour le statut de validation
  const { data: request, error: updateError } = await supabaseClient
    .from('driver_requests')
    .update({
      status,
      validation_comments: comments,
      validated_by: adminId,
      validation_date: new Date().toISOString(),
      ...(status === 'approved' && { approved_at: new Date().toISOString() })
    })
    .eq('id', requestId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Erreur lors de la validation: ${updateError.message}`);
  }

  // Si approuvé, créer le profil chauffeur et assigner le rôle
  if (status === 'approved') {
    // Créer le profil chauffeur
    const { error: profileError } = await supabaseClient
      .from('driver_profiles')
      .insert({
        user_id: request.user_id,
        license_number: request.license_number,
        vehicle_make: request.vehicle_model.split(' ')[0],
        vehicle_model: request.vehicle_model,
        vehicle_year: request.vehicle_year,
        vehicle_plate: request.vehicle_plate,
        insurance_number: request.insurance_number,
        verification_status: 'verified',
        is_active: true
      });

    if (profileError) {
      console.error('Error creating driver profile:', profileError);
    }

    // Assigner le rôle driver
    await supabaseClient
      .from('user_roles')
      .insert({
        user_id: request.user_id,
        role: 'driver',
        assigned_by: adminId
      });
  }

  // Logger l'activité
  await supabaseClient
    .from('activity_logs')
    .insert({
      user_id: adminId,
      activity_type: 'driver_validation',
      description: `Demande chauffeur ${status} pour l'utilisateur ${request.user_id}`,
      reference_type: 'driver_request',
      reference_id: requestId
    });

  return request;
}

async function bulkUpdate(supabaseClient: any, data: any, adminId: string) {
  const { table, updates, filters } = data;
  
  if (!table || !updates) {
    throw new Error('Table et updates sont requis');
  }

  // Sécurité: lister les tables autorisées
  const allowedTables = [
    'driver_profiles',
    'partner_profiles', 
    'marketplace_products',
    'enhanced_support_tickets'
  ];

  if (!allowedTables.includes(table)) {
    throw new Error('Table non autorisée pour les mises à jour en masse');
  }

  let query = supabaseClient.from(table).update(updates);

  // Appliquer les filtres
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  const { data: result, error: updateError } = await query.select();

  if (updateError) {
    throw new Error(`Erreur lors de la mise à jour en masse: ${updateError.message}`);
  }

  // Logger l'activité
  await supabaseClient
    .from('activity_logs')
    .insert({
      user_id: adminId,
      activity_type: 'bulk_update',
      description: `Mise à jour en masse de ${result?.length || 0} enregistrements dans ${table}`,
      reference_type: 'bulk_operation',
      metadata: { table, updates, filters, count: result?.length }
    });

  return { updated: result?.length || 0, data: result };
}

async function getAnalytics(supabaseClient: any, data: any, adminId: string) {
  const { type, dateRange } = data;
  
  const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = dateRange?.end || new Date().toISOString();

  let result = {};

  switch (type) {
    case 'overview':
      result = await getOverviewAnalytics(supabaseClient, startDate, endDate);
      break;
    case 'financial':
      result = await getFinancialAnalytics(supabaseClient, startDate, endDate);
      break;
    case 'operational':
      result = await getOperationalAnalytics(supabaseClient, startDate, endDate);
      break;
    default:
      throw new Error('Type d\'analytics non supporté');
  }

  return result;
}

async function getOverviewAnalytics(supabaseClient: any, startDate: string, endDate: string) {
  // Statistiques générales
  const [
    { count: totalUsers },
    { count: totalDrivers },
    { count: totalPartners },
    { count: activeRides },
    { count: todayRides }
  ] = await Promise.all([
    supabaseClient.from('profiles').select('id', { count: 'exact' }),
    supabaseClient.from('driver_profiles').select('id', { count: 'exact' }).eq('is_active', true),
    supabaseClient.from('partner_profiles').select('id', { count: 'exact' }),
    supabaseClient.from('transport_bookings').select('id', { count: 'exact' }).in('status', ['confirmed', 'in_progress']),
    supabaseClient.from('transport_bookings').select('id', { count: 'exact' }).gte('created_at', startDate)
  ]);

  return {
    totalUsers,
    totalDrivers,
    totalPartners,
    activeRides,
    todayRides
  };
}

async function getFinancialAnalytics(supabaseClient: any, startDate: string, endDate: string) {
  // Revenus et transactions
  const { data: transactions } = await supabaseClient
    .from('wallet_transactions')
    .select('amount, transaction_type, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const totalRevenue = transactions?.reduce((sum: number, t: any) => 
    t.transaction_type === 'credit' ? sum + t.amount : sum, 0) || 0;

  return {
    totalRevenue,
    transactionCount: transactions?.length || 0,
    transactions: transactions || []
  };
}

async function getOperationalAnalytics(supabaseClient: any, startDate: string, endDate: string) {
  // Métriques opérationnelles
  const [
    { data: completedRides },
    { data: deliveries },
    { data: marketplaceOrders }
  ] = await Promise.all([
    supabaseClient
      .from('transport_bookings')
      .select('*')
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabaseClient
      .from('delivery_orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabaseClient
      .from('marketplace_orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
  ]);

  return {
    completedRides: completedRides?.length || 0,
    deliveries: deliveries?.length || 0,
    marketplaceOrders: marketplaceOrders?.length || 0
  };
}