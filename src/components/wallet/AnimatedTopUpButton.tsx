import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedTopUpButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const AnimatedTopUpButton: React.FC<AnimatedTopUpButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  className
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    setIsProcessing(true);
    try {
      await onClick();
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = disabled || loading || isProcessing;

  return (
    <motion.div
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className="relative"
    >
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "w-full h-14 sm:h-16 rounded-2xl font-bold text-base sm:text-lg relative overflow-hidden",
          "bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500",
          "hover:from-rose-600 hover:via-orange-600 hover:to-amber-600",
          "text-white shadow-2xl shadow-orange-500/50 ring-2 ring-white/20",
          "hover:shadow-orange-500/70 hover:scale-[1.02]",
          "active:scale-[0.98]",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
          className
        )}
      >
        {/* Shimmer effect */}
        {!isDisabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: 'linear',
              repeatDelay: 0.5 
            }}
          />
        )}

        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading || isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Traitement...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Recharger maintenant</span>
            </>
          )}
        </span>
      </Button>
    </motion.div>
  );
};
