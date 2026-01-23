// Version: 2025-11-07T12:00:00Z - Admin functions deployment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // ✅ Extraire le token et le passer explicitement à getUser()
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Erreur validation user:', userError);
      return new Response(JSON.stringify({ error: 'Utilisateur invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Utiliser service role pour vérifier le rôle admin (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Vérification rôle admin pour user:', user.id);
    
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    console.log('📋 Résultat requête rôles:', { roles, roleError });

    if (roleError || !roles) {
      console.error('❌ Utilisateur non admin:', { user_id: user.id, roleError });
      return new Response(JSON.stringify({ 
        error: 'Accès refusé - Admin uniquement',
        debug: { user_id: user.id, hasRole: !!roles }
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ Utilisateur admin confirmé');

    const { vehicle_id, reason } = await req.json();

    console.log('📥 Payload reçu:', JSON.stringify({ vehicle_id, reason }));
    console.log('👤 Admin ID:', user.id);

    if (!vehicle_id || !reason) {
      console.error('❌ vehicle_id ou reason manquant dans le payload');
      return new Response(JSON.stringify({ error: 'vehicle_id et reason requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`❌ Rejet véhicule ${vehicle_id} par admin ${user.id}: ${reason}`);

    // Mettre à jour le véhicule
    console.log('🔄 Mise à jour rental_vehicles...');
    const { data: vehicle, error: updateError } = await supabaseAdmin
      .from('rental_vehicles')
      .update({
        moderation_status: 'rejected',
        moderator_id: user.id,
        moderated_at: new Date().toISOString(),
        rejection_reason: reason,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicle_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Erreur UPDATE rental_vehicles:', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint
      });
      throw updateError;
    }
    
    console.log('✅ Véhicule rejeté:', vehicle.id, vehicle.name);

    // Fetch partner data separately
    let partnerData = null;
    if (vehicle.partner_id) {
      const { data } = await supabaseAdmin
        .from('partenaires')
        .select('company_name, user_id')
        .eq('id', vehicle.partner_id)
        .maybeSingle();
      partnerData = data;
    }

    // Logger l'action
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'vehicle_rejected',
      description: `Véhicule "${vehicle.name}" rejeté: ${reason}`,
      reference_id: vehicle_id,
      reference_type: 'rental_vehicle',
      metadata: { vehicle_name: vehicle.name, rejection_reason: reason }
    });

    // Notifier le partenaire
    if (partnerData?.user_id) {
      await supabaseAdmin.from('user_notifications').insert({
        user_id: partnerData.user_id,
        title: '❌ Véhicule rejeté',
        message: `Votre véhicule "${vehicle.name}" nécessite des modifications: ${reason}`,
        type: 'warning',
        is_read: false,
        metadata: { vehicle_id, vehicle_name: vehicle.name, reason }
      });
    }

    console.log(`❌ Véhicule ${vehicle.name} rejeté: ${reason}`);

    return new Response(
      JSON.stringify({ success: true, vehicle }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ ERREUR COMPLETE rejet véhicule:', {
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erreur interne',
        code: error.code,
        details: error.details 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});