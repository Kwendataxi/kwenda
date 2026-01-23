import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Loader2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScratchCardPopup } from './ScratchCardPopup';
import { TombolaHeader } from './TombolaHeader';
import { ProgressRoad } from './ProgressRoad';
import { WinsGalleryGrid } from './WinsGalleryGrid';
import { useKwendaGratta, KwendaGrattaWin as DBKwendaGrattaWin } from '@/hooks/useKwendaGratta';
import { useScratchProgress } from '@/hooks/useScratchProgress';
import { KwendaGrattaWin, CardType, RewardCategory } from '@/types/kwenda-gratta';
import { cn } from '@/lib/utils';

export interface KwendaGrattaDashboardProps {
  hideHeader?: boolean;
}

// Transformer le format DB vers le format attendu par ScratchCardPopup
const transformCardForPopup = (card: DBKwendaGrattaWin): KwendaGrattaWin => ({
  id: card.id,
  win_id: card.id,
  cardType: (card.card_type as CardType) || 'standard',
  rewardCategory: (card.reward_type as RewardCategory) || 'xp_points',
  name: card.prize_details?.name || 'Prix',
  value: card.prize_value || 0,
  currency: card.currency || 'XP',
  rarity: card.rarity || 'common',
  isDailyCard: card.daily_card || false,
  boostDetails: card.boost_details,
  scratchPercentage: card.scratch_percentage || 0,
  scratchRevealedAt: card.scratch_revealed_at || undefined,
  createdAt: card.created_at
});

export const KwendaGrattaDashboard: React.FC<KwendaGrattaDashboardProps> = ({ 
  hideHeader = false 
}) => {
  const {
    cards,
    loading: cardsLoading,
    canClaimDailyCard,
    isFirstTime,
    claimDailyCard,
    scratchCard,
    revealCard,
    showScratchPopup,
    currentCardToScratch,
    openScratchPopup,
    closeScratchPopup
  } = useKwendaGratta();

  const { progress, loading: progressLoading } = useScratchProgress();

  const [claiming, setClaiming] = useState(false);

  // Cartes non grattées et révélées
  const unscratched = cards.filter(c => !c.scratch_revealed_at && c.scratch_percentage < 70);
  const revealed = cards.filter(c => c.scratch_revealed_at || c.scratch_percentage >= 70);
  
  // Carte transformée pour le popup
  const popupCard = useMemo(() => 
    currentCardToScratch ? transformCardForPopup(currentCardToScratch) : null
  , [currentCardToScratch]);

  // Auto-open popup si carte non grattée disponible
  useEffect(() => {
    if (!cardsLoading && unscratched.length > 0 && !showScratchPopup) {
      // Auto-ouvrir le popup pour la première carte non grattée
      openScratchPopup(unscratched[0]);
    }
  }, [cardsLoading, unscratched.length]);

  // Première visite: claim automatique
  useEffect(() => {
    const hasVisited = localStorage.getItem('kwenda_gratta_visited');
    
    if (!hasVisited && !cardsLoading && isFirstTime && canClaimDailyCard) {
      localStorage.setItem('kwenda_gratta_visited', 'true');
      handleClaimAndScratch();
    }
  }, [cardsLoading, isFirstTime, canClaimDailyCard]);

  const handleClaimAndScratch = async () => {
    setClaiming(true);
    try {
      const card = await claimDailyCard();
      if (card) {
        setTimeout(() => {
          openScratchPopup(card);
        }, 300);
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleScratch = (percentage: number) => {
    if (currentCardToScratch) {
      scratchCard(currentCardToScratch.id, percentage);
    }
  };

  const handleReveal = () => {
    if (currentCardToScratch) {
      revealCard(currentCardToScratch.id);
    }
  };

  const loading = cardsLoading || progressLoading;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col pb-20">
      {/* Header avec total des gains */}
      {!hideHeader && (
        <div className="px-4 pt-4">
          <TombolaHeader 
            totalWinnings={progress.totalWinnings}
            currency={progress.currency}
          />
        </div>
      )}

      {/* Progress Road */}
      <div className="mt-4">
        <ProgressRoad
          steps={progress.steps}
          actionsRemaining={progress.actionsRemaining}
          percentage={progress.percentage}
        />
      </div>

      {/* Message quand aucune carte disponible */}
      {unscratched.length === 0 && !canClaimDailyCard && (
        <div className="px-4 py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm border border-border p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Car className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-foreground">
                  Continue d'utiliser Kwenda !
                </h2>
                <p className="text-sm text-muted-foreground">
                  Plus que <span className="text-primary font-semibold">{progress.actionsRemaining}</span> actions pour ta prochaine carte
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Wins Gallery Grid - Style Total avec grattage inline */}
      <WinsGalleryGrid 
        wins={cards as any[]}
        className="mt-2"
        onScratch={scratchCard}
        onReveal={revealCard}
      />

      {/* Scratch Card Popup */}
      <ScratchCardPopup
        card={popupCard}
        isOpen={showScratchPopup}
        onClose={closeScratchPopup}
        onScratch={handleScratch}
        onReveal={handleReveal}
      />
    </div>
  );
};
