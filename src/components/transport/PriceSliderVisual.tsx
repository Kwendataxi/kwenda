import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PriceSliderVisualProps {
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  estimatedPrice: number;
  currency: 'CDF' | 'XOF';
}

export default function PriceSliderVisual({
  currentPrice,
  minPrice,
  maxPrice,
  estimatedPrice,
  currency
}: PriceSliderVisualProps) {
  const percentage = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;
  const estimatedPercentage = ((estimatedPrice - minPrice) / (maxPrice - minPrice)) * 100;

  return (
    <div className="space-y-2">
      {/* Slider bar */}
      <div className="relative h-3 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-full overflow-hidden">
        {/* Progress fill with gradient */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        {/* Estimated price marker (Kwenda price) */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-full shadow-glow z-10"
          style={{ left: `${estimatedPercentage}%` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-primary">
            Kwenda
          </div>
        </motion.div>

        {/* Current position thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-foreground rounded-full shadow-xl border-4 border-background z-20"
          style={{ left: `${percentage}%` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <div className="text-left">
          <div className="font-semibold">Min</div>
          <div>{minPrice.toLocaleString()} {currency}</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-primary">Kwenda</div>
          <div className="text-primary">{estimatedPrice.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">Max</div>
          <div>{maxPrice.toLocaleString()} {currency}</div>
        </div>
      </div>
    </div>
  );
}
