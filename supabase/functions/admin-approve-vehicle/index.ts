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

    // Vérifier rôle admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roles) {
      return new Response(JSON.stringify({ error: 'Accès refusé - Admin uniquement' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { vehicle_id, admin_notes } = await req.json();

    console.log('📥 Payload reçu:', JSON.stringify({ vehicle_id, admin_notes }));
    console.log('👤 Admin ID:', user.id);

    if (!vehicle_id) {
      console.error('❌ vehicle_id manquant dans le payload');
      return new Response(JSON.stringify({ error: 'vehicle_id requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Approbation véhicule ${vehicle_id} par admin ${user.id}`);

    // Utiliser service role pour bypass RLS
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Mettre à jour le véhicule
    console.log('🔄 Mise à jour rental_vehicles...');
    const { data: vehicle, error: updateError } = await supabaseAdmin
      .from('rental_vehicles')
      .update({
        moderation_status: 'approved',
        moderator_id: user.id,
        moderated_at: new Date().toISOString(),
        is_active: true,
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
    
    console.log('✅ Véhicule mis à jour:', vehicle.id, vehicle.name);

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
      activity_type: 'vehicle_approved',
      description: `Véhicule "${vehicle.name}" approuvé${admin_notes ? ': ' + admin_notes : ''}`,
      reference_id: vehicle_id,
      reference_type: 'rental_vehicle',
      metadata: { vehicle_name: vehicle.name, admin_notes }
    });

    // Notifier le partenaire
    if (partnerData?.user_id) {
      await supabaseAdmin.from('user_notifications').insert({
        user_id: partnerData.user_id,
        title: '✅ Véhicule approuvé',
        message: `Votre véhicule "${vehicle.name}" est maintenant visible par les clients`,
        type: 'success',
        is_read: false,
        metadata: { vehicle_id, vehicle_name: vehicle.name }
      });
    }

    console.log(`✅ Véhicule ${vehicle.name} approuvé avec succès`);

    return new Response(
      JSON.stringify({ success: true, vehicle }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ ERREUR COMPLETE approbation véhicule:', {
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