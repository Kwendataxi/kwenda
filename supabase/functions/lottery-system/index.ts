import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== PROBABILITÉS TRÈS DÉFAVORABLES ==========
// Le système est conçu pour être défavorable aux utilisateurs
// tout en gardant une motivation via les petits gains fréquents

const REWARD_PROBABILITIES = {
  nothing: 0.60,           // 60% - RIEN (perdu)
  xp_small: 0.25,          // 25% - 5-20 XP
  xp_medium: 0.10,         // 10% - 50-100 XP
  discount_5: 0.03,        // 3% - Remise 5%
  xp_large: 0.015,         // 1.5% - 200+ XP
  physical_gift: 0.005,    // 0.5% - Cadeau nature (admin)
} as const;

// Configuration des types de cartes
const CARD_TYPE_MULTIPLIERS = {
  standard: 1,
  active: 1.5,
  rare: 2,
  mega: 3
};

// Fonction pour déterminer la récompense basée sur les probabilités
const determineReward = (cardType: string = 'standard') => {
  const roll = Math.random();
  const multiplier = CARD_TYPE_MULTIPLIERS[cardType as keyof typeof CARD_TYPE_MULTIPLIERS] || 1;
  
  let cumulative = 0;
  
  // 60% - RIEN
  cumulative += REWARD_PROBABILITIES.nothing / multiplier;
  if (roll < cumulative) {
    return {
      rewardType: 'nothing',
      prizeName: 'Dommage !',
      prizeValue: 0,
      rarity: 'common' as const,
      boostDetails: {}
    };
  }
  
  // 25% - XP petit (5-20)
  cumulative += REWARD_PROBABILITIES.xp_small;
  if (roll < cumulative) {
    const value = Math.floor(Math.random() * 16) + 5; // 5-20
    return {
      rewardType: 'xp_points',
      prizeName: `+${value} XP`,
      prizeValue: value,
      rarity: 'common' as const,
      boostDetails: {}
    };
  }
  
  // 10% - XP moyen (50-100)
  cumulative += REWARD_PROBABILITIES.xp_medium;
  if (roll < cumulative) {
    const value = Math.floor(Math.random() * 51) + 50; // 50-100
    return {
      rewardType: 'xp_points',
      prizeName: `+${value} XP`,
      prizeValue: value,
      rarity: 'rare' as const,
      boostDetails: {}
    };
  }
  
  // 3% - Remise 5%
  cumulative += REWARD_PROBABILITIES.discount_5;
  if (roll < cumulative) {
    return {
      rewardType: 'discount_5',
      prizeName: 'Remise 5%',
      prizeValue: 5,
      rarity: 'rare' as const,
      boostDetails: { discountPercent: 5, validForDays: 7 }
    };
  }
  
  // 1.5% - XP gros (200-500)
  cumulative += REWARD_PROBABILITIES.xp_large;
  if (roll < cumulative) {
    const value = Math.floor(Math.random() * 301) + 200; // 200-500
    return {
      rewardType: 'xp_points',
      prizeName: `+${value} XP`,
      prizeValue: value,
      rarity: 'epic' as const,
      boostDetails: {}
    };
  }
  
  // 0.5% - Cadeau physique (défini par admin)
  return {
    rewardType: 'physical_gift',
    prizeName: 'Cadeau Surprise !',
    prizeValue: 0,
    rarity: 'legendary' as const,
    boostDetails: { requiresAdminApproval: true }
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { action, userId, sourceType, sourceId, count, multiplier, drawId, cardType, pointsCost } = body;

    console.log(`🎰 [lottery-system] Action: ${action}, User: ${userId}`);

    // =========== ACTION: Attribuer une carte quotidienne ===========
    if (action === 'award_daily_card') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier si carte du jour déjà reçue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: existingCard } = await supabase
        .from('lottery_wins')
        .select('id')
        .eq('user_id', userId)
        .eq('daily_card', true)
        .gte('created_at', todayISO)
        .maybeSingle();

      if (existingCard) {
        console.log(`⚠️ Carte quotidienne déjà réclamée pour ${userId}`);
        return new Response(
          JSON.stringify({ error: 'Carte du jour déjà récupérée', alreadyClaimed: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Déterminer la récompense avec les nouvelles probabilités défavorables
      const selectedCardType = cardType || 'standard';
      const reward = determineReward(selectedCardType);

      console.log(`🎲 Récompense générée: ${reward.rewardType} - ${reward.prizeName} (${reward.rarity})`);

      // Créer la carte
      const { data: card, error } = await supabase
        .from('lottery_wins')
        .insert({
          user_id: userId,
          prize_details: { name: reward.prizeName, value: reward.prizeValue, currency: 'XP' },
          prize_value: reward.prizeValue,
          currency: 'XP',
          status: 'pending',
          rarity: reward.rarity,
          reward_type: reward.rewardType,
          scratch_percentage: 0,
          daily_card: true,
          card_type: selectedCardType,
          boost_details: reward.boostDetails,
          expires_in_hours: 24
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création carte quotidienne:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Carte quotidienne créée: ${reward.prizeName} (${reward.rarity})`);

      return new Response(
        JSON.stringify({ success: true, card }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========== ACTION: Générer une carte à gratter (via progression) ===========
    if (action === 'generate_scratch_card') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const selectedType = cardType || 'standard';
      const reward = determineReward(selectedType);

      const { data: scratchCard, error } = await supabase
        .from('lottery_wins')
        .insert({
          user_id: userId,
          prize_details: { name: reward.prizeName, value: reward.prizeValue, currency: 'XP' },
          prize_value: reward.prizeValue,
          currency: 'XP',
          status: 'pending',
          rarity: reward.rarity,
          reward_type: reward.rewardType,
          scratch_percentage: 0,
          card_type: selectedType,
          boost_details: reward.boostDetails,
          daily_card: false
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Carte ${selectedType} créée: ${reward.prizeName}`);

      return new Response(
        JSON.stringify({ success: true, scratchCard }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========== ACTION: Créer ou récupérer le tirage mensuel ===========
    if (action === 'get_or_create_monthly_draw') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      const { data: existingDraw } = await supabase
        .from('super_lottery_draws')
        .select('*')
        .gte('draw_date', monthStart.toISOString())
        .lt('draw_date', nextMonth.toISOString())
        .maybeSingle();

      if (existingDraw) {
        const { count: entriesCount } = await supabase
          .from('super_lottery_entries')
          .select('*', { count: 'exact', head: true })
          .eq('draw_id', existingDraw.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            draw: { ...existingDraw, current_entries: entriesCount || 0 },
            isNew: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newDraw, error } = await supabase
        .from('super_lottery_draws')
        .insert({
          name: `Super Loterie ${monthName}`,
          description: `Grand tirage mensuel de ${monthName}. Participez avec vos Kwenda Points !`,
          draw_date: nextMonth.toISOString(),
          entry_cost_points: 100,
          max_entries: 1000,
          prize_pool: { first: 50000, second: 30000, third: 20000 },
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          draw: { ...newDraw, current_entries: 0 },
          isNew: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========== ACTION: Participer à la super loterie ===========
    if (action === 'enter_super_lottery') {
      if (!userId || !drawId || !pointsCost) {
        return new Response(
          JSON.stringify({ error: 'userId, drawId et pointsCost requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('kwenda_points')
        .eq('user_id', userId)
        .maybeSingle();

      const currentPoints = wallet?.kwenda_points || 0;
      if (currentPoints < pointsCost) {
        return new Response(
          JSON.stringify({ error: 'Points insuffisants', currentPoints, required: pointsCost }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const entryNumber = `SL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { data: entry, error: entryError } = await supabase
        .from('super_lottery_entries')
        .insert({
          draw_id: drawId,
          user_id: userId,
          points_spent: pointsCost,
          entry_number: entryNumber
        })
        .select()
        .single();

      if (entryError) {
        return new Response(
          JSON.stringify({ error: entryError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ kwenda_points: currentPoints - pointsCost })
        .eq('user_id', userId);

      if (updateError) {
        await supabase.from('super_lottery_entries').delete().eq('id', entry.id);
        return new Response(
          JSON.stringify({ error: 'Erreur déduction points' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, entry, entryNumber }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========== ACTION: Attribuer des tickets ===========
    if (action === 'award_ticket') {
      if (!userId || !sourceType) {
        return new Response(
          JSON.stringify({ error: 'userId et sourceType requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const ticketCount = (count || 1) * (multiplier || 1);
      const tickets = [];

      for (let i = 0; i < ticketCount; i++) {
        const ticketNumber = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const { data: ticket, error } = await supabase
          .from('lottery_tickets')
          .insert({
            user_id: userId,
            ticket_number: ticketNumber,
            source_type: sourceType,
            source_id: sourceId || null,
            earned_date: new Date().toISOString(),
            status: 'active'
          })
          .select()
          .single();

        if (!error && ticket) tickets.push(ticket);
      }

      console.log(`✅ ${tickets.length} ticket(s) attribué(s) à ${userId}`);

      return new Response(
        JSON.stringify({ success: true, tickets }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========== ACTION: Stats admin ===========
    if (action === 'admin_stats') {
      const { data: allWins } = await supabase.from('lottery_wins').select('*');
      const { data: allDraws } = await supabase.from('super_lottery_draws').select('*');
      const { data: allEntries } = await supabase.from('super_lottery_entries').select('*');

      const today = new Date().toISOString().split('T')[0];
      
      // Calculer les stats par type de récompense
      const rewardStats = {
        nothing: allWins?.filter(w => w.reward_type === 'nothing').length || 0,
        xp_points: allWins?.filter(w => w.reward_type === 'xp_points').length || 0,
        discount_5: allWins?.filter(w => w.reward_type === 'discount_5').length || 0,
        physical_gift: allWins?.filter(w => w.reward_type === 'physical_gift').length || 0,
      };

      const stats = {
        gratta: {
          total_cards: allWins?.length || 0,
          unscratched: allWins?.filter(w => !w.scratch_revealed_at).length || 0,
          revealed: allWins?.filter(w => w.scratch_revealed_at).length || 0,
          today_generated: allWins?.filter(w => w.created_at?.startsWith(today)).length || 0,
          today_scratched: allWins?.filter(w => w.scratch_revealed_at?.startsWith(today)).length || 0,
          total_xp_distributed: allWins?.reduce((sum, w) => sum + (w.prize_value || 0), 0) || 0,
          reward_distribution: rewardStats,
          win_rate: allWins ? ((allWins.filter(w => w.reward_type !== 'nothing').length / allWins.length) * 100).toFixed(1) + '%' : '0%'
        },
        superLottery: {
          total_draws: allDraws?.length || 0,
          active_draws: allDraws?.filter(d => d.status === 'active').length || 0,
          total_entries: allEntries?.length || 0,
          total_points_spent: allEntries?.reduce((sum, e) => sum + (e.points_spent || 0), 0) || 0
        }
      };

      return new Response(
        JSON.stringify({ success: true, stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Action inconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Lottery system error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
