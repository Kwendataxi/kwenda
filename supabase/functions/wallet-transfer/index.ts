// ============================================================================
// 💸 EDGE FUNCTION: Transfert entre wallets - VERSION 2.0
// ============================================================================
// Description: Exécute un transfert atomique entre deux wallets
// Sécurité: JWT requis (authentifié uniquement)
// Build: 2025-11-08-v2
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

/**
 * Fonction helper pour rechercher un destinataire par email
 */
async function findRecipientByEmail(supabaseClient: any, email: string): Promise<string | null> {
  console.log('📧 Recherche par email:', email);
  
  // 1. Clients
  const { data: clientData } = await supabaseClient
    .from('clients')
    .select('user_id')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  
  if (clientData?.user_id) {
    console.log('✅ Trouvé dans clients');
    return clientData.user_id;
  }
  
  // 2. Partners
  const { data: partnerData } = await supabaseClient
    .from('partner_profiles')
    .select('user_id')
    .eq('company_email', email.toLowerCase())
    .maybeSingle();
  
  if (partnerData?.user_id) {
    console.log('✅ Trouvé dans partners');
    return partnerData.user_id;
  }
  
  // 3. Auth.users via RPC
  const { data: authData, error: rpcError } = await supabaseClient.rpc(
    'get_user_by_email',
    { p_email: email.toLowerCase() }
  );
  
  if (rpcError) {
    console.error('❌ Erreur RPC:', rpcError);
    return null;
  }
  
  if (authData && Array.isArray(authData) && authData.length > 0) {
    console.log('✅ Trouvé dans auth.users via RPC');
    return authData[0].id;
  }
  
  console.log('❌ Email introuvable');
  return null;
}

/**
 * Fonction helper pour rechercher un destinataire par téléphone
 */
async function findRecipientByPhone(supabaseClient: any, phone: string): Promise<string | null> {
  console.log('📞 Recherche par téléphone:', phone);
  
  // 1. Clients
  const { data: clientData } = await supabaseClient
    .from('clients')
    .select('user_id')
    .eq('phone_number', phone)
    .maybeSingle();
  
  if (clientData?.user_id) {
    console.log('✅ Trouvé dans clients');
    return clientData.user_id;
  }
  
  // 2. Partners
  const { data: partnerData } = await supabaseClient
    .from('partner_profiles')
    .select('user_id')
    .eq('company_phone', phone)
    .maybeSingle();
  
  if (partnerData?.user_id) {
    console.log('✅ Trouvé dans partners');
    return partnerData.user_id;
  }
  
  console.log('❌ Téléphone introuvable');
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('💸 ============ TRANSFERT WALLET START ============');

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
      console.error('❌ AUTH ERROR:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ USER AUTHENTICATED:', user.id);

    // Parser le body
    const body: TransferRequest = await req.json();
    const { recipientIdentifier, amount, description } = body;

    console.log('📋 TRANSFER REQUEST:', { 
      recipientIdentifier, 
      amount, 
      description,
      senderId: user.id 
    });

    if (!recipientIdentifier || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paramètres invalides' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trouver le destinataire
    const isEmail = recipientIdentifier.includes('@');
    const recipientUserId = isEmail 
      ? await findRecipientByEmail(supabaseClient, recipientIdentifier)
      : await findRecipientByPhone(supabaseClient, recipientIdentifier);

    if (!recipientUserId) {
      console.error('❌ RECIPIENT NOT FOUND');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Destinataire introuvable. Vérifiez le numéro ou l\'email.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ RECIPIENT FOUND:', recipientUserId);

    // Vérifier l'auto-transfert
    if (recipientUserId === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Impossible de transférer vers soi-même' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exécuter le transfert atomique avec la fonction RPC
    console.log('🔄 EXECUTING ATOMIC TRANSFER...');
    
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
      console.error('❌ TRANSFER ERROR:', transferError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erreur lors du transfert: ${transferError.message}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ TRANSFER SUCCESS:', transferData);

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
      console.log('✅ NOTIFICATION SENT');
    } catch (notifError) {
      console.warn('⚠️ NOTIFICATION ERROR (non-blocking):', notifError);
    }

    const response: TransferResponse = {
      success: true,
      transferId: transferData.transfer_id,
      senderNewBalance: transferData.sender_new_balance,
      recipientNewBalance: transferData.recipient_new_balance,
      recipientName: transferData.recipient_name,
    };

    console.log('💸 ============ TRANSFERT WALLET SUCCESS ============');

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ ============ TRANSFERT WALLET ERROR ============');
    console.error('ERROR DETAILS:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
