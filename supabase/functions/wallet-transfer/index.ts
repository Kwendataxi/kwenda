import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
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

    // 1. Authentification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Non autorisé - Authentification requise');
    }

    const { recipient_phone_or_id, amount, description } = await req.json();

    console.log('💸 Transfert initié:', {
      sender: user.id,
      recipient: recipient_phone_or_id,
      amount,
      timestamp: new Date().toISOString()
    });

    // 2. Validations montant
    if (!amount || isNaN(amount)) {
      throw new Error('Montant invalide');
    }

    if (amount < 100) {
      throw new Error('Montant minimum : 100 CDF');
    }

    if (amount > 500000) {
      throw new Error('Montant maximum : 500,000 CDF par transfert');
    }

    // 3. Rate limiting (max 10 transferts/heure)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentTransfers, error: rateError } = await supabaseClient
      .from('wallet_transfers')
      .select('id')
      .eq('sender_id', user.id)
      .gte('created_at', oneHourAgo);

    if (rateError) {
      console.error('❌ Erreur rate limiting:', rateError);
    }

    if (recentTransfers && recentTransfers.length >= 10) {
      throw new Error('Limite de 10 transferts/heure atteinte. Réessayez plus tard.');
    }

    // 4. Identifier le destinataire (approche simplifiée)
    let recipientId: string;
    
    // Si c'est un UUID direct
    if (recipient_phone_or_id.length === 36 && recipient_phone_or_id.includes('-')) {
      recipientId = recipient_phone_or_id;
    } else {
      // Recherche par numéro de téléphone ou email dans clients
      const { data: client, error: searchError } = await supabaseClient
        .from('clients')
        .select('user_id, display_name, phone_number')
        .or(`phone_number.eq.${recipient_phone_or_id},email.eq.${recipient_phone_or_id}`)
        .maybeSingle();
      
      if (client && !searchError) {
        recipientId = client.user_id;
        console.log('✅ Destinataire trouvé dans clients:', client.display_name);
      } else {
        // Backup: utiliser directement auth.admin pour chercher par email
        console.log('🔍 Backup: recherche directe dans auth.users...');
        
        // Utiliser le service role key pour accéder à auth.users
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        // Chercher l'utilisateur par email directement
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (usersError || !users) {
          console.error('❌ Erreur listUsers:', usersError);
          throw new Error('Erreur lors de la recherche du destinataire');
        }
        
        // Trouver l'utilisateur par email
        const matchingUser = users.find(u => u.email === recipient_phone_or_id);
        
        if (!matchingUser) {
          throw new Error('Destinataire introuvable. Vérifiez le numéro ou l\'email.');
        }
        
        // Vérifier que cet utilisateur a un wallet
        const { data: wallet, error: walletCheckError } = await supabaseClient
          .from('user_wallets')
          .select('user_id')
          .eq('user_id', matchingUser.id)
          .maybeSingle();
        
        if (walletCheckError || !wallet) {
          console.error('❌ Pas de wallet pour cet utilisateur:', walletCheckError);
          throw new Error('Le destinataire n\'a pas de wallet actif');
        }
        
        console.log('✅ Destinataire trouvé:', matchingUser.email);
        recipientId = matchingUser.id;
      }
    }

    // 5. Vérifier auto-transfert
    if (recipientId === user.id) {
      throw new Error('Impossible de transférer de l\'argent à soi-même');
    }

    // 6. Récupérer info destinataire pour notification
    const { data: recipientClient } = await supabaseClient
      .from('clients')
      .select('display_name, phone_number')
      .eq('user_id', recipientId)
      .maybeSingle();

    // 7. Transaction atomique via RPC
    console.log('🔄 Exécution du transfert atomique...');
    const { data: result, error: rpcError } = await supabaseClient
      .rpc('execute_wallet_transfer', {
        p_sender_id: user.id,
        p_recipient_id: recipientId,
        p_amount: amount,
        p_description: description || 'Transfert KwendaPay'
      });

    if (rpcError) {
      console.error('❌ Erreur RPC:', rpcError);
      throw new Error(rpcError.message || 'Échec du transfert');
    }

    console.log('✅ Transfert réussi:', result);

    // 8. Envoyer notification au destinataire
    try {
      await supabaseClient.from('notifications').insert({
        user_id: recipientId,
        type: 'transfer_received',
        title: '💰 Transfert reçu',
        message: `Vous avez reçu ${amount.toLocaleString()} CDF`,
        data: {
          transfer_id: result.transfer_id,
          amount,
          sender_id: user.id
        }
      });
    } catch (notifError) {
      console.error('⚠️ Erreur notification:', notifError);
      // Ne pas bloquer le transfert si la notification échoue
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transfer_id: result.transfer_id,
        new_balance: result.sender_new_balance,
        recipient_name: recipientClient?.display_name || 'Utilisateur'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erreur transfert:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erreur lors du transfert'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
