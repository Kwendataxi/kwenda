// ============================================================================
// 🔍 EDGE FUNCTION: Validation de destinataire pour transferts
// ============================================================================
// Description: Valide qu'un destinataire existe (email ou téléphone)
// Sécurité: JWT requis (authentifié uniquement)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRecipientRequest {
  identifier: string; // Email ou numéro de téléphone
}

interface ValidateRecipientResponse {
  success: boolean;
  valid: boolean;
  recipientId?: string;
  recipientName?: string;
  recipientEmail?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [1/6] Validation destinataire démarrée');

    // Initialiser le client Supabase
    const authHeader = req.headers.get('Authorization');
    
    console.log('🔑 [1.5/6] Authorization header:', authHeader ? 'Présent' : 'Absent');
    
    if (!authHeader) {
      console.error('❌ [2/6] Pas de header Authorization');
      return new Response(
        JSON.stringify({ success: false, valid: false, error: 'Non authentifié - Header manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire le JWT token du header "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Vérifier l'authentification avec le token extrait
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('❌ [2/6] Erreur authentification:', authError);
      return new Response(
        JSON.stringify({ success: false, valid: false, error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [2/6] Utilisateur authentifié:', user.id);

    // Parser le body
    const body: ValidateRecipientRequest = await req.json();
    const { identifier } = body;

    if (!identifier || identifier.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, valid: false, error: 'Identifiant requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔎 [3/6] Recherche destinataire:', identifier);

    // Déterminer si c'est un email ou un téléphone
    const isEmail = identifier.includes('@');
    let recipientUserId: string | null = null;
    let recipientName: string | null = null;
    let recipientEmail: string | null = null;

    if (isEmail) {
      // Recherche par email dans clients
      const { data: clientData, error: clientError } = await supabaseClient
        .from('clients')
        .select('user_id, display_name, email')
        .eq('email', identifier.toLowerCase())
        .maybeSingle();

      console.log('🔎 [4/6] Résultat recherche clients:', clientData ? 'Trouvé' : 'Non trouvé');

      if (clientData) {
        recipientUserId = clientData.user_id;
        recipientName = clientData.display_name;
        recipientEmail = clientData.email;
      } else {
        // Recherche dans partner_profiles
        const { data: partnerData, error: partnerError } = await supabaseClient
          .from('partner_profiles')
          .select('user_id, company_name, company_email')
          .eq('company_email', identifier.toLowerCase())
          .maybeSingle();

        console.log('🔎 [4.1/6] Résultat recherche partners:', partnerData ? 'Trouvé' : 'Non trouvé');

        if (partnerData) {
          recipientUserId = partnerData.user_id;
          recipientName = partnerData.company_name;
          recipientEmail = partnerData.company_email;
        } else {
          // Recherche dans auth.users via RPC
          const { data: authData, error: authSearchError } = await supabaseClient.rpc(
            'get_user_by_email',
            { p_email: identifier.toLowerCase() }
          );

          console.log('🔎 [4.2/6] Résultat recherche auth.users:', authData ? 'Trouvé' : 'Non trouvé');

          if (authData && authData.length > 0) {
            recipientUserId = authData[0].id;
            recipientEmail = authData[0].email;
            
            // Utiliser get_user_display_name pour récupérer le nom
            const { data: nameData } = await supabaseClient.rpc(
              'get_user_display_name',
              { p_user_id: recipientUserId }
            );
            
            recipientName = nameData || authData[0].email?.split('@')[0];
          }
        }
      }
    } else {
      // Recherche par numéro de téléphone
      const { data: clientData, error: clientError } = await supabaseClient
        .from('clients')
        .select('user_id, display_name, email, phone_number')
        .eq('phone_number', identifier)
        .maybeSingle();

      console.log('🔎 [4/6] Résultat recherche par téléphone:', clientData ? 'Trouvé' : 'Non trouvé');

      if (clientData) {
        recipientUserId = clientData.user_id;
        recipientName = clientData.display_name;
        recipientEmail = clientData.email;
      } else {
        // Recherche dans partner_profiles
        const { data: partnerData } = await supabaseClient
          .from('partner_profiles')
          .select('user_id, company_name, company_email, company_phone')
          .eq('company_phone', identifier)
          .maybeSingle();

        if (partnerData) {
          recipientUserId = partnerData.user_id;
          recipientName = partnerData.company_name;
          recipientEmail = partnerData.company_email;
        }
      }
    }

    // Vérifier si un destinataire a été trouvé
    if (!recipientUserId) {
      console.log('❌ [5/6] Destinataire introuvable');
      return new Response(
        JSON.stringify({
          success: true,
          valid: false,
          error: 'Destinataire introuvable'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que l'utilisateur ne transfère pas vers lui-même
    if (recipientUserId === user.id) {
      console.log('❌ [5/6] Auto-transfert détecté');
      return new Response(
        JSON.stringify({
          success: true,
          valid: false,
          error: 'Impossible de transférer vers soi-même'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que le destinataire a un wallet
    const { data: walletData, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('id')
      .eq('user_id', recipientUserId)
      .maybeSingle();

    if (!walletData) {
      console.log('❌ [5/6] Wallet destinataire introuvable');
      return new Response(
        JSON.stringify({
          success: true,
          valid: false,
          error: 'Le destinataire n\'a pas de wallet actif'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [6/6] Destinataire validé avec succès');

    const response: ValidateRecipientResponse = {
      success: true,
      valid: true,
      recipientId: recipientUserId,
      recipientName: recipientName || undefined,
      recipientEmail: recipientEmail || undefined,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [ERROR] Erreur validation destinataire:', error);
    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
