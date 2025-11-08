/**
 * Service de mise à jour automatique
 * Détecte les nouvelles versions et force leur installation
 */

import { logger } from '@/utils/logger';
import { cacheWiper } from './CacheWiper';
import { toast } from '@/hooks/use-toast';

interface VersionInfo {
  version: string;
  buildDate: string;
  forceUpdate?: boolean;
  minVersion?: string;
}

class AutoUpdateService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;
  private registration: ServiceWorkerRegistration | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly VERSION_CHECK_URL = '/version.json';

  /**
   * Initialise le service de mise à jour automatique
   */
  initialize(): void {
    logger.info('🚀 Initializing AutoUpdateService');

    // Obtenir la registration du Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        this.registration = reg;
        logger.info('Service Worker ready');
      });
    }

    // Vérification initiale après 10 secondes
    setTimeout(() => this.checkAndInstallIfNeeded(), 10000);

    // Vérification au focus de la fenêtre
    window.addEventListener('focus', () => this.onWindowFocus());

    // Vérification au retour de visibilité
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());

    // Polling toutes les 5 minutes
    this.startPeriodicCheck();

    logger.info('✅ AutoUpdateService initialized');
  }

  /**
   * Démarre la vérification périodique
   */
  private startPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkAndInstallIfNeeded();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Gère le focus de la fenêtre
   */
  private onWindowFocus(): void {
    logger.info('Window focused, checking for updates');
    this.checkAndInstallIfNeeded();
  }

  /**
   * Gère le changement de visibilité
   */
  private onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      logger.info('App visible, checking for updates');
      this.checkAndInstallIfNeeded();
    }
  }

  /**
   * Vérifie et installe automatiquement si nouvelle version
   */
  async checkAndInstallIfNeeded(): Promise<void> {
    if (this.isChecking) {
      logger.info('Update check already in progress');
      return;
    }

    try {
      this.isChecking = true;
      const hasNewVersion = await this.checkForNewVersion();

      if (hasNewVersion) {
        logger.info('🎉 New version detected, installing automatically');
        await this.installUpdateAutomatically();
      }
    } catch (error) {
      logger.error('Update check failed', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Vérifie s'il y a une nouvelle version
   */
  private async checkForNewVersion(): Promise<boolean> {
    try {
      // Fetch le fichier version.json avec cache-bust
      const response = await fetch(`${this.VERSION_CHECK_URL}?t=${Date.now()}`);
      
      if (!response.ok) {
        logger.warn('Failed to fetch version.json');
        return false;
      }

      const versionInfo: VersionInfo = await response.json();
      const currentVersion = this.getCurrentVersion();

      logger.info('Version check:', {
        current: currentVersion,
        latest: versionInfo.version,
        forceUpdate: versionInfo.forceUpdate
      });

      // Comparer les versions
      if (versionInfo.version !== currentVersion) {
        logger.info('🆕 New version available:', versionInfo.version);
        return true;
      }

      // Vérifier si mise à jour forcée
      if (versionInfo.forceUpdate) {
        logger.warn('🔴 Force update required');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Version check failed', error);
      return false;
    }
  }

  /**
   * Récupère la version actuelle de l'application
   */
  private getCurrentVersion(): string {
    // Essayer depuis le package.json injecté
    try {
      if (typeof (globalThis as any).__APP_VERSION__ !== 'undefined') {
        return (globalThis as any).__APP_VERSION__;
      }
    } catch {
      // Ignore
    }

    // Fallback sur localStorage
    return localStorage.getItem('app_version') || '1.0.0';
  }

  /**
   * Installe automatiquement la mise à jour
   */
  async installUpdateAutomatically(): Promise<void> {
    try {
      // 1. Notification discrète (toast non-bloquant)
      toast({
        title: '🚀 Mise à jour en cours',
        description: 'Installation dans 3 secondes...',
        duration: 3000
      });

      logger.info('⏳ Waiting 2 seconds before update');
      
      // 2. Attendre 2 secondes (laisser finir les actions en cours)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Vider TOUS les caches
      logger.info('🗑️ Wiping all caches');
      await cacheWiper.wipeAllCaches();

      // 4. Activer le nouveau Service Worker
      if (this.registration?.waiting) {
        logger.info('📦 Activating new Service Worker');
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // 5. Attendre un peu pour que le SW soit activé
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 6. Recharger la page (hard reload)
      logger.info('🔄 Reloading application');
      window.location.reload();
    } catch (error) {
      logger.error('❌ Auto-update installation failed', error);
      
      // Fallback: recharger quand même
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const autoUpdateService = new AutoUpdateService();
