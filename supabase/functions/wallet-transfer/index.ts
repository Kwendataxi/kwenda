// ============================================================================
// 💸 EDGE FUNCTION: Transfert entre wallets
// ============================================================================
// Description: Exécute un transfert atomique entre deux wallets
// Sécurité: JWT requis (authentifié uniquement)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferRequest {
  recipientIdentifier: string; // Email ou téléphone
  amount: number;
  description?: string;
}

interface TransferResponse {
  success: boolean;
  transferId?: string;
  senderNewBalance?: number;
  recipientNewBalance?: number;
  recipientName?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💸 [1/7] Transfert wallet démarré');

    // Initialiser le client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('❌ [2/7] Erreur authentification:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [2/7] Utilisateur authentifié:', user.id);

    // Parser le body
    const body: TransferRequest = await req.json();
    const { recipientIdentifier, amount, description } = body;

    if (!recipientIdentifier || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paramètres invalides' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('💸 [3/7] Transfert initié:', { sender: user.id, recipient: recipientIdentifier, amount });

    // Trouver le destinataire
    const isEmail = recipientIdentifier.includes('@');
    let recipientUserId: string | null = null;

    if (isEmail) {
      // Recherche par email
      const { data: clientData } = await supabaseClient
        .from('clients')
        .select('user_id')
        .eq('email', recipientIdentifier.toLowerCase())
        .maybeSingle();

      if (clientData) {
        recipientUserId = clientData.user_id;
      } else {
        // Recherche dans partner_profiles
        const { data: partnerData } = await supabaseClient
          .from('partner_profiles')
          .select('user_id')
          .eq('company_email', recipientIdentifier.toLowerCase())
          .maybeSingle();

        if (partnerData) {
          recipientUserId = partnerData.user_id;
        } else {
          // Recherche dans auth.users via RPC
          const { data: authData } = await supabaseClient.rpc(
            'get_user_by_email',
            { p_email: recipientIdentifier.toLowerCase() }
          );

          if (authData && authData.length > 0) {
            recipientUserId = authData[0].id;
          }
        }
      }
    } else {
      // Recherche par téléphone
      const { data: clientData } = await supabaseClient
        .from('clients')
        .select('user_id')
        .eq('phone_number', recipientIdentifier)
        .maybeSingle();

      if (clientData) {
        recipientUserId = clientData.user_id;
      } else {
        // Recherche dans partner_profiles
        const { data: partnerData } = await supabaseClient
          .from('partner_profiles')
          .select('user_id')
          .eq('company_phone', recipientIdentifier)
          .maybeSingle();

        if (partnerData) {
          recipientUserId = partnerData.user_id;
        }
      }
    }

    if (!recipientUserId) {
      console.error('❌ [4/7] Destinataire introuvable');
      return new Response(
        JSON.stringify({ success: false, error: 'Destinataire introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [4/7] Destinataire trouvé:', recipientUserId);

    // Vérifier l'auto-transfert
    if (recipientUserId === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Impossible de transférer vers soi-même' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exécuter le transfert atomique avec la fonction RPC
    console.log('🔄 [5/7] Exécution du transfert atomique...');
    
    const { data: transferData, error: transferError } = await supabaseClient.rpc(
      'execute_wallet_transfer',
      {
        p_sender_id: user.id,
        p_recipient_id: recipientUserId,
        p_amount: amount,
        p_description: description || 'Transfert KwendaPay'
      }
    );

    if (transferError) {
      console.error('❌ [6/7] Erreur lors du transfert:', transferError);
      return new Response(
        JSON.stringify({
          success: false,
          error: transferError.message || 'Erreur lors du transfert'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [6/7] Transfert réussi:', transferData);

    // Envoyer une notification au destinataire
    try {
      await supabaseClient.from('notifications').insert({
        user_id: recipientUserId,
        title: 'Transfert reçu',
        message: `Vous avez reçu ${amount} CDF de ${transferData.sender_name}`,
        type: 'wallet_transfer',
        reference_id: transferData.transfer_id,
        reference_type: 'wallet_transfer'
      });
      console.log('✅ [7/7] Notification envoyée');
    } catch (notifError) {
      console.warn('⚠️ [7/7] Erreur envoi notification (non bloquante):', notifError);
    }

    const response: TransferResponse = {
      success: true,
      transferId: transferData.transfer_id,
      senderNewBalance: transferData.sender_new_balance,
      recipientNewBalance: transferData.recipient_new_balance,
      recipientName: transferData.recipient_name,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [ERROR] Erreur transfert wallet:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
