import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LotteryTicketRequest {
  userId: string;
  sourceType: 'transport' | 'delivery' | 'marketplace_buy' | 'marketplace_sell' | 'referral' | 'daily_login' | 'challenge';
  sourceId?: string;
  multiplier?: number;
  count?: number;
}

interface DrawLotteryRequest {
  drawId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'award_ticket':
        return await awardTicket(req, supabaseClient);
      case 'draw_lottery':
        return await drawLottery(req, supabaseClient);
      case 'create_daily_draw':
        return await createDailyDraw(supabaseClient);
      default:
        throw new Error('Action non supportée');
    }

  } catch (error) {
    console.error('Erreur dans lottery-system:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Attribuer des tickets de tombola
async function awardTicket(req: Request, supabase: any) {
  const { userId, sourceType, sourceId, multiplier = 1, count = 1 }: LotteryTicketRequest = await req.json();

  console.log(`Attribution de ${count} tickets pour ${userId} (source: ${sourceType})`);

  const tickets = [];
  for (let i = 0; i < count; i++) {
    // Générer un numéro de ticket unique
    const { data: ticketNumber, error: codeError } = await supabase
      .rpc('generate_lottery_ticket_number');

    if (codeError) {
      throw new Error(`Erreur génération ticket: ${codeError.message}`);
    }

    // Créer le ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('lottery_tickets')
      .insert({
        user_id: userId,
        ticket_number: ticketNumber,
        source_type: sourceType,
        source_id: sourceId,
        multiplier: multiplier,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
      })
      .select()
      .single();

    if (ticketError) {
      throw new Error(`Erreur création ticket: ${ticketError.message}`);
    }

    tickets.push(ticket);

    // Log d'activité
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        activity_type: 'lottery_ticket_earned',
        description: `Ticket de tombola gagné: ${ticketNumber}`,
        metadata: {
          ticket_id: ticket.id,
          source_type: sourceType,
          source_id: sourceId,
          multiplier: multiplier
        }
      });
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      tickets,
      message: `${count} ticket(s) attribué(s) avec succès`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Effectuer un tirage de tombola
async function drawLottery(req: Request, supabase: any) {
  const { drawId }: DrawLotteryRequest = await req.json();

  console.log(`Démarrage du tirage: ${drawId}`);

  // Récupérer les détails du tirage
  const { data: draw, error: drawError } = await supabase
    .from('lottery_draws')
    .select('*')
    .eq('id', drawId)
    .single();

  if (drawError) {
    throw new Error(`Tirage non trouvé: ${drawError.message}`);
  }

  if (draw.status !== 'scheduled') {
    throw new Error('Le tirage n\'est pas programmé');
  }

  // Marquer le tirage comme actif
  await supabase
    .from('lottery_draws')
    .update({ 
      status: 'active',
      drawn_at: new Date().toISOString()
    })
    .eq('id', drawId);

  // Récupérer toutes les participations
  const { data: entries, error: entriesError } = await supabase
    .from('lottery_entries')
    .select('*, profiles!inner(display_name)')
    .eq('draw_id', drawId);

  if (entriesError) {
    throw new Error(`Erreur récupération participations: ${entriesError.message}`);
  }

  if (entries.length === 0) {
    // Aucun participant, annuler le tirage
    await supabase
      .from('lottery_draws')
      .update({ status: 'cancelled' })
      .eq('id', drawId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Tirage annulé - aucun participant'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Créer la liste pondérée des participants (plus de tickets = plus de chances)
  const weightedEntries: any[] = [];
  entries.forEach(entry => {
    for (let i = 0; i < entry.tickets_used; i++) {
      weightedEntries.push(entry);
    }
  });

  // Sélectionner les gagnants
  const winners: any[] = [];
  const prizePool = draw.prize_pool;
  const selectedEntries = new Set();

  for (const prize of prizePool) {
    for (let i = 0; i < prize.quantity && winners.length < draw.max_winners; i++) {
      // Sélection aléatoire pondérée
      let attempts = 0;
      let winnerEntry;
      
      do {
        const randomIndex = Math.floor(Math.random() * weightedEntries.length);
        winnerEntry = weightedEntries[randomIndex];
        attempts++;
      } while (selectedEntries.has(winnerEntry.id) && attempts < 100);

      if (attempts >= 100) break; // Éviter boucle infinie
      
      selectedEntries.add(winnerEntry.id);
      
      // Créer l'enregistrement de gain
      const { data: win, error: winError } = await supabase
        .from('lottery_wins')
        .insert({
          user_id: winnerEntry.user_id,
          draw_id: drawId,
          entry_id: winnerEntry.id,
          prize_details: prize,
          prize_value: prize.value || 0,
          currency: 'CDF',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours pour réclamer
        })
        .select()
        .single();

      if (winError) {
        console.error('Erreur création gain:', winError);
        continue;
      }

      // Marquer l'entrée comme gagnante
      await supabase
        .from('lottery_entries')
        .update({ 
          is_winner: true,
          prize_won: prize
        })
        .eq('id', winnerEntry.id);

      winners.push({
        entry: winnerEntry,
        prize: prize,
        win: win
      });

      // Log d'activité
      await supabase
        .from('activity_logs')
        .insert({
          user_id: winnerEntry.user_id,
          activity_type: 'lottery_win',
          description: `Gain à la tombola: ${prize.prize_name}`,
          metadata: {
            draw_id: drawId,
            prize: prize,
            win_id: win.id
          }
        });
    }
  }

  // Marquer le tirage comme terminé
  await supabase
    .from('lottery_draws')
    .update({ 
      status: 'completed',
      total_participants: entries.length,
      total_tickets_used: weightedEntries.length
    })
    .eq('id', drawId);

  console.log(`Tirage terminé: ${winners.length} gagnants`);

  return new Response(
    JSON.stringify({ 
      success: true, 
      draw: draw,
      winners: winners.length,
      participants: entries.length,
      message: `Tirage terminé avec ${winners.length} gagnants`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Créer un tirage quotidien automatique
async function createDailyDraw(supabase: any) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20, 0, 0, 0); // 20h00

  const { data: existingDraw } = await supabase
    .from('lottery_draws')
    .select('id')
    .eq('draw_type', 'daily')
    .eq('status', 'scheduled')
    .gte('scheduled_date', new Date().toISOString())
    .single();

  if (existingDraw) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Tirage quotidien déjà programmé'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Créer le nouveau tirage quotidien
  const { data: newDraw, error } = await supabase
    .from('lottery_draws')
    .insert({
      name: `Tirage Flash ${tomorrow.toLocaleDateString('fr-FR')}`,
      draw_type: 'daily',
      scheduled_date: tomorrow.toISOString(),
      min_tickets_required: 1,
      max_winners: 10,
      prize_pool: [
        { prize_name: "Crédit Kwenda 1K", value: 1000, quantity: 5, probability: 0.5 },
        { prize_name: "Crédit Kwenda 5K", value: 5000, quantity: 3, probability: 0.3 },
        { prize_name: "Course Gratuite", value: 5000, quantity: 2, probability: 0.2 }
      ]
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création tirage: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      draw: newDraw,
      message: 'Tirage quotidien créé'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}