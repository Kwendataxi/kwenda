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
      <label className="text-sm font-semibold text-zinc-100 drop-shadow-md uppercase tracking-wide">
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
              "relative px-4 py-4 sm:py-5 rounded-2xl font-extrabold text-base sm:text-lg",
              "transition-all duration-200",
              selectedAmount === amount
                ? "bg-gradient-to-br from-rose-500 to-orange-500 border-2 border-white text-white shadow-2xl shadow-rose-500/50 ring-4 ring-white/20"
                : "bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:border-white/50 hover:bg-white/15 shadow-xl"
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
            <span className="relative z-10 flex flex-col items-center gap-0.5">
              <span className="text-[10px] opacity-70 font-normal">CDF</span>
              <span>{amount.toLocaleString('fr-CD')}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
