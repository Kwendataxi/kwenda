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

    console.log('🔍 Validation destinataire:', { input: recipient_input, sender: user.id });

    // Recherche dans la table clients par email ou téléphone
    const { data: clients, error: searchError } = await supabaseClient
      .from('clients')
      .select('user_id, display_name, phone_number, email, is_active')
      .eq('is_active', true);

    if (searchError) {
      console.error('❌ Erreur recherche:', searchError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Erreur lors de la recherche' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filtrer côté serveur pour gérer les NULL
    const client = clients?.find(c => 
      c.email?.toLowerCase() === recipient_input.toLowerCase() ||
      c.phone_number === recipient_input
    );

    console.log('🔎 Résultat recherche:', client ? `Trouvé: ${client.display_name}` : 'Non trouvé');

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
    if (client.user_id === user.id) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Vous ne pouvez pas transférer à vous-même' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que le destinataire a un portefeuille actif
    const { data: wallet, error: walletError } = await supabaseClient
      .from('user_wallets')
      .select('id, is_active')
      .eq('user_id', client.user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (walletError) {
      console.error('❌ Erreur wallet:', walletError);
    }

    console.log('💰 Wallet trouvé:', wallet ? 'Oui ✅' : 'Non ❌');

    if (!wallet) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Le destinataire n\'a pas de portefeuille actif' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Destinataire validé:', client.display_name);

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
