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
          "w-full h-14 rounded-xl font-bold text-base relative overflow-hidden",
          "bg-gradient-to-r from-primary via-primary-light to-primary",
          "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
          "transition-all duration-300",
          className
        )}
      >
        {/* Animated background shimmer */}
        {!isDisabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Progress bar */}
        {isProcessing && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-white/50"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2 }}
          />
        )}

        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isProcessing || loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Traitement en cours...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Recharger maintenant</span>
            </>
          )}
        </span>

        {/* Ripple effect */}
        {!isDisabled && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            initial={{ scale: 0, opacity: 0.5 }}
            whileTap={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </Button>
    </motion.div>
  );
};
