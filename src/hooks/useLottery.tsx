import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LotteryTicket {
  id: string;
  ticket_number: string;
  source_type: string;
  source_id?: string;
  earned_date: string;
  status: string;
  multiplier: number;
  expires_at?: string;
}

interface LotteryDraw {
  id: string;
  name: string;
  draw_type: string;
  scheduled_date: string;
  status: string;
  min_tickets_required: number;
  max_winners: number;
  total_participants: number;
  prize_pool: any;
}

interface LotteryEntry {
  id: string;
  draw_id: string;
  tickets_used: number;
  entry_time: string;
  is_winner: boolean;
  prize_won?: any;
  claimed_at?: string;
}

interface LotteryWin {
  id: string;
  draw_id: string;
  prize_details: any;
  prize_value: number;
  currency: string;
  status: string;
  claimed_at?: string;
  expires_at?: string;
}

export const useLottery = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<LotteryTicket[]>([]);
  const [availableTickets, setAvailableTickets] = useState(0);
  const [currentDraws, setCurrentDraws] = useState<LotteryDraw[]>([]);
  const [myEntries, setMyEntries] = useState<LotteryEntry[]>([]);
  const [myWins, setMyWins] = useState<LotteryWin[]>([]);

  // Charger les données de la tombola
  const loadLotteryData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Charger les tickets de l'utilisateur
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('lottery_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_date', { ascending: false });

      if (ticketsError) throw ticketsError;
      
      setTickets(ticketsData || []);
      setAvailableTickets(ticketsData?.filter(t => t.status === 'available').length || 0);

      // Charger les tirages actifs et à venir
      const { data: drawsData, error: drawsError } = await supabase
        .from('lottery_draws')
        .select('*')
        .in('status', ['scheduled', 'active'])
        .order('scheduled_date', { ascending: true })
        .limit(10);

      if (drawsError) throw drawsError;
      setCurrentDraws(drawsData || []);

      // Charger les participations de l'utilisateur
      const { data: entriesData, error: entriesError } = await supabase
        .from('lottery_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_time', { ascending: false })
        .limit(20);

      if (entriesError) throw entriesError;
      setMyEntries(entriesData || []);

      // Charger les gains de l'utilisateur
      const { data: winsData, error: winsError } = await supabase
        .from('lottery_wins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (winsError) throw winsError;
      setMyWins(winsData || []);

    } catch (error) {
      console.error('Erreur lors du chargement des données de tombola:', error);
    } finally {
      setLoading(false);
    }
  };

  // Participer à un tirage
  const enterDraw = async (drawId: string, ticketsToUse: number = 1) => {
    if (!user || availableTickets < ticketsToUse) {
      throw new Error('Pas assez de tickets disponibles');
    }

    try {
      // Sélectionner les tickets disponibles
      const availableTicketsList = tickets
        .filter(t => t.status === 'available')
        .slice(0, ticketsToUse);

      if (availableTicketsList.length < ticketsToUse) {
        throw new Error('Pas assez de tickets disponibles');
      }

      // Créer l'entrée dans le tirage
      const { data: entryData, error: entryError } = await supabase
        .from('lottery_entries')
        .insert({
          user_id: user.id,
          draw_id: drawId,
          tickets_used: ticketsToUse,
          ticket_ids: availableTicketsList.map(t => t.id)
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Marquer les tickets comme utilisés
      const { error: updateError } = await supabase
        .from('lottery_tickets')
        .update({ 
          status: 'used', 
          used_in_draw_id: drawId,
          used_at: new Date().toISOString()
        })
        .in('id', availableTicketsList.map(t => t.id));

      if (updateError) throw updateError;

      // Recharger les données
      await loadLotteryData();
      
      return entryData;
    } catch (error) {
      console.error('Erreur lors de la participation au tirage:', error);
      throw error;
    }
  };

  // Réclamer un gain
  const claimWin = async (winId: string) => {
    try {
      const { error } = await supabase
        .from('lottery_wins')
        .update({ 
          status: 'claimed',
          claimed_at: new Date().toISOString()
        })
        .eq('id', winId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Recharger les données
      await loadLotteryData();
    } catch (error) {
      console.error('Erreur lors de la réclamation du gain:', error);
      throw error;
    }
  };

  // Effet pour charger les données au montage et écouter les changements en temps réel
  useEffect(() => {
    if (user) {
      loadLotteryData();

      // Écouter les nouveaux tickets
      const ticketsChannel = supabase
        .channel('user-lottery-tickets')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'lottery_tickets',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadLotteryData();
          }
        )
        .subscribe();

      // Écouter les gains
      const winsChannel = supabase
        .channel('user-lottery-wins')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'lottery_wins',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadLotteryData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ticketsChannel);
        supabase.removeChannel(winsChannel);
      };
    }
  }, [user]);

  return {
    loading,
    tickets,
    availableTickets,
    currentDraws,
    myEntries,
    myWins,
    enterDraw,
    claimWin,
    refreshData: loadLotteryData
  };
};