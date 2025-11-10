import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Minus, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const handleIncrement = () => {
    setProposedPrice(prev => Math.min(prev + increment, maxPrice));
  };

  const handleDecrement = () => {
    setProposedPrice(prev => Math.max(prev - increment, minPrice));
  };

  const savings = estimatedPrice - proposedPrice;
  const savingsPercentage = ((savings / estimatedPrice) * 100).toFixed(1);
  const isEconomy = savings > 0;
  const isOverpaying = savings < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Prix estimé Kwenda */}
      <div className="text-center p-4 bg-muted/30 rounded-xl">
        <p className="text-sm text-muted-foreground mb-1">Prix estimé Kwenda</p>
        <p className="text-2xl font-bold text-foreground">
          {estimatedPrice.toLocaleString()} {currency}
        </p>
      </div>

      {/* Votre offre avec +/- */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-center text-foreground">
          Proposez votre prix
        </p>
        
        <div className="flex items-center justify-center gap-4">
          {/* Bouton - */}
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-2"
            onClick={handleDecrement}
            disabled={proposedPrice <= minPrice}
          >
            <Minus className="h-6 w-6" />
          </Button>

          {/* Prix proposé */}
          <motion.div
            key={proposedPrice}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className={cn(
              "px-6 py-4 rounded-2xl border-2 min-w-[200px] text-center",
              isEconomy && "bg-green-500/10 border-green-500/30",
              isOverpaying && "bg-red-500/10 border-red-500/30",
              !isEconomy && !isOverpaying && "bg-primary/10 border-primary/30"
            )}
          >
            <p className="text-3xl font-black text-foreground">
              {proposedPrice.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              {currency}
            </p>
          </motion.div>

          {/* Bouton + */}
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full border-2"
            onClick={handleIncrement}
            disabled={proposedPrice >= maxPrice}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Feedback économies/surcoût */}
        <motion.div
          key={`feedback-${savings}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {isEconomy ? (
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <TrendingDown className="w-5 h-5" />
              <p className="text-sm font-semibold">
                Vous économisez {Math.abs(savings).toLocaleString()} {currency} ({savingsPercentage}%)
              </p>
            </div>
          ) : isOverpaying ? (
            <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
              <TrendingUp className="w-5 h-5" />
              <p className="text-sm font-semibold">
                +{Math.abs(savings).toLocaleString()} {currency} au-dessus du prix Kwenda
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-primary">
              <p className="text-sm font-semibold">
                Prix égal à l'estimation Kwenda
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Les chauffeurs recevront votre offre. Ils peuvent l'accepter directement ou proposer un prix légèrement supérieur.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onCancel}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          size="lg"
          onClick={() => onProposalSubmit(proposedPrice)}
          className="flex-1 bg-gradient-to-r from-primary to-primary/90"
        >
          🎯 Lancer l'enchère
        </Button>
      </div>

      {/* Plage acceptable */}
      <p className="text-xs text-center text-muted-foreground">
        Plage acceptée : {minPrice.toLocaleString()} - {maxPrice.toLocaleString()} {currency}
      </p>
    </motion.div>
  );
}
