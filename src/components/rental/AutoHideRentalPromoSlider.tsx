import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { RentalPromoSlider } from './RentalPromoSlider';
import { Button } from '@/components/ui/button';

export const AutoHideRentalPromoSlider = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Auto-hide après 6 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, []);

  // Dismiss manuel
  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  // Réafficher
  const handleReshow = () => {
    setIsVisible(true);
    setIsDismissed(false);
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 1, height: 'auto', marginBottom: '1.5rem' }}
            exit={{ 
              opacity: 0, 
              height: 0,
              marginBottom: 0,
              paddingTop: 0,
              paddingBottom: 0,
              transition: { 
                duration: 0.5,
                ease: "easeInOut" 
              }
            }}
            className="relative"
          >
            <RentalPromoSlider />
            
            {/* Bouton X pour fermer manuellement */}
            <button 
              onClick={handleDismiss}
              className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 z-20 transition-all duration-200 hover:scale-110"
              aria-label="Fermer les promotions"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton de réaffichage */}
      {!isVisible && !isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReshow}
            className="w-full bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/30"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Voir les promotions
          </Button>
        </motion.div>
      )}
    </>
  );
};
