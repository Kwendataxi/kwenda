import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      business_name,
      business_type,
      id_document_url,
      proof_of_address_url,
      business_documents,
      company_registration_number,
      tax_identification_number,
      bank_account_name,
      bank_account_number,
      bank_name,
      mobile_money_provider,
      mobile_money_number
    } = await req.json();

    console.log('📝 Vendor verification request received from user:', user.id);

    // Vérifier si une demande existe déjà
    const { data: existingRequest } = await supabase
      .from('seller_verification_requests')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingRequest && existingRequest.verification_status === 'pending') {
      return new Response(
        JSON.stringify({ 
          error: 'Une demande de vérification est déjà en cours',
          request: existingRequest 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer la demande de vérification
    const { data: verificationRequest, error: requestError } = await supabase
      .from('seller_verification_requests')
      .insert({
        user_id: user.id,
        business_name,
        business_type,
        id_document_url,
        proof_of_address_url,
        business_documents: business_documents || [],
        verification_status: 'pending'
      })
      .select()
      .single();

    if (requestError) {
      console.error('❌ Error creating verification request:', requestError);
      return new Response(
        JSON.stringify({ error: requestError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer les informations business si fournies
    if (company_registration_number || bank_account_number || mobile_money_number) {
      const { error: businessInfoError } = await supabase
        .from('vendor_business_info')
        .upsert({
          user_id: user.id,
          company_registration_number,
          tax_identification_number,
          bank_account_name,
          bank_account_number,
          bank_name,
          mobile_money_provider,
          mobile_money_number
        });

      if (businessInfoError) {
        console.error('⚠️ Error saving business info:', businessInfoError);
      }
    }

    // Créer notification pour l'utilisateur
    await supabase
      .from('user_notifications')
      .insert({
        user_id: user.id,
        title: 'Demande de vérification soumise',
        content: 'Votre demande de vérification vendeur a été soumise avec succès. Nous examinerons votre dossier sous 24-48h.',
        priority: 'normal',
        action_url: '/marketplace/vendor-verification',
        action_label: 'Voir ma demande'
      });

    // Notification admin
    const { data: admins } = await supabase
      .from('admins')
      .select('user_id')
      .eq('is_active', true);

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.user_id,
        title: 'Nouvelle demande de vérification vendeur',
        content: `${business_name || 'Un nouveau vendeur'} a soumis une demande de vérification`,
        priority: 'high',
        action_url: `/admin/vendor-verifications/${verificationRequest.id}`,
        action_label: 'Examiner la demande'
      }));

      await supabase
        .from('user_notifications')
        .insert(adminNotifications);
    }

    console.log('✅ Vendor verification request created:', verificationRequest.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        verification_request: verificationRequest
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in vendor-verify-request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
