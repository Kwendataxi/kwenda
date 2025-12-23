import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface AnimatedAddToCartButtonProps {
  onAdd: () => void;
  isAvailable: boolean;
  isInCart?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

type ButtonState = 'default' | 'adding' | 'added';

export const AnimatedAddToCartButton: React.FC<AnimatedAddToCartButtonProps> = ({
  onAdd,
  isAvailable,
  isInCart = false,
  className,
  size = 'sm'
}) => {
  const [state, setState] = useState<ButtonState>('default');
  const [showRipple, setShowRipple] = useState(false);
  const { triggerSuccess } = useHapticFeedback();

  // Reset après 2.5 secondes (plus court)
  useEffect(() => {
    if (state === 'added') {
      const timer = setTimeout(() => {
        setState('default');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAvailable || state === 'adding') return;

    // Vibration haptique légère
    triggerSuccess();

    // Ripple effect soft
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 400);

    // Séquence d'états plus fluide
    setState('adding');
    
    setTimeout(() => {
      onAdd();
      setState('added');
    }, 400);
  };

  const getButtonContent = () => {
    switch (state) {
      case 'adding':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Ajout...</span>
          </motion.div>
        );
      
      case 'added':
        return (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 20
            }}
            className="flex items-center gap-1.5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.4, times: [0, 0.6, 1] }}
            >
              <Check className="h-3.5 w-3.5" />
            </motion.div>
            <span>Ajouté !</span>
          </motion.div>
        );
      
      default:
        return (
          <motion.div 
            className="flex items-center gap-1.5"
            whileHover={{ scale: 1.02 }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Acheter</span>
          </motion.div>
        );
    }
  };

  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-10 text-sm",
    lg: "h-12 text-base"
  };

  return (
    <motion.div 
      className="relative flex-1"
      whileHover={{ scale: state === 'default' ? 1.02 : 1 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Ripple effect soft */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 rounded-lg pointer-events-none z-0"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Button */}
      <Button
        size={size}
        disabled={!isAvailable}
        onClick={handleClick}
        className={cn(
          sizeClasses[size],
          "w-full relative overflow-hidden transition-all duration-300",
          state === 'added' && "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800",
          state === 'adding' && "bg-primary/80",
          className
        )}
      >
        {getButtonContent()}

        {/* Soft pulse animation quand "added" */}
        <AnimatePresence>
          {state === 'added' && (
            <motion.div
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ 
                scale: [1, 1.3],
                opacity: [0.3, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.6,
                ease: "easeOut"
              }}
              className="absolute inset-0 bg-green-400/50 rounded-lg pointer-events-none"
            />
          )}
        </AnimatePresence>
      </Button>

      {/* Particules légères (4 au lieu de 6) */}
      <AnimatePresence>
        {state === 'added' && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 1,
                  opacity: 0.8 
                }}
                animate={{ 
                  x: Math.cos((i * Math.PI * 2) / 4) * 25,
                  y: Math.sin((i * Math.PI * 2) / 4) * 25,
                  scale: 0,
                  opacity: 0
                }}
                transition={{ 
                  duration: 0.5,
                  ease: "easeOut"
                }}
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
                style={{
                  background: 'hsl(var(--primary))',
                  boxShadow: '0 0 6px hsl(var(--primary) / 0.4)'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
