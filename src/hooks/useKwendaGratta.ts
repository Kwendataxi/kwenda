import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface KwendaGrattaWin {
  id: string;
  user_id: string;
  prize_details: {
    name: string;
    value: number;
    currency: string;
  };
  prize_value: number;
  currency: string;
  status: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward_type: string;
  scratch_percentage: number;
  scratch_revealed_at: string | null;
  daily_card: boolean;
  card_type: string;
  created_at: string;
  boost_details?: any;
}

export interface UseKwendaGrattaReturn {
  cards: KwendaGrattaWin[];
  loading: boolean;
  canClaimDailyCard: boolean;
  nextCardTime: Date | null;
  streak: number;
  isFirstTime: boolean;
  claimDailyCard: (cardType?: string) => Promise<KwendaGrattaWin | null>;
  scratchCard: (cardId: string, percentage: number) => Promise<void>;
  revealCard: (cardId: string) => Promise<void>;
  refresh: () => Promise<void>;
  showScratchPopup: boolean;
  currentCardToScratch: KwendaGrattaWin | null;
  openScratchPopup: (card: KwendaGrattaWin) => void;
  closeScratchPopup: () => void;
}

export const useKwendaGratta = (): UseKwendaGrattaReturn => {
  const { user } = useAuth();
  const [cards, setCards] = useState<KwendaGrattaWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [canClaimDailyCard, setCanClaimDailyCard] = useState(false);
  const [nextCardTime, setNextCardTime] = useState<Date | null>(null);
  const [streak, setStreak] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(false);
  
  // Popup state
  const [showScratchPopup, setShowScratchPopup] = useState(false);
  const [currentCardToScratch, setCurrentCardToScratch] = useState<KwendaGrattaWin | null>(null);

  const openScratchPopup = useCallback((card: KwendaGrattaWin) => {
    setCurrentCardToScratch(card);
    setShowScratchPopup(true);
  }, []);

  const closeScratchPopup = useCallback(() => {
    setShowScratchPopup(false);
    setCurrentCardToScratch(null);
  }, []);

  // Charger les cartes de l'utilisateur
  const loadCards = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('lottery_wins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedCards = (data || []) as unknown as KwendaGrattaWin[];
      setCards(typedCards);
      
      // Vérifier si c'est la première fois (aucune carte)
      setIsFirstTime(typedCards.length === 0);
      
      // Calculer le streak (jours consécutifs avec carte grattée)
      calculateStreak(typedCards);
      
      // Vérifier si peut réclamer carte quotidienne
      checkDailyCard(typedCards);
      
    } catch (error) {
      console.error('Erreur chargement cartes:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Calculer le streak
  const calculateStreak = (cards: KwendaGrattaWin[]) => {
    const dailyCards = cards
      .filter(c => c.daily_card && c.scratch_revealed_at)
      .map(c => new Date(c.scratch_revealed_at!).toDateString());
    
    let currentStreak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toDateString();
      
      if (dailyCards.includes(dateStr)) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }
    
    setStreak(currentStreak);
  };

  // Vérifier si peut réclamer une carte quotidienne
  const checkDailyCard = (cards: KwendaGrattaWin[]) => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    // Chercher une carte quotidienne réclamée aujourd'hui
    const todayCard = cards.find(c => {
      if (!c.daily_card) return false;
      const cardDate = new Date(c.created_at);
      return cardDate >= todayMidnight;
    });

    if (todayCard) {
      setCanClaimDailyCard(false);
      // Prochaine carte demain à minuit
      const tomorrow = new Date(todayMidnight);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNextCardTime(tomorrow);
    } else {
      setCanClaimDailyCard(true);
      setNextCardTime(null);
    }
  };

  // Réclamer la carte quotidienne via edge function
  const claimDailyCard = useCallback(async (cardType: string = 'standard'): Promise<KwendaGrattaWin | null> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return null;
    }

    if (!canClaimDailyCard) {
      toast.error('Vous avez déjà récupéré votre carte aujourd\'hui');
      return null;
    }

    try {
      console.log('🎰 Réclamation carte quotidienne via edge function...');
      
      const { data, error } = await supabase.functions.invoke('lottery-system', {
        body: { 
          action: 'award_daily_card', 
          userId: user.id, 
          cardType 
        }
      });

      if (error) {
        console.error('❌ Erreur edge function:', error);
        throw new Error(error.message || 'Erreur serveur');
      }

      if (data?.error) {
        if (data.alreadyClaimed) {
          toast.error('Vous avez déjà récupéré votre carte aujourd\'hui');
          setCanClaimDailyCard(false);
        } else {
          toast.error(data.error);
        }
        return null;
      }

      if (data?.success && data?.card) {
        const newCard = data.card as KwendaGrattaWin;
        
        // Ajouter la carte à la liste
        setCards(prev => [newCard, ...prev]);
        setCanClaimDailyCard(false);
        
        // Calculer prochaine carte
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        setNextCardTime(tomorrow);
        
        toast.success('🎉 Carte obtenue ! Grattez-la pour découvrir votre gain !');
        
        return newCard;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Erreur réclamation carte:', error);
      toast.error(error.message || 'Impossible de récupérer la carte');
      return null;
    }
  }, [user, canClaimDailyCard]);

  // Mettre à jour le pourcentage de grattage
  const scratchCard = useCallback(async (cardId: string, percentage: number) => {
    try {
      await supabase
        .from('lottery_wins')
        .update({ scratch_percentage: percentage })
        .eq('id', cardId);

      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, scratch_percentage: percentage } : c
      ));
    } catch (error) {
      console.error('Erreur mise à jour grattage:', error);
    }
  }, []);

  // Révéler une carte (marquer comme révélée)
  const revealCard = useCallback(async (cardId: string) => {
    try {
      const now = new Date().toISOString();
      
      await supabase
        .from('lottery_wins')
        .update({ 
          scratch_revealed_at: now,
          scratch_percentage: 100,
          status: 'claimed'
        })
        .eq('id', cardId);

      setCards(prev => prev.map(c => 
        c.id === cardId 
          ? { ...c, scratch_revealed_at: now, scratch_percentage: 100, status: 'claimed' } 
          : c
      ));

      // Recalculer le streak
      const updatedCards = cards.map(c => 
        c.id === cardId 
          ? { ...c, scratch_revealed_at: now, scratch_percentage: 100, status: 'claimed' } 
          : c
      );
      calculateStreak(updatedCards);
      
    } catch (error) {
      console.error('Erreur révélation carte:', error);
    }
  }, [cards]);

  // Refresh manuel
  const refresh = useCallback(async () => {
    setLoading(true);
    await loadCards();
  }, [loadCards]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  return {
    cards,
    loading,
    canClaimDailyCard,
    nextCardTime,
    streak,
    isFirstTime,
    claimDailyCard,
    scratchCard,
    revealCard,
    refresh,
    showScratchPopup,
    currentCardToScratch,
    openScratchPopup,
    closeScratchPopup
  };
};
