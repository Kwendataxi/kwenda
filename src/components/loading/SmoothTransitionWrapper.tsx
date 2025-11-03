import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationController } from '@/services/AnimationController';

interface SmoothTransitionWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  loadingComponent: ReactNode;
  onTransitionComplete?: () => void;
}

/**
 * Wrapper pour créer une transition fluide entre splash/loading et contenu
 * Utilise un crossfade sans white flash
 */
export const SmoothTransitionWrapper = ({
  children,
  isLoading,
  loadingComponent,
  onTransitionComplete,
}: SmoothTransitionWrapperProps) => {
  const [showContent, setShowContent] = useState(!isLoading);
  const animConfig = AnimationController.getRecommendedConfig();

  useEffect(() => {
    if (!isLoading) {
      // Petit délai pour éviter le flash
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 50);

      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLoading]);

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="sync">
        {/* Loading overlay */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: animConfig.duration / 1000,
              ease: "easeOut"
            }}
            className="absolute inset-0 z-50"
            onAnimationComplete={() => {
              if (!isLoading && onTransitionComplete) {
                onTransitionComplete();
              }
            }}
          >
            {loadingComponent}
          </motion.div>
        )}

        {/* Content */}
        {showContent && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: animConfig.duration / 1000,
              ease: "easeOut",
              delay: 0.1 // Léger délai pour éviter le chevauchement
            }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
