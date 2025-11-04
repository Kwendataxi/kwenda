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

    // Authentification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    // Créer un client admin pour contourner les RLS lors de la recherche (sécurisé car on ne retourne que des infos publiques)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { recipient_input } = await req.json();

    if (!recipient_input || recipient_input.trim().length === 0) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Veuillez entrer un numéro ou email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting : max 20 validations/minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentValidations } = await supabaseClient
      .from('wallet_transfers')
      .select('id')
      .eq('sender_id', user.id)
      .gte('created_at', oneMinuteAgo);

    if (recentValidations && recentValidations.length >= 20) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Trop de tentatives. Attendez une minute.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 [1/6] Validation démarrée:', { input: recipient_input, sender: user.id });

    let client = null;

    // ÉTAPE 1 : Recherche par email dans clients (via admin pour bypass RLS)
    console.log('🔍 [2/6] Recherche par email dans clients...');
    const { data: clientByEmail, error: emailError } = await supabaseAdmin
      .from('clients')
      .select('user_id, display_name, phone_number, email, is_active')
      .eq('email', recipient_input.toLowerCase().trim())
      .eq('is_active', true)
      .maybeSingle();

    console.log('🔎 [2/6] DEBUG - Résultat recherche email:', { 
      found: !!clientByEmail, 
      hasError: !!emailError,
      errorCode: emailError?.code,
      errorMessage: emailError?.message 
    });

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('❌ Erreur recherche email:', emailError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Erreur lors de la recherche' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (clientByEmail) {
      console.log('✅ [2/6] Client trouvé par email:', clientByEmail.display_name);
      client = clientByEmail;
    } else {
      // ÉTAPE 2 : Recherche par téléphone dans clients (via admin pour bypass RLS)
      console.log('🔍 [3/6] Pas trouvé par email, recherche par téléphone...');
      const { data: clientByPhone, error: phoneError } = await supabaseAdmin
        .from('clients')
        .select('user_id, display_name, phone_number, email, is_active')
        .eq('phone_number', recipient_input.trim())
        .eq('is_active', true)
        .maybeSingle();

      console.log('🔎 [3/6] DEBUG - Résultat recherche téléphone:', { 
        found: !!clientByPhone,
        hasError: !!phoneError,
        errorCode: phoneError?.code 
      });

      if (phoneError && phoneError.code !== 'PGRST116') {
        console.error('❌ Erreur recherche téléphone:', phoneError);
        return new Response(
          JSON.stringify({ valid: false, error: 'Erreur lors de la recherche' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (clientByPhone) {
        console.log('✅ [3/6] Client trouvé par téléphone:', clientByPhone.display_name);
        client = clientByPhone;
      } else {
        console.log('⚠️ [3/6] Pas trouvé dans clients, recherche backup dans auth.users...');
      }
    }

    console.log('🔎 [4/6] Résultat recherche clients:', client ? `Trouvé: ${client.display_name}` : 'Non trouvé');

    // ÉTAPE 3 : Recherche backup dans auth.users si pas trouvé dans clients
    if (!client) {
      console.log('🔍 [4.5/6] Recherche backup dans auth.users par email...');

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!authError && authUser?.users) {
        const foundUser = authUser.users.find(u => 
          u.email?.toLowerCase() === recipient_input.toLowerCase().trim()
        );
        
        if (foundUser) {
          console.log('✅ [4.5/6] Utilisateur trouvé dans auth.users:', foundUser.email);
          // Créer un objet client à partir des données auth
          client = {
            user_id: foundUser.id,
            display_name: foundUser.user_metadata?.display_name || foundUser.email?.split('@')[0] || 'Utilisateur',
            phone_number: foundUser.phone || null,
            email: foundUser.email,
            is_active: true
          };
        } else {
          console.log('⚠️ [4.5/6] Utilisateur pas trouvé dans auth.users non plus');
        }
      }
    }

    if (!client) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Aucun utilisateur trouvé avec ce numéro ou email' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que ce n'est pas l'utilisateur lui-même
    console.log('🔍 [5/6] Vérification auto-transfert...');
    if (client.user_id === user.id) {
      console.log('❌ [5/6] Auto-transfert détecté');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Vous ne pouvez pas transférer à vous-même' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ [5/6] Pas un auto-transfert');

    // Vérifier que le destinataire a un portefeuille actif (via admin pour bypass RLS)
    console.log('🔍 [6/6] Vérification wallet du destinataire...');
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('user_wallets')
      .select('id, is_active')
      .eq('user_id', client.user_id)
      .eq('is_active', true)
      .maybeSingle();

    console.log('🔎 [6/6] DEBUG - Résultat recherche wallet:', { 
      found: !!wallet,
      hasError: !!walletError,
      errorCode: walletError?.code,
      userId: client.user_id 
    });

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('❌ [6/6] Erreur wallet:', walletError);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Erreur lors de la vérification du portefeuille' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wallet) {
      console.log('❌ [6/6] Wallet non trouvé ou inactif');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Le destinataire n\'a pas de portefeuille actif' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [6/6] Wallet actif trouvé');
    console.log('🎉 Validation complète réussie:', client.display_name);

    return new Response(
      JSON.stringify({
        valid: true,
        user_id: client.user_id,
        display_name: client.display_name,
        phone_number: client.phone_number
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erreur validation:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error.message || 'Erreur de validation' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
