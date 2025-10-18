import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickAmountSelectorProps {
  amounts: number[];
  selectedAmount: number | null;
  onSelect: (amount: number) => void;
  currency?: string;
}

export const QuickAmountSelector: React.FC<QuickAmountSelectorProps> = ({
  amounts,
  selectedAmount,
  onSelect,
  currency = 'CDF'
}) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
        Montants rapides
      </label>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {amounts.map((amount, index) => (
          <motion.button
            key={amount}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(amount)}
            className={cn(
              "relative px-4 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg",
              "transition-all duration-200",
              selectedAmount === amount
                ? "bg-rose-500/20 border-2 border-rose-500/80 text-rose-400 shadow-lg shadow-rose-500/30 ring-2 ring-rose-500/20"
                : "bg-zinc-800/50 border-2 border-zinc-700/50 text-zinc-300 hover:border-zinc-600"
            )}
          >
            {selectedAmount === amount && (
              <motion.div
                layoutId="selectedBadge"
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full shadow-lg shadow-rose-500/50"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {amount.toLocaleString('fr-CD')}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
