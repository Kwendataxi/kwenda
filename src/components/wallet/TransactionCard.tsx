import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  date: string;
  status?: 'completed' | 'pending' | 'failed';
  index: number;
  compact?: boolean;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  type,
  amount,
  currency,
  description,
  date,
  status = 'completed',
  index,
  compact = false
}) => {
  const isCredit = type === 'credit';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className={cn(
        "flex items-center gap-4 transition-all duration-300",
        compact 
          ? "p-3 hover:bg-muted/50 dark:hover:bg-muted/30" 
          : "p-4 rounded-xl bg-card hover:bg-muted/50 dark:hover:bg-muted/30 border border-border/50 hover:border-border dark:border-border/30"
      )}>
        {/* Icon */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 360 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "rounded-xl flex items-center justify-center flex-shrink-0",
            compact ? "w-10 h-10" : "w-12 h-12",
            isCredit
              ? "bg-congo-green/10 text-congo-green dark:bg-congo-green/20 dark:text-congo-green-electric"
              : "bg-congo-red/10 text-congo-red dark:bg-congo-red/20 dark:text-congo-red-electric"
          )}
        >
          {isCredit ? (
            <ArrowDownLeft className={compact ? "w-4 h-4" : "w-5 h-5"} />
          ) : (
            <ArrowUpRight className={compact ? "w-4 h-4" : "w-5 h-5"} />
          )}
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground dark:text-foreground/90 truncate">
            {description}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground dark:text-muted-foreground/70" />
            <p className="text-xs text-muted-foreground dark:text-muted-foreground/70">
              {new Date(date).toLocaleString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {status === 'pending' && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium">
                En attente
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-right"
        >
          <p className={cn(
            "font-bold text-base",
            isCredit 
              ? "text-congo-green dark:text-congo-green-electric" 
              : "text-congo-red dark:text-congo-red-electric"
          )}>
            {isCredit ? '+' : '-'}
            {amount.toLocaleString('fr-CD')} {currency}
          </p>
        </motion.div>
      </div>

      {/* Hover line accent */}
      <motion.div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          isCredit ? "bg-congo-green" : "bg-congo-red"
        )}
        initial={{ scaleY: 0 }}
        whileHover={{ scaleY: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
};
