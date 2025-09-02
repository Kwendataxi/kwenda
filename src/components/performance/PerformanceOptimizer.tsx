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

    // Appliquer les optimisations activées
    if (optimizations.reducedAnimations) {
      body.classList.add('reduce-animations');
    }

    if (isSlowConnection || optimizations.compressedImages) {
      body.classList.add('low-bandwidth', 'compressed-layout');
    }

    if (isLowBattery) {
      body.classList.add('battery-saving');
    }

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