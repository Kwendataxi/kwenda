import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Info, Ticket, Gift, Flame, Star, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScratchCardPopup } from './ScratchCardPopup';
import { useKwendaGratta } from '@/hooks/useKwendaGratta';
import { KwendaGrattaWin } from '@/types/kwenda-gratta';
import { cn } from '@/lib/utils';
import '@/styles/kwenda-gratta.css';

export interface KwendaGrattaDashboardProps {
  hideHeader?: boolean;
}

export const KwendaGrattaDashboard: React.FC<KwendaGrattaDashboardProps> = ({ 
  hideHeader = false 
}) => {
  const {
    loading,
    unscratched,
    revealed,
    dailyCardAvailable,
    nextDailyCardAt,
    streakData,
    claimDailyCard,
    updateScratchProgress,
    revealCard
  } = useKwendaGratta();

  const [showPopup, setShowPopup] = useState(false);
  const [currentCard, setCurrentCard] = useState<KwendaGrattaWin | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Check for first visit and auto-open card
  useEffect(() => {
    const hasVisited = localStorage.getItem('kwenda_gratta_visited');
    
    if (!hasVisited && !loading) {
      setIsFirstVisit(true);
      localStorage.setItem('kwenda_gratta_visited', 'true');
      
      // If daily card available on first visit, claim and open
      if (dailyCardAvailable) {
        handleClaimAndScratch();
      }
    }
  }, [loading, dailyCardAvailable]);

  // Auto-open popup when there's an unscratched card on first visit
  useEffect(() => {
    if (isFirstVisit && unscratched.length > 0 && !showPopup && !currentCard) {
      const timer = setTimeout(() => {
        openScratchPopup(unscratched[0]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit, unscratched, showPopup, currentCard]);

  const handleClaimAndScratch = async () => {
    await claimDailyCard();
  };

  const openScratchPopup = (card: KwendaGrattaWin) => {
    setCurrentCard(card);
    setShowPopup(true);
  };

  const closeScratchPopup = () => {
    setShowPopup(false);
    setCurrentCard(null);
    setIsFirstVisit(false);
  };

  const handleScratch = (percentage: number) => {
    if (currentCard) {
      updateScratchProgress(currentCard.win_id, percentage);
    }
  };

  const handleReveal = () => {
    if (currentCard) {
      revealCard(currentCard.win_id);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!nextDailyCardAt) return null;
    const now = new Date();
    const diff = nextDailyCardAt.getTime() - now.getTime();
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

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
    <div className="min-h-[60vh] bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Minimal Header */}
      {!hideHeader && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pt-4 pb-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl"
            >
              🎰
            </motion.span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[hsl(var(--kwenda-blue))] via-[hsl(var(--kwenda-yellow))] to-[hsl(var(--kwenda-red))] bg-clip-text text-transparent">
              Kwenda Gratta
            </h1>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Comment jouer ?</h4>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  <li>🎁 Récupère ta carte gratuite chaque jour</li>
                  <li>👆 Gratte pour découvrir ton bonus</li>
                  <li>🔥 Enchaîne les jours pour des récompenses</li>
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
      )}

      {/* Main Content - Central CTA */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {unscratched.length > 0 ? (
            // Cards available to scratch
            <motion.div
              key="cards-available"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center w-full max-w-sm"
            >
              {/* Animated card preview */}
              <motion.div
                className="relative mx-auto mb-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="relative w-48 h-32 mx-auto">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--kwenda-blue))] via-[hsl(var(--kwenda-yellow))] to-[hsl(var(--kwenda-red))] rounded-xl blur-xl opacity-40" />
                  
                  {/* Card stack effect */}
                  {unscratched.length > 1 && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl transform rotate-3 translate-y-2 opacity-50" />
                  )}
                  
                  {/* Main card */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-300 via-slate-200 to-slate-400 rounded-xl shadow-xl flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Ticket className="h-12 w-12 text-slate-500" />
                    </motion.div>
                  </div>
                  
                  {/* Sparkles */}
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                  </motion.div>
                </div>
              </motion.div>

              <h2 className="text-lg font-semibold mb-2">
                {unscratched.length === 1 
                  ? 'Tu as 1 carte à gratter !' 
                  : `Tu as ${unscratched.length} cartes à gratter !`}
              </h2>
              
              <p className="text-sm text-muted-foreground mb-6">
                Découvre ton bonus en grattant
              </p>

              <Button
                size="lg"
                onClick={() => openScratchPopup(unscratched[0])}
                className="bg-gradient-to-r from-[hsl(var(--kwenda-blue))] via-[hsl(var(--kwenda-yellow))] to-[hsl(var(--kwenda-red))] text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <Gift className="h-5 w-5 mr-2" />
                Gratter maintenant
              </Button>

              {/* Other cards indicator */}
              {unscratched.length > 1 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm text-muted-foreground flex items-center justify-center gap-1 mx-auto hover:text-foreground transition-colors"
                >
                  +{unscratched.length - 1} autre{unscratched.length > 2 ? 's' : ''} carte{unscratched.length > 2 ? 's' : ''}
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
              )}
            </motion.div>
          ) : dailyCardAvailable ? (
            // Daily card available
            <motion.div
              key="daily-available"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center w-full max-w-sm"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🎁
              </motion.div>
              
              <h2 className="text-lg font-semibold mb-2">
                Ta carte du jour t'attend !
              </h2>
              
              <p className="text-sm text-muted-foreground mb-6">
                Récupère ta carte gratuite
              </p>

              <Button
                size="lg"
                onClick={handleClaimAndScratch}
                className="bg-gradient-to-r from-[hsl(var(--kwenda-blue))] to-[hsl(var(--kwenda-yellow))] text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Récupérer ma carte
              </Button>
            </motion.div>
          ) : (
            // No cards, waiting for next
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center w-full max-w-sm"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
              
              <h2 className="text-lg font-semibold mb-2">
                Prochaine carte
              </h2>
              
              <p className="text-2xl font-bold text-primary mb-2">
                {getTimeRemaining() || 'Bientôt !'}
              </p>
              
              <p className="text-sm text-muted-foreground">
                Reviens demain pour une nouvelle carte
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Stats Bar - Minimal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 pb-4"
      >
        <div className="flex items-center justify-center gap-6 py-3 px-4 rounded-xl bg-muted/50 backdrop-blur-sm">
          {/* Streak */}
          <div className="flex items-center gap-2">
            <Flame className={cn(
              "h-5 w-5",
              streakData.currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
            )} />
            <span className="font-semibold">{streakData.currentStreak}</span>
            <span className="text-xs text-muted-foreground">jours</span>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Total revealed */}
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">{revealed.length}</span>
            <span className="text-xs text-muted-foreground">révélées</span>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Best streak */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span className="font-semibold">{streakData.longestStreak}</span>
            <span className="text-xs text-muted-foreground">record</span>
          </div>
        </div>
      </motion.div>

      {/* Scratch Card Popup */}
      <ScratchCardPopup
        card={currentCard}
        isOpen={showPopup}
        onClose={closeScratchPopup}
        onScratch={handleScratch}
        onReveal={handleReveal}
      />
    </div>
  );
};
