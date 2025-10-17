import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScratchCardCanvas } from './ScratchCardCanvas';
import { PrizeRevealAnimation } from './PrizeRevealAnimation';
import { ScratchCardWin, RARITY_CONFIG } from '@/types/scratch-card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ScratchCardProps {
  win: ScratchCardWin;
  onReveal: () => void;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({ win, onReveal }) => {
  const [scratchPercentage, setScratchPercentage] = useState(win.scratch_percentage || 0);
  const [showReveal, setShowReveal] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const config = RARITY_CONFIG[win.rarity];
  const isRevealed = win.scratch_revealed_at !== null || scratchPercentage >= 70;

  const handleScratch = async (percentage: number) => {
    setScratchPercentage(percentage);

    // Update percentage in database
    if (percentage >= 10 && percentage < 70) {
      try {
        await supabase
          .from('lottery_wins')
          .update({ scratch_percentage: percentage })
          .eq('id', win.win_id);
      } catch (error) {
        console.error('Error updating scratch percentage:', error);
      }
    }
  };

  const handleComplete = async () => {
    if (isRevealing) return;
    
    setIsRevealing(true);
    setShowReveal(true);

    try {
      // Mark as revealed
      const { error } = await supabase
        .from('lottery_wins')
        .update({ 
          scratch_revealed_at: new Date().toISOString(),
          scratch_percentage: 100
        })
        .eq('id', win.win_id);

      if (error) throw error;

      // If cash prize, credit wallet
      if (win.reward_type === 'cash') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Get or create wallet
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (wallet) {
          const currentBalance = parseFloat(wallet.balance.toString());
          const newBalance = currentBalance + win.value;
          
          await supabase
            .from('user_wallets')
            .update({ 
              balance: newBalance
            })
            .eq('user_id', user.id);

          // Record transaction
          await supabase
            .from('wallet_transactions')
            .insert({
              wallet_id: wallet.id,
              user_id: user.id,
              transaction_type: 'credit',
              amount: win.value,
              currency: win.currency,
              description: `Gain tombola: ${win.name}`,
              balance_before: currentBalance,
              balance_after: newBalance,
              status: 'completed'
            });
        }
      }

      toast.success(`Vous avez gagné ${win.name} !`);
    } catch (error) {
      console.error('Error revealing prize:', error);
      toast.error('Erreur lors de la révélation du prix');
    }
  };

  const handleAnimationComplete = () => {
    setShowReveal(false);
    setIsRevealing(false);
    onReveal();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className="overflow-hidden border-2 relative"
          style={{ 
            borderColor: config.color,
            boxShadow: `0 0 20px ${config.glowColor}`
          }}
        >
          <CardContent className="p-0 relative aspect-[3/2]">
            {!isRevealed ? (
              <>
                {/* Scratch surface */}
                <div className="absolute inset-0 z-10">
                  <ScratchCardCanvas
                    width={400}
                    height={267}
                    rarity={win.rarity}
                    onScratch={handleScratch}
                    onComplete={handleComplete}
                    disabled={isRevealing}
                  />
                </div>

                {/* Prize behind */}
                <div 
                  className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${config.bgGradient} p-6`}
                >
                  <Badge 
                    variant="outline"
                    className="mb-4"
                    style={{ 
                      borderColor: config.color,
                      color: config.color
                    }}
                  >
                    {config.label}
                  </Badge>
                  <div className="text-6xl mb-4">
                    {win.image_url || '🎁'}
                  </div>
                  <h3 className="text-2xl font-bold text-center" style={{ color: config.color }}>
                    {win.name}
                  </h3>
                  <p className="text-lg text-muted-foreground mt-2">
                    {win.reward_type === 'cash' ? `${win.value} ${win.currency}` :
                     win.reward_type === 'points' ? `${win.value} points` :
                     'Cadeau'}
                  </p>
                </div>

                {/* Progress indicator */}
                {scratchPercentage > 0 && scratchPercentage < 70 && (
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-center">
                      {Math.round(scratchPercentage)}% gratté
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Revealed state */
              <div 
                className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${config.bgGradient} p-6`}
              >
                <Badge 
                  variant="outline"
                  className="mb-4"
                  style={{ 
                    borderColor: config.color,
                    color: config.color
                  }}
                >
                  {config.label} - Révélé ✓
                </Badge>
                <div className="text-6xl mb-4">
                  {win.image_url || '🎁'}
                </div>
                <h3 className="text-2xl font-bold text-center mb-2" style={{ color: config.color }}>
                  {win.name}
                </h3>
                <p className="text-lg text-muted-foreground">
                  {win.reward_type === 'cash' ? `${win.value} ${win.currency}` :
                   win.reward_type === 'points' ? `${win.value} points` :
                   'Cadeau physique'}
                </p>
                {win.reward_type === 'cash' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Crédité dans votre portefeuille
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <PrizeRevealAnimation
        show={showReveal}
        prize={win}
        onComplete={handleAnimationComplete}
      />
    </>
  );
};
