import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface AnimatedAddToCartButtonProps {
  onAdd: () => void;
  isAvailable: boolean;
  isInCart?: boolean;
  className?: string;
}

type ButtonState = 'default' | 'adding' | 'added';

export const AnimatedAddToCartButton: React.FC<AnimatedAddToCartButtonProps> = ({
  onAdd,
  isAvailable,
  isInCart = false,
  className
}) => {
  const [state, setState] = useState<ButtonState>('default');
  const [showRipple, setShowRipple] = useState(false);
  const { triggerSuccess } = useHapticFeedback();

  // Reset après 3 secondes
  useEffect(() => {
    if (state === 'added') {
      const timer = setTimeout(() => {
        setState('default');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAvailable || state === 'adding') return;

    // Vibration haptique
    triggerSuccess();

    // Ripple effect
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);

    // Séquence d'états
    setState('adding');
    
    setTimeout(() => {
      onAdd();
      setState('added');
    }, 300);
  };

  const getButtonContent = () => {
    switch (state) {
      case 'adding':
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 360 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1.5"
          >
            <ShoppingCart className="h-3 w-3" />
            <span>Ajout...</span>
          </motion.div>
        );
      
      case 'added':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="flex items-center gap-1.5"
          >
            <Check className="h-3 w-3" />
            <span>Ajouté !</span>
          </motion.div>
        );
      
      default:
        return (
          <div className="flex items-center gap-1.5">
            <ShoppingCart className="h-3 w-3" />
            <span>Acheter</span>
          </div>
        );
    }
  };

  return (
    <motion.div className="relative flex-1">
      {/* Ripple effect */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-md pointer-events-none"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Button */}
      <Button
        size="sm"
        disabled={!isAvailable}
        onClick={handleClick}
        className={cn(
          "h-8 text-xs w-full relative overflow-hidden transition-all duration-300",
          state === 'added' && "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800",
          className
        )}
      >
        <motion.div
          animate={{
            scale: state === 'adding' ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {getButtonContent()}
        </motion.div>

        {/* Pulse animation quand "added" */}
        {state === 'added' && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ 
              scale: [1, 1.5, 1.5],
              opacity: [0.5, 0, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: 1,
              ease: "easeOut"
            }}
            className="absolute inset-0 bg-green-400 rounded-md pointer-events-none"
          />
        )}
      </Button>

      {/* Particules à l'ajout */}
      <AnimatePresence>
        {state === 'added' && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 1,
                  opacity: 1 
                }}
                animate={{ 
                  x: Math.cos((i * Math.PI * 2) / 6) * 30,
                  y: Math.sin((i * Math.PI * 2) / 6) * 30,
                  scale: 0,
                  opacity: 0
                }}
                transition={{ 
                  duration: 0.6,
                  ease: "easeOut"
                }}
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
                style={{
                  background: `linear-gradient(45deg, hsl(var(--primary)), hsl(var(--orange-500)))`,
                  boxShadow: '0 0 8px hsl(var(--primary) / 0.5)'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
