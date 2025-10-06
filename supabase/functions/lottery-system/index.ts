import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, lottery_id, prize_amount } = await req.json();

    console.log('🎰 Lottery system action:', action);

    if (action === 'draw') {
      // Get active tickets for today's lottery
      const { data: tickets } = await supabase
        .from('lottery_tickets')
        .select('id, user_id')
        .eq('status', 'active')
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

      if (!tickets || tickets.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Aucun ticket actif' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Random draw
      const winnerTicket = tickets[Math.floor(Math.random() * tickets.length)];

      // Mark ticket as won
      await supabase
        .from('lottery_tickets')
        .update({ 
          status: 'won',
          prize_amount: prize_amount || 50000,
          drawn_at: new Date().toISOString()
        })
        .eq('id', winnerTicket.id);

      // Mark other tickets as lost
      await supabase
        .from('lottery_tickets')
        .update({ 
          status: 'lost',
          drawn_at: new Date().toISOString()
        })
        .neq('id', winnerTicket.id)
        .eq('status', 'active');

      // Create notification for winner
      await supabase.from('delivery_notifications').insert({
        user_id: winnerTicket.user_id,
        title: '🎉 Félicitations ! Vous avez gagné !',
        message: `Vous avez gagné ${prize_amount || 50000} CDF à la loterie Kwenda !`,
        notification_type: 'lottery_win',
        metadata: {
          ticket_id: winnerTicket.id,
          prize_amount: prize_amount || 50000,
          draw_date: new Date().toISOString()
        }
      });

      // Credit wallet
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('id, balance')
        .eq('user_id', winnerTicket.user_id)
        .eq('currency', 'CDF')
        .single();

      if (wallet) {
        await supabase
          .from('user_wallets')
          .update({ balance: (wallet.balance || 0) + (prize_amount || 50000) })
          .eq('id', wallet.id);

        await supabase.from('wallet_transactions').insert({
          wallet_id: wallet.id,
          user_id: winnerTicket.user_id,
          transaction_type: 'lottery_win',
          amount: prize_amount || 50000,
          currency: 'CDF',
          description: 'Gain loterie Kwenda',
          reference_id: winnerTicket.id,
          reference_type: 'lottery_ticket'
        });
      }

      console.log(`✅ Lottery draw completed. Winner: ${winnerTicket.user_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          winner: {
            ticket_id: winnerTicket.id,
            user_id: winnerTicket.user_id,
            prize_amount: prize_amount || 50000
          },
          total_tickets: tickets.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'stats') {
      const { data: stats } = await supabase
        .from('lottery_tickets')
        .select('status, created_at, prize_amount')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const summary = {
        total_tickets: stats?.length || 0,
        active: stats?.filter(t => t.status === 'active').length || 0,
        won: stats?.filter(t => t.status === 'won').length || 0,
        lost: stats?.filter(t => t.status === 'lost').length || 0,
        total_prizes: stats?.filter(t => t.status === 'won')
          .reduce((sum, t) => sum + (t.prize_amount || 0), 0) || 0
      };

      return new Response(
        JSON.stringify({ success: true, stats: summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Action inconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in lottery-system:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
