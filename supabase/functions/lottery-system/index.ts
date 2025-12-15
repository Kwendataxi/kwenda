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

      // Vérifier si carte du jour déjà reçue (minuit local - on utilise UTC pour simplifier)
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

      // Déterminer le type de carte
      const selectedCardType = cardType || 'standard';
      const config = CARD_TYPE_REWARDS[selectedCardType as keyof typeof CARD_TYPE_REWARDS] || CARD_TYPE_REWARDS.standard;

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

      console.log(`✅ Carte quotidienne ${selectedCardType} créée pour ${userId}: ${prizeName}`);

      return new Response(
        JSON.stringify({ success: true, card }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========== ACTION: Créer ou récupérer le tirage mensuel ===========
    if (action === 'get_or_create_monthly_draw') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      // Chercher un tirage existant pour ce mois
      const { data: existingDraw } = await supabase
        .from('super_lottery_draws')
        .select('*')
        .gte('draw_date', monthStart.toISOString())
        .lt('draw_date', nextMonth.toISOString())
        .maybeSingle();

      if (existingDraw) {
        // Compter les entrées
        const { count: entriesCount } = await supabase
          .from('super_lottery_entries')
          .select('*', { count: 'exact', head: true })
          .eq('draw_id', existingDraw.id);

        console.log(`📊 Tirage existant trouvé: ${existingDraw.id}, ${entriesCount} entrées`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            draw: { ...existingDraw, current_entries: entriesCount || 0 },
            isNew: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Créer un nouveau tirage
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
        console.error('❌ Erreur création tirage:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Nouveau tirage créé: ${newDraw.id}`);

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

      // Vérifier les points de l'utilisateur
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

      // Générer numéro d'entrée
      const entryNumber = `SL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Créer l'entrée
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
        console.error('❌ Erreur création entrée:', entryError);
        return new Response(
          JSON.stringify({ error: entryError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Déduire les points
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ kwenda_points: currentPoints - pointsCost })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Erreur déduction points:', updateError);
        // Rollback entry
        await supabase.from('super_lottery_entries').delete().eq('id', entry.id);
        return new Response(
          JSON.stringify({ error: 'Erreur déduction points' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Entrée super loterie créée: ${entryNumber} pour ${userId}`);

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

    // =========== ACTION: Générer une carte à gratter ===========
    if (action === 'generate_scratch_card') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const selectedType = cardType || 'standard';
      const config = CARD_TYPE_REWARDS[selectedType as keyof typeof CARD_TYPE_REWARDS] || CARD_TYPE_REWARDS.standard;
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

    // =========== ACTION: Stats admin ===========
    if (action === 'admin_stats') {
      const { data: allWins } = await supabase.from('lottery_wins').select('*');
      const { data: allDraws } = await supabase.from('super_lottery_draws').select('*');
      const { data: allEntries } = await supabase.from('super_lottery_entries').select('*');

      const today = new Date().toISOString().split('T')[0];
      
      const stats = {
        gratta: {
          total_cards: allWins?.length || 0,
          unscratched: allWins?.filter(w => !w.scratch_revealed_at).length || 0,
          revealed: allWins?.filter(w => w.scratch_revealed_at).length || 0,
          today_generated: allWins?.filter(w => w.created_at?.startsWith(today)).length || 0,
          today_scratched: allWins?.filter(w => w.scratch_revealed_at?.startsWith(today)).length || 0,
          total_xp_distributed: allWins?.reduce((sum, w) => sum + (w.prize_value || 0), 0) || 0
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
