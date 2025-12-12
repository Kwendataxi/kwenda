import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration des types de cartes Kwenda Gratta
const CARD_TYPE_REWARDS = {
  standard: { maxXP: 50, boostChance: 0.1 },
  active: { maxXP: 200, boostChance: 0.3 },
  rare: { maxXP: 500, boostChance: 0.5 },
  mega: { maxXP: 1000, boostChance: 0.8 }
};

const REWARD_CATEGORIES = ['xp_points', 'boost_2x', 'boost_3x', 'badge', 'discount_5', 'discount_10', 'flash_discount', 'internal_credit'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, userId, sourceType, sourceId, count, multiplier, drawId, cardType } = await req.json();

    console.log(`🎰 Lottery system action: ${action}`);

    // ACTION: Attribuer une carte quotidienne Kwenda Gratta
    if (action === 'award_daily_card') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier si carte du jour déjà reçue
      const today = new Date().toISOString().split('T')[0];
      const { data: existingCard } = await supabase
        .from('lottery_wins')
        .select('id')
        .eq('user_id', userId)
        .eq('daily_card', true)
        .gte('created_at', `${today}T00:00:00`)
        .single();

      if (existingCard) {
        return new Response(
          JSON.stringify({ error: 'Carte du jour déjà récupérée', alreadyClaimed: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Déterminer le type de carte basé sur l'activité
      const selectedCardType = cardType || 'standard';
      const config = CARD_TYPE_REWARDS[selectedCardType] || CARD_TYPE_REWARDS.standard;

      // Générer la récompense
      const isBoost = Math.random() < config.boostChance;
      let rewardCategory = 'xp_points';
      let prizeValue = Math.floor(Math.random() * config.maxXP) + 10;
      let prizeName = `+${prizeValue} XP`;
      let boostDetails = {};

      if (isBoost) {
        const boostTypes = ['boost_2x', 'discount_5', 'internal_credit'];
        rewardCategory = boostTypes[Math.floor(Math.random() * boostTypes.length)];
        
        if (rewardCategory === 'boost_2x') {
          prizeName = 'Boost 2x Points';
          boostDetails = { multiplier: 2, expiresInHours: 24 };
        } else if (rewardCategory === 'discount_5') {
          prizeName = 'Remise 5%';
          prizeValue = 5;
          boostDetails = { discountPercent: 5 };
        } else {
          prizeName = '+50 Crédit';
          prizeValue = 50;
        }
      }

      // Créer la carte
      const { data: card, error } = await supabase
        .from('lottery_wins')
        .insert({
          user_id: userId,
          prize_details: { name: prizeName, value: prizeValue, currency: 'XP' },
          prize_value: prizeValue,
          currency: 'XP',
          status: 'pending',
          rarity: selectedCardType === 'mega' ? 'legendary' : selectedCardType === 'rare' ? 'epic' : 'common',
          reward_type: rewardCategory,
          scratch_percentage: 0,
          daily_card: true,
          card_type: selectedCardType,
          boost_details: boostDetails,
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

      console.log(`✅ Carte quotidienne ${selectedCardType} créée pour ${userId}`);

      return new Response(
        JSON.stringify({ success: true, card }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Vérifier et attribuer les badges
    if (action === 'check_badges') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Récupérer les stats de l'utilisateur
      const { data: stats } = await supabase
        .from('user_gratta_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!stats) {
        return new Response(
          JSON.stringify({ success: true, newBadges: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Badges existants
      const { data: existingBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      const earnedBadgeIds = new Set(existingBadges?.map(b => b.badge_id) || []);
      const newBadges: string[] = [];

      // Vérifier les badges
      const badgeChecks = [
        { id: 'premier_gratta', condition: stats.cards_scratched >= 1 },
        { id: 'gratteur_novice', condition: stats.cards_scratched >= 10 },
        { id: 'chasseur_de_chance', condition: stats.cards_scratched >= 50 },
        { id: 'kinois_champion', condition: stats.cards_scratched >= 100 },
        { id: 'gratteur_quotidien', condition: stats.consecutive_days >= 7 },
        { id: 'semaine_parfaite', condition: stats.consecutive_days >= 14 },
        { id: 'mois_de_feu', condition: stats.consecutive_days >= 30 },
        { id: 'chanceux_kolwezi', condition: stats.mega_cards >= 3 },
        { id: 'legende_lubumbashi', condition: stats.mega_cards >= 5 },
        { id: 'roi_du_grattage', condition: stats.mega_cards >= 10 },
        { id: 'mbongo_master', condition: stats.total_xp_earned >= 10000 },
      ];

      for (const check of badgeChecks) {
        if (check.condition && !earnedBadgeIds.has(check.id)) {
          const { error } = await supabase
            .from('user_badges')
            .insert({ user_id: userId, badge_id: check.id, source: 'gratta' });
          
          if (!error) {
            newBadges.push(check.id);
            console.log(`🏆 Badge ${check.id} attribué à ${userId}`);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, newBadges }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Mettre à jour les stats après grattage
    if (action === 'update_gratta_stats') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const today = new Date().toISOString().split('T')[0];
      const { xpEarned = 0, cardTypeScratched = 'standard' } = await req.json();

      // Upsert stats
      const { data: existingStats } = await supabase
        .from('user_gratta_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingStats) {
        const lastDate = existingStats.last_scratch_date;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const newStreak = lastDate === yesterday ? existingStats.consecutive_days + 1 : (lastDate === today ? existingStats.consecutive_days : 1);

        await supabase
          .from('user_gratta_stats')
          .update({
            cards_scratched: existingStats.cards_scratched + 1,
            [`${cardTypeScratched}_cards`]: (existingStats[`${cardTypeScratched}_cards`] || 0) + 1,
            total_xp_earned: existingStats.total_xp_earned + xpEarned,
            consecutive_days: newStreak,
            longest_streak: Math.max(existingStats.longest_streak, newStreak),
            last_scratch_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_gratta_stats')
          .insert({
            user_id: userId,
            cards_scratched: 1,
            [`${cardTypeScratched}_cards`]: 1,
            total_xp_earned: xpEarned,
            consecutive_days: 1,
            longest_streak: 1,
            last_scratch_date: today
          });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION: Attribuer des tickets (existant)
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

    // ACTION: Générer une carte à gratter
    if (action === 'generate_scratch_card') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const selectedType = cardType || 'standard';
      const config = CARD_TYPE_REWARDS[selectedType] || CARD_TYPE_REWARDS.standard;
      const prizeValue = Math.floor(Math.random() * config.maxXP) + 10;

      const { data: scratchCard, error } = await supabase
        .from('lottery_wins')
        .insert({
          user_id: userId,
          prize_details: { name: `+${prizeValue} XP`, value: prizeValue, currency: 'XP' },
          prize_value: prizeValue,
          currency: 'XP',
          status: 'pending',
          rarity: selectedType === 'mega' ? 'legendary' : selectedType === 'rare' ? 'epic' : 'common',
          reward_type: 'xp_points',
          scratch_percentage: 0,
          card_type: selectedType
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Carte ${selectedType} créée: ${prizeValue} XP`);

      return new Response(
        JSON.stringify({ success: true, scratchCard }),
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
