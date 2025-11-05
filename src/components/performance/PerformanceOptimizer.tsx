/**
 * Composant d'optimisation des performances
 * Applique automatiquement les optimisations selon les conditions détectées
 */

import React, { useEffect } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface PerformanceOptimizerProps {
  children?: React.ReactNode;
}

export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({ children }) => {
  // ✅ PHASE 3B: Ne rien faire en production (pas d'overhead)
  const IS_PRODUCTION = import.meta.env.PROD;
  
  if (IS_PRODUCTION) {
    return <>{children}</>;
  }
  
  const { 
    optimizations, 
    metrics,
    isSlowConnection,
    isOffline,
    isLowMemory,
    isLowBattery
  } = usePerformanceMonitor();

  useEffect(() => {
    // Appliquer les classes CSS d'optimisation au body
    const body = document.body;
    
    // Supprimer toutes les classes d'optimisation existantes
    body.classList.remove(
      'reduce-animations',
      'low-bandwidth', 
      'battery-saving',
      'memory-efficient',
      'compressed-layout'
    );

    // Appliquer les optimisations UNIQUEMENT en cas de conditions extrêmes
    // Ne pas appliquer reduce-animations par défaut pour préserver le dynamisme
    if (optimizations.reducedAnimations && (isLowMemory || isLowBattery)) {
      body.classList.add('reduce-animations');
    }

    // Low bandwidth seulement si vraiment nécessaire
    if (isSlowConnection && optimizations.compressedImages) {
      body.classList.add('low-bandwidth', 'compressed-layout');
    }

    // Battery saving uniquement si batterie critique
    if (isLowBattery) {
      body.classList.add('battery-saving');
    }

    // Memory efficient uniquement si mémoire critique
    if (isLowMemory) {
      body.classList.add('memory-efficient');
    }

    // Cleanup à la destruction du composant
    return () => {
      body.classList.remove(
        'reduce-animations',
        'low-bandwidth',
        'battery-saving', 
        'memory-efficient',
        'compressed-layout'
      );
    };
  }, [optimizations, isSlowConnection, isLowBattery, isLowMemory]);

  // Configurer les images pour les connexions lentes
  useEffect(() => {
    if (isSlowConnection || optimizations.compressedImages) {
      // Réduire la qualité des images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.dataset.originalSrc) {
          img.dataset.originalSrc = img.src;
        }
        img.classList.add('optimized-image');
      });
    }
  }, [isSlowConnection, optimizations.compressedImages]);

  // Configurer le lazy loading agressif pour les performances
  useEffect(() => {
    if (optimizations.lazyLoading && 'IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src!;
            img.classList.remove('lazy-placeholder');
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      lazyImages.forEach(img => imageObserver.observe(img));

      return () => {
        lazyImages.forEach(img => imageObserver.unobserve(img));
      };
    }
  }, [optimizations.lazyLoading]);

  return (
    <div className={`performance-optimized ${
      metrics.connectionSpeed === 'slow' ? 'slow-connection' : ''
    } ${
      isOffline ? 'offline-mode' : ''
    }`}>
      {children}
    </div>
  );
};

export default PerformanceOptimizer;