import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Minus, AlertCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import PriceSliderVisual from './PriceSliderVisual';
import EconomyBadge from './EconomyBadge';
import PricePresets from './PricePresets';
import confetti from 'canvas-confetti';

interface ClientBiddingInterfaceProps {
  estimatedPrice: number;
  currency: 'CDF' | 'XOF';
  onProposalSubmit: (proposedPrice: number) => void;
  onCancel: () => void;
  minPercentage?: number; // Default: 50%
  maxPercentage?: number; // Default: 150%
  increment?: number; // Default: 100 CDF ou 10 XOF
}

export default function ClientBiddingInterface({
  estimatedPrice,
  currency,
  onProposalSubmit,
  onCancel,
  minPercentage = 50,
  maxPercentage = 150,
  increment = currency === 'CDF' ? 100 : 10
}: ClientBiddingInterfaceProps) {
  const minPrice = Math.floor((estimatedPrice * minPercentage) / 100);
  const maxPrice = Math.ceil((estimatedPrice * maxPercentage) / 100);
  
  // Initialiser à 80% du prix estimé (économie de 20%)
  const [proposedPrice, setProposedPrice] = useState(
    Math.floor((estimatedPrice * 80) / 100)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousSavings, setPreviousSavings] = useState(0);

  const { triggerHaptic } = useHapticFeedback();

  const savings = estimatedPrice - proposedPrice;
  const savingsPercentage = ((savings / estimatedPrice) * 100);
  const isEconomy = savings > 0;
  const isOverpaying = savings < 0;

  // Trigger confetti on large savings
  useEffect(() => {
    if (savingsPercentage >= 30 && previousSavings < 30) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#22c55e', '#4ade80']
      });
    }
    setPreviousSavings(savingsPercentage);
  }, [savingsPercentage, previousSavings]);

  const handleIncrement = () => {
    setProposedPrice(prev => Math.min(prev + increment, maxPrice));
    triggerHaptic('light');
  };

  const handleDecrement = () => {
    setProposedPrice(prev => Math.max(prev - increment, minPrice));
    triggerHaptic('light');
  };

  const handleSelectPreset = (price: number) => {
    setProposedPrice(price);
    triggerHaptic('medium');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    triggerHaptic('heavy');
    await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay for feedback
    onProposalSubmit(proposedPrice);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="space-y-6"
    >
      {/* Header avec prix Kwenda */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card text-center p-5 rounded-2xl border border-border/50 shadow-lg"
      >
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
          Prix estimé Kwenda
        </p>
        <div className="flex items-center justify-center gap-2">
          <motion.p 
            className="text-3xl sm:text-4xl font-black text-foreground"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {estimatedPrice.toLocaleString()}
          </motion.p>
          <span className="text-lg text-muted-foreground font-semibold">{currency}</span>
        </div>
        {isEconomy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold"
          >
            ⚡ Tarif officiel
          </motion.div>
        )}
      </motion.div>

      {/* Price Presets */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <PricePresets
          estimatedPrice={estimatedPrice}
          currentPrice={proposedPrice}
          onSelectPreset={handleSelectPreset}
          minPrice={minPrice}
          maxPrice={maxPrice}
          currency={currency}
        />
      </motion.div>

      {/* Prix proposé avec contrôles +/- */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm font-semibold text-center text-foreground">
          Ajustez votre offre
        </p>
        
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {/* Bouton - amélioré */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 shadow-lg transition-all duration-300",
                "hover:shadow-glow-green hover:border-green-500/50",
                "active:shadow-none disabled:opacity-40"
              )}
              onClick={handleDecrement}
              disabled={proposedPrice <= minPrice}
            >
              <Minus className="h-6 w-6" />
            </Button>
          </motion.div>

          {/* Prix proposé avec glassmorphism */}
          <AnimatePresence mode="wait">
            <motion.div
              key={proposedPrice}
              initial={{ scale: 1.15, rotateY: 10, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={cn(
                "glass-card relative px-6 py-5 sm:px-8 sm:py-6 rounded-3xl border-2 min-w-[180px] sm:min-w-[220px] text-center shadow-2xl",
                isEconomy && "gradient-border-animated border-green-500/40 shadow-glow-green",
                isOverpaying && "border-red-500/40 shadow-glow-red",
                !isEconomy && !isOverpaying && "border-primary/40"
              )}
            >
              <motion.p 
                className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {proposedPrice.toLocaleString()}
              </motion.p>
              <p className="text-sm sm:text-base text-muted-foreground font-semibold mt-1">
                {currency}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Bouton + amélioré */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 shadow-lg transition-all duration-300",
                "hover:shadow-glow-red hover:border-red-500/50",
                "active:shadow-none disabled:opacity-40"
              )}
              onClick={handleIncrement}
              disabled={proposedPrice >= maxPrice}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Slider visuel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <PriceSliderVisual
          currentPrice={proposedPrice}
          minPrice={minPrice}
          maxPrice={maxPrice}
          estimatedPrice={estimatedPrice}
          currency={currency}
        />
      </motion.div>

      {/* Badge économies */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <EconomyBadge
          savings={savings}
          savingsPercentage={savingsPercentage}
          currency={currency}
          isEconomy={isEconomy}
          isOverpaying={isOverpaying}
        />
      </motion.div>

      {/* Info chauffeurs */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl"
      >
        <div className="relative">
          <Users className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            ~12 chauffeurs près de vous
          </p>
          <p className="text-xs text-muted-foreground">
            Les chauffeurs recevront votre offre. Ils peuvent l'accepter directement ou proposer un prix légèrement supérieur.
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div 
        className="flex gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 border-2"
        >
          Annuler
        </Button>
        <motion.div 
          className="flex-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary via-primary-glow to-primary shadow-glow hover:shadow-xl transition-all duration-300"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                />
                <span className="ml-2">Notification...</span>
              </>
            ) : (
              <>
                🎯 Lancer l'enchère
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>

      {/* Plage acceptable */}
      <motion.p 
        className="text-xs text-center text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Plage acceptée : {minPrice.toLocaleString()} - {maxPrice.toLocaleString()} {currency}
      </motion.p>
    </motion.div>
  );
}
