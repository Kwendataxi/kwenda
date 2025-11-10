import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PricePresetsProps {
  estimatedPrice: number;
  currentPrice: number;
  onSelectPreset: (price: number) => void;
  minPrice: number;
  maxPrice: number;
  currency: 'CDF' | 'XOF';
}

export default function PricePresets({
  estimatedPrice,
  currentPrice,
  onSelectPreset,
  minPrice,
  maxPrice,
  currency
}: PricePresetsProps) {
  const presets = [
    { label: '-30%', percentage: 70, emoji: '🎯' },
    { label: '-20%', percentage: 80, emoji: '💚' },
    { label: '-10%', percentage: 90, emoji: '💰' },
    { label: 'Kwenda', percentage: 100, emoji: '⚡' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground text-center">
        Raccourcis rapides
      </p>
      <div className="grid grid-cols-4 gap-2">
        {presets.map((preset) => {
          const price = Math.round((estimatedPrice * preset.percentage) / 100);
          const isActive = Math.abs(currentPrice - price) < 10;
          const isAvailable = price >= minPrice && price <= maxPrice;

          return (
            <motion.button
              key={preset.label}
              onClick={() => isAvailable && onSelectPreset(price)}
              disabled={!isAvailable}
              whileHover={isAvailable ? { scale: 1.05 } : {}}
              whileTap={isAvailable ? { scale: 0.95 } : {}}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 min-h-[70px]',
                isActive && isAvailable && 'bg-primary text-primary-foreground border-primary shadow-glow',
                !isActive && isAvailable && 'bg-card/50 border-border hover:border-primary/50 hover:bg-card',
                !isAvailable && 'opacity-40 cursor-not-allowed'
              )}
            >
              <span className="text-lg mb-1">{preset.emoji}</span>
              <span className="text-xs font-bold">{preset.label}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {price.toLocaleString()}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
