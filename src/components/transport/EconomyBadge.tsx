import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EconomyBadgeProps {
  savings: number;
  savingsPercentage: number;
  currency: 'CDF' | 'XOF';
  isEconomy: boolean;
  isOverpaying: boolean;
}

export default function EconomyBadge({
  savings,
  savingsPercentage,
  currency,
  isEconomy,
  isOverpaying
}: EconomyBadgeProps) {
  const absPercentage = Math.abs(parseFloat(savingsPercentage.toFixed(1)));
  
  // Determine message and icon based on savings
  let message = '';
  let Icon = TrendingDown;
  let colorClass = '';
  let bgClass = '';
  
  if (isEconomy) {
    if (absPercentage >= 30) {
      message = '🎉 Super économie !';
      Icon = Sparkles;
      colorClass = 'text-green-600 dark:text-green-400';
      bgClass = 'bg-green-500/10 border-green-500/30';
    } else if (absPercentage >= 15) {
      message = '💚 Belle économie';
      Icon = TrendingDown;
      colorClass = 'text-green-600 dark:text-green-400';
      bgClass = 'bg-green-500/10 border-green-500/30';
    } else {
      message = '💰 Économie légère';
      Icon = TrendingDown;
      colorClass = 'text-emerald-600 dark:text-emerald-400';
      bgClass = 'bg-emerald-500/10 border-emerald-500/30';
    }
  } else if (isOverpaying) {
    message = 'Au-dessus du prix Kwenda';
    Icon = TrendingUp;
    colorClass = 'text-red-600 dark:text-red-400';
    bgClass = 'bg-red-500/10 border-red-500/30';
  } else {
    message = 'Prix égal à Kwenda';
    colorClass = 'text-primary';
    bgClass = 'bg-primary/10 border-primary/30';
  }

  // Circular progress for large savings
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(absPercentage, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'glass-card p-4 rounded-2xl border-2 transition-all duration-300',
        bgClass
      )}
    >
      <div className="flex items-center gap-4">
        {/* Circular progress */}
        {isEconomy && absPercentage >= 10 && (
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted/20"
              />
              <motion.circle
                cx="40"
                cy="40"
                r={radius}
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                className={colorClass}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  strokeDasharray: circumference,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={cn('text-xl font-black', colorClass)}>
                  -{absPercentage}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message and amount */}
        <div className="flex-1">
          <div className={cn('flex items-center gap-2 mb-1', colorClass)}>
            <Icon className="w-5 h-5" />
            <p className="text-sm font-semibold">
              {message}
            </p>
          </div>
          <p className={cn('text-lg font-bold', colorClass)}>
            {isEconomy ? '-' : '+'}{Math.abs(savings).toLocaleString()} {currency}
          </p>
          {!isEconomy && !isOverpaying && (
            <p className="text-xs text-muted-foreground mt-1">
              Vous acceptez le tarif officiel
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
