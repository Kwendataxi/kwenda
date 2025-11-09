import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FoodServiceTransitionProps {
  children: ReactNode;
}

/**
 * 🎨 TRANSITION D'ENTRÉE ÉLÉGANTE POUR KWENDA FOOD
 * - Fade-in progressif avec blur pour effet "mise au point"
 * - Slide-up subtil pour plus de fluidité
 * - Courbe de Bézier personnalisée pour un mouvement naturel
 */
export const FoodServiceTransition = ({ children }: FoodServiceTransitionProps) => {
  // Respecter les préférences utilisateur
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 20, 
        filter: 'blur(10px)' 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)' 
      }}
      transition={{ 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1] // Courbe de Bézier douce (easeOutExpo-like)
      }}
      style={{
        willChange: 'opacity, transform, filter'
      }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
};
