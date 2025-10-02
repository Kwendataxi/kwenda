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
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/90">Montants rapides</label>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {amounts.map((amount, index) => (
          <motion.button
            key={amount}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(amount)}
            className={cn(
              "relative px-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
              "border-2 backdrop-blur-sm",
              selectedAmount === amount
                ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20"
                : "bg-muted/50 border-border/50 text-foreground/70 hover:border-primary/50 hover:bg-muted"
            )}
          >
            {selectedAmount === amount && (
              <motion.div
                layoutId="quickAmountHighlight"
                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl"
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
