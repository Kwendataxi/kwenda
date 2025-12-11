import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { 
  CardType, 
  RewardCategory, 
  ActivityLevel, 
  KwendaGrattaWin,
  CARD_TYPE_CONFIG,
  REWARD_CONFIG,
  calculateActivityLevel,
  determineCardType,
  generateReward
} from '@/types/kwenda-gratta';

interface UseKwendaGrattaReturn {
  loading: boolean;
  cards: KwendaGrattaWin[];
  unscratched: KwendaGrattaWin[];
  revealed: KwendaGrattaWin[];
  dailyCardAvailable: boolean;
  nextDailyCardAt: Date | null;
  activityLevel: ActivityLevel;
  cardStats: {
    standard: number;
    active: number;
    rare: number;
    mega: number;
  };
  claimDailyCard: () => Promise<void>;
  refreshCards: () => Promise<void>;
  updateScratchProgress: (winId: string, percentage: number) => Promise<void>;
  revealCard: (winId: string) => Promise<void>;
}

export const useKwendaGratta = (): UseKwendaGrattaReturn => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<KwendaGrattaWin[]>([]);
  const [dailyCardAvailable, setDailyCardAvailable] = useState(false);
  const [nextDailyCardAt, setNextDailyCardAt] = useState<Date | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('new');

  // Charger les cartes de l'utilisateur
  const loadCards = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('lottery_wins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedCards: KwendaGrattaWin[] = (data || []).map((win: any) => {
        const details = win.prize_details as any;
        return {
          id: win.id,
          win_id: win.id,
          cardType: (win.card_type || 'standard') as CardType,
          rewardCategory: (win.reward_type || 'xp_points') as RewardCategory,
          name: details?.name || 'Prix Kwenda',
          value: details?.value || win.prize_value || 0,
          currency: win.currency || 'CDF',
          rarity: (win.rarity || 'common') as any,
          isDailyCard: win.daily_card || false,
          boostDetails: win.boost_details as any,
          scratchPercentage: win.scratch_percentage || 0,
          scratchRevealedAt: win.scratch_revealed_at,
          createdAt: win.created_at,
          expiresInHours: win.expires_in_hours
        };
      });

      setCards(formattedCards);
    } catch (error) {
      console.error('Erreur chargement cartes Gratta:', error);
    }
  }, [user]);

  // Vérifier si la carte du jour est disponible
  const checkDailyCard = useCallback(async () => {
    if (!user) return;

    try {
      // Vérifier la dernière carte quotidienne
      // Utiliser une requête simplifiée pour éviter les problèmes de types
      const { data: lastDailyData } = await supabase
        .from('lottery_wins')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Filtrer côté client pour daily_card (colonne peut ne pas exister)
      const lastDaily = lastDailyData?.[0];

      if (!lastDaily) {
        // Première carte du jour
        setDailyCardAvailable(true);
        setNextDailyCardAt(null);
        return;
      }

      const lastCardDate = new Date(lastDaily.created_at);
      const now = new Date();
      const tomorrow = new Date(lastCardDate);
      tomorrow.setHours(24, 0, 0, 0); // Minuit du jour suivant

      if (now >= tomorrow) {
        setDailyCardAvailable(true);
        setNextDailyCardAt(null);
      } else {
        setDailyCardAvailable(false);
        setNextDailyCardAt(tomorrow);
      }
    } catch (error) {
      console.error('Erreur vérification carte quotidienne:', error);
    }
  }, [user]);

  // Calculer le niveau d'activité
  const loadActivityLevel = useCallback(async () => {
    if (!user) return;

    try {
      // Compter les courses
      const { count: ridesCount } = await supabase
        .from('transport_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Compter les livraisons
      const { count: deliveriesCount } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Compter les achats marketplace
      const { count: purchasesCount } = await supabase
        .from('marketplace_orders')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const level = calculateActivityLevel({
        totalRides: ridesCount || 0,
        totalDeliveries: deliveriesCount || 0,
        totalPurchases: purchasesCount || 0,
        totalTopups: 0,
        consecutiveDays: 0
      });

      setActivityLevel(level);
    } catch (error) {
      console.error('Erreur calcul niveau activité:', error);
    }
  }, [user]);

  // Réclamer la carte quotidienne
  const claimDailyCard = async () => {
    if (!user || !dailyCardAvailable) return;

    try {
      // Déterminer le type de carte basé sur l'activité
      const cardType = determineCardType(activityLevel);
      const reward = generateReward(cardType);
      const config = CARD_TYPE_CONFIG[cardType];
      const rewardConfig = REWARD_CONFIG[reward.category];

      // Créer la carte avec les colonnes disponibles
      const insertData: any = {
        user_id: user.id,
        prize_details: {
          name: `${config.emoji} ${rewardConfig.label}`,
          value: reward.value,
          currency: 'CDF',
          prize_id: `GRATTA-${Date.now()}`
        },
        prize_value: reward.value,
        currency: 'CDF',
        status: 'pending',
        rarity: cardType === 'mega' ? 'legendary' : cardType === 'rare' ? 'epic' : cardType === 'active' ? 'rare' : 'common',
        reward_type: reward.category,
        card_type: cardType,
        daily_card: true,
        boost_details: reward.boostDetails || {},
        expires_in_hours: 24,
        scratch_percentage: 0
      };

      const { data, error } = await supabase
        .from('lottery_wins')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      toast.success(`🎁 ${config.labelFr} reçue !`, {
        description: 'Gratte ta carte pour découvrir ton bonus !'
      });

      setDailyCardAvailable(false);
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      setNextDailyCardAt(tomorrow);

      await loadCards();
    } catch (error) {
      console.error('Erreur réclamation carte quotidienne:', error);
      toast.error('Erreur lors de la réclamation');
    }
  };

  // Mettre à jour la progression du grattage
  const updateScratchProgress = async (winId: string, percentage: number) => {
    if (!user) return;

    try {
      await supabase
        .from('lottery_wins')
        .update({ scratch_percentage: percentage })
        .eq('id', winId)
        .eq('user_id', user.id);

      setCards(prev => prev.map(card => 
        card.win_id === winId 
          ? { ...card, scratchPercentage: percentage }
          : card
      ));
    } catch (error) {
      console.error('Erreur mise à jour progression:', error);
    }
  };

  // Révéler une carte
  const revealCard = async (winId: string) => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      
      await supabase
        .from('lottery_wins')
        .update({ 
          scratch_revealed_at: now,
          scratch_percentage: 100,
          status: 'revealed'
        })
        .eq('id', winId)
        .eq('user_id', user.id);

      setCards(prev => prev.map(card => 
        card.win_id === winId 
          ? { ...card, scratchRevealedAt: now, scratchPercentage: 100 }
          : card
      ));

      // Jouer le son "Ching!"
      try {
        const audio = new Audio('/sounds/ching.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}

    } catch (error) {
      console.error('Erreur révélation carte:', error);
    }
  };

  // Charger les données initiales
  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        loadCards(),
        checkDailyCard(),
        loadActivityLevel()
      ]);
      setLoading(false);
    };

    init();
  }, [user, loadCards, checkDailyCard, loadActivityLevel]);

  // Souscrire aux changements en temps réel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('gratta-cards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lottery_wins',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadCards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadCards]);

  // Calculer les statistiques
  const unscratched = cards.filter(c => !c.scratchRevealedAt && c.scratchPercentage < 70);
  const revealed = cards.filter(c => c.scratchRevealedAt || c.scratchPercentage >= 70);
  
  const cardStats = {
    standard: cards.filter(c => c.cardType === 'standard').length,
    active: cards.filter(c => c.cardType === 'active').length,
    rare: cards.filter(c => c.cardType === 'rare').length,
    mega: cards.filter(c => c.cardType === 'mega').length
  };

  return {
    loading,
    cards,
    unscratched,
    revealed,
    dailyCardAvailable,
    nextDailyCardAt,
    activityLevel,
    cardStats,
    claimDailyCard,
    refreshCards: loadCards,
    updateScratchProgress,
    revealCard
  };
};
