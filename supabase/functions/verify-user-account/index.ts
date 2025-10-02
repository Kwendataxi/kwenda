import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyUserAccountRequest {
  user_id: string;
  action: 'approve' | 'reject' | 'request_info';
  phone_verified: boolean;
  identity_verified: boolean;
  verification_level: 'basic' | 'verified' | 'premium';
  admin_notes?: string;
  rejection_reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Vérifier que l'appelant est un admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Non authentifié');
    }

    const { data: isAdmin, error: adminCheckError } = await supabaseClient
      .rpc('is_current_user_admin');

    if (adminCheckError || !isAdmin) {
      throw new Error('Accès refusé : privilèges admin requis');
    }

    const body: VerifyUserAccountRequest = await req.json();
    const { user_id, action, phone_verified, identity_verified, verification_level, admin_notes, rejection_reason } = body;

    console.log(`🔍 Admin ${user.id} processing ${action} for user ${user_id}`);

    let updateData: any = {
      updated_at: new Date().toISOString(),
      admin_notes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (action === 'approve') {
      updateData = {
        ...updateData,
        phone_verified: true,
        identity_verified: true,
        verification_level: 'verified',
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
      };
    } else if (action === 'reject') {
      updateData = {
        ...updateData,
        verification_status: 'rejected',
        rejection_reason,
        verification_level: 'basic',
      };
    } else if (action === 'request_info') {
      updateData = {
        ...updateData,
        verification_status: 'info_requested',
      };
    }

    // Mettre à jour le statut de vérification
    const { data: verificationData, error: updateError } = await supabaseClient
      .from('user_verification')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Verification update error:', updateError);
      throw updateError;
    }

    console.log('✅ Verification updated successfully:', verificationData);

    // Logger l'action dans activity_logs
    await supabaseClient.from('activity_logs').insert({
      user_id,
      activity_type: 'verification_status_change',
      description: action === 'approve' 
        ? 'Compte approuvé par l\'administrateur' 
        : action === 'reject'
        ? 'Compte rejeté par l\'administrateur'
        : 'Informations supplémentaires demandées',
      metadata: {
        action,
        admin_id: user.id,
        admin_notes,
        rejection_reason,
        old_status: 'pending_review',
        new_status: updateData.verification_status,
      }
    });

    // TODO: Envoyer une notification à l'utilisateur
    console.log(`📧 Notification à envoyer à l'utilisateur ${user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: action === 'approve' 
          ? 'Compte approuvé avec succès'
          : action === 'reject'
          ? 'Compte rejeté avec succès'
          : 'Demande d\'informations envoyée',
        verification: verificationData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Error in verify-user-account:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors du traitement de la vérification'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
