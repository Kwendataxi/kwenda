import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { action, userId, sourceType, sourceId, count, multiplier, drawId } = await req.json();

    console.log(`🎰 Lottery system action: ${action}`);

    // ACTION 1: Attribuer des tickets
    if (action === 'award_ticket') {
      if (!userId || !sourceType) {
        return new Response(
          JSON.stringify({ error: 'userId et sourceType requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const ticketCount = (count || 1) * (multiplier || 1);
      const tickets = [];

      // Créer les tickets
      for (let i = 0; i < ticketCount; i++) {
        // Générer un numéro de ticket unique
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

        if (error) {
          console.error(`❌ Erreur insertion ticket ${i+1}:`, error);
        } else if (ticket) {
          console.log(`✅ Ticket ${i+1} créé: ${ticket.ticket_number}`);
          tickets.push(ticket);
        }
      }

      console.log(`✅ ${tickets.length} ticket(s) attribué(s) à ${userId}`);

      return new Response(
        JSON.stringify({ success: true, tickets }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION 2: Générer une carte à gratter directement (pour test ou attribution immédiate)
    if (action === 'generate_scratch_card') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Système de rareté avec probabilités
      const rarityRoll = Math.random();
      let rarity: string;
      let prizeValue: number;
      let prizeName: string;

      if (rarityRoll < 0.02) {
        // 2% Légendaire
        rarity = 'legendary';
        prizeValue = 50000 + Math.floor(Math.random() * 150000); // 50k-200k CDF
        prizeName = '🏆 Jackpot Légendaire';
      } else if (rarityRoll < 0.10) {
        // 8% Épique
        rarity = 'epic';
        prizeValue = 10000 + Math.floor(Math.random() * 40000); // 10k-50k CDF
        prizeName = '💎 Gros Lot Épique';
      } else if (rarityRoll < 0.30) {
        // 20% Rare
        rarity = 'rare';
        prizeValue = 2000 + Math.floor(Math.random() * 8000); // 2k-10k CDF
        prizeName = '✨ Lot Rare';
      } else {
        // 70% Commun
        rarity = 'common';
        prizeValue = 100 + Math.floor(Math.random() * 1900); // 100-2k CDF
        prizeName = '🎁 Lot Commun';
      }

      // Créer la carte à gratter
      const { data: scratchCard, error } = await supabase
        .from('lottery_wins')
        .insert({
          user_id: userId,
          prize_details: {
            name: prizeName,
            value: prizeValue,
            currency: 'CDF',
            prize_id: `PRIZE-${Date.now()}`
          },
          prize_value: prizeValue,
          currency: 'CDF',
          status: 'pending',
          rarity: rarity,
          reward_type: 'cash',
          scratch_percentage: 0,
          scratch_revealed_at: null
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur création carte à gratter:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`✅ Carte à gratter créée: ${rarity} - ${prizeValue} CDF`);

      return new Response(
        JSON.stringify({ success: true, scratchCard }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ACTION 3: Effectuer un tirage
    if (action === 'drawLottery') {
      if (!drawId) {
        return new Response(
          JSON.stringify({ error: 'drawId requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`🎲 Exécution du tirage ${drawId}`);

      // 1. Récupérer le tirage
      const { data: draw, error: drawError } = await supabase
        .from('lottery_draws')
        .select('*')
        .eq('id', drawId)
        .single();

      if (drawError || !draw) {
        return new Response(
          JSON.stringify({ error: 'Tirage non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Récupérer tous les tickets actifs pour ce tirage
      const { data: tickets, error: ticketsError } = await supabase
        .from('lottery_tickets')
        .select('*')
        .eq('status', 'active')
        .is('draw_id', null);

      if (ticketsError || !tickets || tickets.length === 0) {
        console.log('❌ Aucun ticket disponible pour le tirage');
        return new Response(
          JSON.stringify({ error: 'Aucun ticket disponible' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`📊 ${tickets.length} tickets participants`);

      // 3. Récupérer les prix disponibles pour ce type de tirage
      const { data: prizes, error: prizesError } = await supabase
        .from('lottery_prize_types')
        .select('*')
        .eq('draw_type', draw.draw_type)
        .eq('is_active', true)
        .order('probability', { ascending: false });

      if (prizesError || !prizes || prizes.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Aucun prix disponible' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 4. Sélectionner des gagnants aléatoirement
      const winners = [];
      const maxWinners = Math.min(prizes.length, Math.floor(tickets.length * 0.1)); // Max 10% de gagnants

      for (let i = 0; i < maxWinners; i++) {
        const randomTicket = tickets[Math.floor(Math.random() * tickets.length)];
        const randomPrize = prizes[i]; // Attribution séquentielle des prix

        // Créer un gagnant
        const { data: win, error: winError } = await supabase
          .from('lottery_wins')
          .insert({
            draw_id: drawId,
            user_id: randomTicket.user_id,
            ticket_id: randomTicket.id,
            prize_type_id: randomPrize.id,
            won_at: new Date().toISOString(),
            status: 'pending'
          })
          .select()
          .single();

        if (!winError && win) {
          winners.push(win);

          // Marquer le ticket comme utilisé
          await supabase
            .from('lottery_tickets')
            .update({ status: 'used', draw_id: drawId })
            .eq('id', randomTicket.id);
        }
      }

      // 5. Mettre à jour le statut du tirage
      await supabase
        .from('lottery_draws')
        .update({
          status: 'completed',
          executed_at: new Date().toISOString(),
          total_participants: tickets.length,
          total_winners: winners.length
        })
        .eq('id', drawId);

      console.log(`🎉 Tirage terminé: ${winners.length} gagnant(s)`);

      // 6. Notifier les gagnants
      for (const win of winners) {
        await supabase.from('delivery_notifications').insert({
          user_id: win.user_id,
          title: '🎉 Vous avez gagné !',
          message: 'Félicitations ! Vous avez remporté un prix à la tombola Kwenda',
          notification_type: 'lottery_win',
          related_order_id: win.id
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          draw_id: drawId,
          participants: tickets.length,
          winners: winners.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action inconnue
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
