/**
 * 🧹 MEMORY PRESSURE MANAGER - LAYER 2: GESTION PROACTIVE DE LA MÉMOIRE
 * Nettoie automatiquement la mémoire avant saturation
 */

import { clearRouteCache } from '@/utils/performanceUtils';

export class MemoryPressureManager {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastCleanup = 0;
  private cleanupThreshold = 80; // Pourcentage
  private criticalThreshold = 90;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Vérification toutes les 30 secondes
    this.cleanupInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 30000);
  }

  private async checkMemoryPressure() {
    const usage = this.getMemoryUsage();
    
    if (usage === null) return;

    if (usage > this.criticalThreshold) {
      console.warn('🚨 [MemoryPressureManager] CRITIQUE:', usage.toFixed(1) + '%');
      await this.performAggressiveCleanup();
    } else if (usage > this.cleanupThreshold) {
      console.warn('⚠️ [MemoryPressureManager] Pression mémoire:', usage.toFixed(1) + '%');
      await this.performStandardCleanup();
    }
  }

  public getMemoryUsage(): number | null {
    if ('memory' in performance && (performance as any).memory) {
      const mem = (performance as any).memory;
      return (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
    }
    return null;
  }

  private async performStandardCleanup() {
    const now = Date.now();
    
    // Éviter les cleanups trop fréquents (max 1 par minute)
    if (now - this.lastCleanup < 60000) return;
    
    console.log('🧹 [MemoryPressureManager] Nettoyage standard...');
    
    // 1. Vider les caches non-critiques
    clearRouteCache();
    
    // 2. Nettoyer localStorage des données temporaires
    this.cleanTemporaryStorage();
    
    // 3. Nettoyer les images en cache
    this.cleanImageCache();
    
    this.lastCleanup = now;
    
    console.log('✅ [MemoryPressureManager] Nettoyage terminé');
  }

  private async performAggressiveCleanup() {
    console.log('🚨 [MemoryPressureManager] Nettoyage agressif...');
    
    // 1. Tout le nettoyage standard
    await this.performStandardCleanup();
    
    // 2. Forcer garbage collection si disponible
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.log('♻️ Garbage collection forcé');
      } catch (error) {
        // Ignoré si non disponible
      }
    }
    
    // 3. Unmount des composants cachés si trop de mémoire
    this.triggerComponentCleanup();
    
    // 4. Si toujours critique, alerter l'utilisateur
    setTimeout(() => {
      const usage = this.getMemoryUsage();
      if (usage && usage > 95) {
        console.error('🔴 Mémoire saturée, redémarrage recommandé');
        this.notifyCriticalMemory();
      }
    }, 2000);
  }

  private cleanTemporaryStorage() {
    try {
      // Nettoyer les entrées temporaires du localStorage
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('temp_') ||
          key.startsWith('cache_') ||
          key.includes('_old_') ||
          key.includes('_backup_')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          // Ignoré
        }
      });
      
      if (keysToRemove.length > 0) {
        console.log(`🗑️ ${keysToRemove.length} entrées temporaires supprimées`);
      }
    } catch (error) {
      console.error('Erreur nettoyage localStorage:', error);
    }
  }

  private cleanImageCache() {
    try {
      // Réduire la qualité des images chargées
      const images = document.querySelectorAll('img[src]');
      let cleaned = 0;
      
      images.forEach((img: any) => {
        // Libérer les src data: très lourdes
        if (img.src && img.src.startsWith('data:')) {
          if (!img.dataset.critical) {
            img.src = '/placeholder.svg';
            cleaned++;
          }
        }
      });
      
      if (cleaned > 0) {
        console.log(`🖼️ ${cleaned} images nettoyées`);
      }
    } catch (error) {
      console.error('Erreur nettoyage images:', error);
    }
  }

  private triggerComponentCleanup() {
    // Émettre un événement global pour les composants
    window.dispatchEvent(new CustomEvent('memory-pressure', {
      detail: { level: 'high', action: 'cleanup' }
    }));
  }

  private notifyCriticalMemory() {
    // Émettre un événement pour afficher une notification
    window.dispatchEvent(new CustomEvent('memory-critical', {
      detail: { 
        message: 'Mémoire critique détectée',
        action: 'reload-recommended'
      }
    }));
  }

  public forceCleanup() {
    return this.performAggressiveCleanup();
  }

  public cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Instance singleton
export const memoryPressureManager = new MemoryPressureManager();
