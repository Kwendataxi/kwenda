import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationController } from '@/services/AnimationController';

interface SmoothTransitionWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  loadingComponent: ReactNode;
  onTransitionComplete?: () => void;
}

/**
 * ⚡ WRAPPER DE TRANSITION INVISIBLE
 * Crossfade parfait sans délai ni flash blanc
 * Optimisé pour transitions instantanées
 */
export const SmoothTransitionWrapper = ({
  children,
  isLoading,
  loadingComponent,
  onTransitionComplete,
}: SmoothTransitionWrapperProps) => {
  const animConfig = AnimationController.getRecommendedConfig();

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="popLayout" onExitComplete={onTransitionComplete}>
        {/* Loading overlay - disparaît en fondu */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.2,
              ease: "easeOut"
            }}
            className="absolute inset-0 z-50"
            style={{ 
              willChange: 'opacity',
              transform: 'translateZ(0)'
            }}
          >
            {loadingComponent}
          </motion.div>
        )}

        {/* Content - apparaît immédiatement sans délai */}
        {!isLoading && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: animConfig.duration / 1000,
              ease: "easeOut"
            }}
            className="w-full h-full"
            style={{ 
              willChange: 'opacity',
              transform: 'translateZ(0)'
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
