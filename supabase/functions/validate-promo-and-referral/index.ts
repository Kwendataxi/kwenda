import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, data } = await req.json();

    // ========================================
    // ACTION 1: Enregistrer usage code promo
    // ========================================
    if (action === 'record_promo_usage') {
      console.log('📋 Recording promo usage for user:', user.id);
      
      // Vérifier que l'utilisateur n'a pas déjà utilisé ce code
      const { data: existingUsage } = await supabaseClient
        .from('promo_code_usage')
        .select('id')
        .eq('promo_code_id', data.promoId)
        .eq('user_id', user.id);

      if (existingUsage && existingUsage.length > 0) {
        console.log('❌ Code déjà utilisé par cet utilisateur');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Code déjà utilisé par cet utilisateur' 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Enregistrer l'usage
      const { error: insertError } = await supabaseClient
        .from('promo_code_usage')
        .insert({
          promo_code_id: data.promoId,
          user_id: user.id,
          order_id: data.orderId,
          order_type: data.orderType,
          discount_amount: data.discountAmount,
          currency: 'CDF',
          used_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Erreur insertion usage:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Incrémenter le compteur d'usage du code promo
      const { data: currentCode } = await supabaseClient
        .from('promo_codes')
        .select('usage_count')
        .eq('id', data.promoId)
        .single();

      await supabaseClient
        .from('promo_codes')
        .update({ usage_count: (currentCode?.usage_count || 0) + 1 })
        .eq('id', data.promoId);

      console.log('✅ Usage promo enregistré avec succès');
      
      return new Response(
        JSON.stringify({ success: true, message: 'Promo usage recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // ACTION 2: Créditer récompenses parrainage
    // ========================================
    if (action === 'credit_referral') {
      console.log('💰 Crediting referral rewards');
      
      const { referrerId, refereeId, referralId } = data;

      // 1. Créditer le parrain (5000 CDF)
      const { data: referrerWallet } = await supabaseClient
        .from('user_wallets')
        .select('id, balance')
        .eq('user_id', referrerId)
        .single();

      if (referrerWallet) {
        const newReferrerBalance = Number(referrerWallet.balance) + 5000;
        
        await supabaseClient
          .from('user_wallets')
          .update({ 
            balance: newReferrerBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', referrerId);

        await supabaseClient.from('activity_logs').insert({
          user_id: referrerId,
          activity_type: 'referral_reward',
          description: 'Bonus de parrainage - Nouveau filleul inscrit',
          amount: 5000,
          currency: 'CDF',
          reference_type: 'referral',
          reference_id: referralId
        });
      }

      // 2. Créditer le filleul (3000 CDF)
      const { data: refereeWallet } = await supabaseClient
        .from('user_wallets')
        .select('id, balance')
        .eq('user_id', refereeId)
        .single();

      if (refereeWallet) {
        const newRefereeBalance = Number(refereeWallet.balance) + 3000;
        
        await supabaseClient
          .from('user_wallets')
          .update({ 
            balance: newRefereeBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', refereeId);

        await supabaseClient.from('activity_logs').insert({
          user_id: refereeId,
          activity_type: 'referral_bonus',
          description: 'Bonus de bienvenue - Code de parrainage utilisé',
          amount: 3000,
          currency: 'CDF',
          reference_type: 'referral',
          reference_id: referralId
        });
      }

      console.log('✅ Récompenses parrainage créditées');
      
      return new Response(
        JSON.stringify({ success: true, message: 'Referral rewards credited' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('❌ Error in validate-promo-and-referral:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
