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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
  
  try {
    // 1️⃣ Clients d'abord
    const { data: clientData } = await supabaseClient
      .from('clients')
      .select('user_id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    
    if (clientData?.user_id) {
      console.log('✅ Client trouvé');
      return clientData.user_id;
    }
    
    // 2️⃣ Recherche DIRECTE dans auth.users (sans company_email)
    const { data: authData, error: rpcError } = await supabaseClient.rpc(
      'get_user_by_email',
      { p_email: email.toLowerCase() }
    );
    
    if (rpcError) {
      console.error('❌ Erreur RPC get_user_by_email:', rpcError);
      return null;
    }
    
    if (authData && Array.isArray(authData) && authData.length > 0) {
      console.log('✅ Utilisateur trouvé dans auth.users via RPC');
      return authData[0].id;
    }
    
    console.log('❌ Email introuvable');
    return null;
  } catch (err) {
    console.error('❌ Erreur recherche email:', err);
    return null;
  }
}

/**
 * Fonction helper pour rechercher un destinataire par téléphone
 */
async function findRecipientByPhone(supabaseClient: any, phone: string): Promise<string | null> {
  console.log('📞 Recherche par téléphone:', phone);
  
  try {
    // 1️⃣ Clients
    const { data: clientData } = await supabaseClient
      .from('clients')
      .select('user_id')
      .eq('phone_number', phone)
      .maybeSingle();
    
    if (clientData?.user_id) {
      console.log('✅ Client trouvé');
      return clientData.user_id;
    }
    
    // 2️⃣ Partners (par company_phone uniquement)
    const { data: partnerData } = await supabaseClient
      .from('partner_profiles')
      .select('user_id')
      .eq('company_phone', phone)
      .maybeSingle();
    
    if (partnerData?.user_id) {
      console.log('✅ Partner trouvé');
      return partnerData.user_id;
    }
    
    console.log('❌ Téléphone introuvable');
    return null;
  } catch (err) {
    console.error('❌ Erreur recherche téléphone:', err);
    return null;
  }
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

    // ✅ Limites de sécurité
    const MIN_AMOUNT = 100; // 100 CDF minimum
    const MAX_AMOUNT = 500000; // 500,000 CDF maximum par transfert
    const MAX_DAILY_AMOUNT = 2000000; // 2M CDF par jour

    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      console.error('❌ AMOUNT OUT OF RANGE:', amount);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Montant invalide. Min: ${MIN_AMOUNT.toLocaleString()} CDF, Max: ${MAX_AMOUNT.toLocaleString()} CDF` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier les transferts du jour (limite journalière)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayTransfers } = await supabaseClient
      .from('wallet_transfers')
      .select('amount')
      .eq('sender_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`);

    const totalToday = (todayTransfers || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    if (totalToday + amount > MAX_DAILY_AMOUNT) {
      console.error('❌ DAILY LIMIT EXCEEDED:', { totalToday, amount, limit: MAX_DAILY_AMOUNT });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Limite journalière atteinte (${MAX_DAILY_AMOUNT.toLocaleString()} CDF). Vous avez déjà transféré ${totalToday.toLocaleString()} CDF aujourd'hui. Réessayez demain.` 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ AMOUNT VALID:', { amount, totalToday, remaining: MAX_DAILY_AMOUNT - totalToday - amount });

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

    // Logger dans activity_logs pour analytics
    try {
      await supabaseClient.from('activity_logs').insert([
        {
          user_id: user.id,
          activity_type: 'wallet_transfer_sent',
          description: `Transfert envoyé vers ${transferData.recipient_name || recipientUserId}`,
          amount: -amount,
          currency: 'CDF',
          reference_type: 'wallet_transfer',
          reference_id: transferData.transfer_id
        },
        {
          user_id: recipientUserId,
          activity_type: 'wallet_transfer_received',
          description: `Transfert reçu de ${transferData.sender_name || user.id}`,
          amount: amount,
          currency: 'CDF',
          reference_type: 'wallet_transfer',
          reference_id: transferData.transfer_id
        }
      ]);
      console.log('✅ ACTIVITY LOGS CREATED');
    } catch (logError) {
      console.warn('⚠️ ACTIVITY LOG ERROR (non-blocking):', logError);
    }

    // Envoyer une notification au destinataire
    try {
      await supabaseClient.from('notifications').insert({
        user_id: recipientUserId,
        title: 'Transfert reçu',
        message: `Vous avez reçu ${amount.toLocaleString()} CDF de ${transferData.sender_name}`,
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
