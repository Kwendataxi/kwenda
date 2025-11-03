import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { logger } from '@/utils/logger';

export interface MobileUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  availableVersion?: string;
  immediateUpdateAllowed: boolean;
  flexibleUpdateAllowed: boolean;
  platform: 'ios' | 'android' | 'web';
}

class MobileUpdateService {
  private isNative = Capacitor.isNativePlatform();
  private platform = Capacitor.getPlatform();

  async checkForUpdate(): Promise<MobileUpdateInfo> {
    if (!this.isNative) {
      return {
        updateAvailable: false,
        currentVersion: '1.0.0',
        immediateUpdateAllowed: false,
        flexibleUpdateAllowed: false,
        platform: 'web'
      };
    }

    try {
      const result = await AppUpdate.getAppUpdateInfo();
      
      return {
        updateAvailable: result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE,
        currentVersion: result.currentVersionCode?.toString() || '1.0.0',
        availableVersion: result.availableVersionCode?.toString(),
        immediateUpdateAllowed: result.immediateUpdateAllowed ?? false,
        flexibleUpdateAllowed: result.flexibleUpdateAllowed ?? false,
        platform: this.platform as 'ios' | 'android'
      };
    } catch (error) {
      logger.error('Mobile update check failed', error);
      return {
        updateAvailable: false,
        currentVersion: '1.0.0',
        immediateUpdateAllowed: false,
        flexibleUpdateAllowed: false,
        platform: this.platform as 'ios' | 'android'
      };
    }
  }

  async performImmediateUpdate(): Promise<void> {
    if (!this.isNative) {
      logger.warn('Immediate update not available on web');
      return;
    }

    try {
      await AppUpdate.performImmediateUpdate();
      logger.info('Immediate update started');
    } catch (error) {
      logger.error('Immediate update failed', error);
      throw error;
    }
  }

  async startFlexibleUpdate(): Promise<void> {
    if (!this.isNative) {
      logger.warn('Flexible update not available on web');
      return;
    }

    try {
      await AppUpdate.startFlexibleUpdate();
      logger.info('Flexible update started');
    } catch (error) {
      logger.error('Flexible update failed', error);
      throw error;
    }
  }

  async completeFlexibleUpdate(): Promise<void> {
    if (!this.isNative) return;

    try {
      await AppUpdate.completeFlexibleUpdate();
      logger.info('Flexible update completed');
    } catch (error) {
      logger.error('Complete flexible update failed', error);
      throw error;
    }
  }

  openAppStore(): void {
    try {
      if (this.platform === 'ios') {
        // Ouvrir l'App Store iOS - TODO: Remplacer par l'ID réel quand publié
        const iosUrl = 'https://apps.apple.com/cd/app/kwenda-client/id6738154982';
        window.open(iosUrl, '_system') || window.open(iosUrl, '_blank');
      } else if (this.platform === 'android') {
        // Ouvrir Google Play Store - Essayer d'abord le lien market:// puis fallback
        const appId = 'cd.kwenda.client';
        const marketUrl = `market://details?id=${appId}`;
        const playStoreUrl = `https://play.google.com/store/apps/details?id=${appId}`;
        
        // Tenter d'ouvrir l'app Google Play directement
        const opened = window.open(marketUrl, '_system');
        if (!opened) {
          // Fallback vers URL web si l'app Play Store n'ouvre pas
          window.open(playStoreUrl, '_blank');
        }
      }
      logger.info(`App store opened for platform: ${this.platform}`);
    } catch (error) {
      logger.error('Failed to open app store', error);
      // Fallback final vers URL web
      if (this.platform === 'android') {
        window.open('https://play.google.com/store/apps/details?id=cd.kwenda.client', '_blank');
      }
    }
  }

  isNativePlatform(): boolean {
    return this.isNative;
  }

  getPlatform(): string {
    return this.platform;
  }
}

export const mobileUpdateService = new MobileUpdateService();
