import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface PrizeType {
  id: string;
  name: string;
  category: string;
  value: number;
  currency: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image_url?: string;
  probability: number;
  physical_delivery_required: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { source_type, source_id } = await req.json();

    // Get active prize types with probabilities
    const { data: prizeTypes, error: prizeError } = await supabaseClient
      .from('lottery_prize_types')
      .select('*')
      .eq('is_active', true)
      .order('probability', { ascending: false });

    if (prizeError || !prizeTypes || prizeTypes.length === 0) {
      throw new Error('Aucun prix disponible');
    }

    // Weighted random selection based on probability
    const totalProbability = prizeTypes.reduce((sum: number, p: PrizeType) => sum + p.probability, 0);
    let random = Math.random() * totalProbability;
    
    let selectedPrize: PrizeType | null = null;
    for (const prize of prizeTypes) {
      random -= prize.probability;
      if (random <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    if (!selectedPrize) {
      selectedPrize = prizeTypes[prizeTypes.length - 1]; // Fallback to last prize
    }

    // Create lottery win with scratch card
    const { data: win, error: winError } = await supabaseClient
      .from('lottery_wins')
      .insert({
        user_id: user.id,
        prize_type_id: selectedPrize.id,
        source_type: source_type,
        source_id: source_id,
        status: 'pending',
        prize_details: {
          prize_id: selectedPrize.id,
          name: selectedPrize.name,
          value: selectedPrize.value,
          currency: selectedPrize.currency,
          image_url: selectedPrize.image_url
        },
        rarity: selectedPrize.rarity,
        reward_type: selectedPrize.category === 'cash' ? 'cash' : 
                     selectedPrize.category === 'lottery_entry' ? 'points' : 'physical_gift',
        points_awarded: selectedPrize.category === 'lottery_entry' ? selectedPrize.value : 0,
        scratch_percentage: 0,
        scratch_revealed_at: null
      })
      .select()
      .single();

    if (winError) throw winError;

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'scratch_card_won',
        description: `Carte à gratter ${selectedPrize.rarity} gagnée`,
        metadata: {
          win_id: win.id,
          prize_name: selectedPrize.name,
          rarity: selectedPrize.rarity,
          source_type,
          source_id
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        win: {
          win_id: win.id,
          id: selectedPrize.id,
          name: selectedPrize.name,
          value: selectedPrize.value,
          currency: selectedPrize.currency,
          rarity: selectedPrize.rarity,
          reward_type: win.reward_type,
          image_url: selectedPrize.image_url,
          scratch_percentage: 0,
          created_at: win.created_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in instant-scratch-win:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
