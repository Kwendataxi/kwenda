import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TombolaHeaderProps {
  totalWinnings: number;
  currency?: string;
  className?: string;
}

export const TombolaHeader: React.FC<TombolaHeaderProps> = ({
  totalWinnings,
  currency = 'CDF',
  className
}) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600",
        "p-6 pb-8",
        className
      )}
    >
      {/* Clouds decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-2 left-4 w-16 h-8 bg-white/30 rounded-full blur-sm"
        />
        <motion.div
          animate={{ x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-6 right-8 w-20 h-10 bg-white/25 rounded-full blur-sm"
        />
        <motion.div
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 left-1/4 w-12 h-6 bg-white/20 rounded-full blur-sm"
        />
      </div>

      {/* Help button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Comment ça marche ?
            </h4>
            <ul className="text-xs space-y-1.5 text-muted-foreground">
              <li>🚗 Commandez des courses pour gagner des points</li>
              <li>📦 Faites des livraisons pour avancer</li>
              <li>🎁 À 100 points, débloquez une carte à gratter</li>
              <li>💰 Grattez pour découvrir votre gain !</li>
            </ul>
          </div>
        </PopoverContent>
      </Popover>

      {/* Title */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-white/90 text-sm font-medium text-center uppercase tracking-wide"
      >
        Gains déjà versés
      </motion.p>

      {/* Amount */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="text-center mt-2"
      >
        <span className="text-4xl font-bold text-white drop-shadow-lg">
          {formatAmount(totalWinnings)}
        </span>
        <span className="text-xl font-medium text-white/90 ml-1">
          {currency === 'XP' ? 'XP' : 'F'}
        </span>
      </motion.div>

      {/* Floating gift icons */}
      <motion.div
        animate={{ 
          y: [0, -5, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-2 left-6"
      >
        <span className="text-2xl opacity-80">🎁</span>
      </motion.div>
      <motion.div
        animate={{ 
          y: [0, -8, 0],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-4 right-6"
      >
        <span className="text-xl opacity-70">🎀</span>
      </motion.div>
    </motion.div>
  );
};
