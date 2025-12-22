import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Loader2 } from 'lucide-react';
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

  // Auto-open popup pour première visite
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
    <div className="min-h-screen bg-background flex flex-col pb-20">
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
      <ProgressRoad
        steps={progress.steps}
        actionsRemaining={progress.actionsRemaining}
        percentage={progress.percentage}
        className="mt-4"
      />

      {/* CTA Zone */}
      <div className="px-4 py-6">
        <AnimatePresence mode="wait">
          {unscratched.length > 0 ? (
            <motion.div
              key="cards-available"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-5xl mb-4"
              >
                🎫
              </motion.div>
              
              <h2 className="text-lg font-bold mb-2">
                {unscratched.length === 1 
                  ? 'Tu as 1 carte à gratter !' 
                  : `Tu as ${unscratched.length} cartes à gratter !`}
              </h2>
              
              <p className="text-sm text-muted-foreground mb-4">
                Découvre ton bonus en grattant
              </p>

              <Button
                size="lg"
                onClick={() => openScratchPopup(unscratched[0])}
                className={cn(
                  "bg-gradient-to-r from-primary via-yellow-500 to-orange-500",
                  "text-white font-semibold px-8 py-6 text-lg rounded-xl",
                  "shadow-lg hover:shadow-xl transition-shadow"
                )}
              >
                <Gift className="h-5 w-5 mr-2" />
                Gratter maintenant
              </Button>
            </motion.div>
          ) : canClaimDailyCard ? (
            <motion.div
              key="daily-available"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-5xl mb-4"
              >
                🎁
              </motion.div>
              
              <h2 className="text-lg font-bold mb-2">
                {isFirstTime ? 'Bienvenue ! Ta première carte t\'attend !' : 'Ta carte du jour est prête !'}
              </h2>
              
              <p className="text-sm text-muted-foreground mb-4">
                Récupère ta carte gratuite
              </p>

              <Button
                size="lg"
                onClick={handleClaimAndScratch}
                disabled={claiming}
                className="bg-gradient-to-r from-primary to-yellow-500 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg"
              >
                {claiming ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5 mr-2" />
                )}
                {claiming ? 'Chargement...' : 'Récupérer ma carte'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="keep-playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center bg-muted/30 rounded-2xl p-6"
            >
              <div className="text-4xl mb-3">🚗</div>
              <h2 className="text-lg font-bold mb-1">
                Continue d'utiliser Kwenda !
              </h2>
              <p className="text-sm text-muted-foreground">
                Plus que <span className="text-primary font-bold">{progress.actionsRemaining}</span> actions pour ta prochaine carte
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wins Gallery Grid */}
      <WinsGalleryGrid 
        wins={revealed as any[]}
        className="mt-4"
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
