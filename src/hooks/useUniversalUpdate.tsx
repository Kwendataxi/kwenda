import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppUpdate } from './useAppUpdate';
import { mobileUpdateService, MobileUpdateInfo } from '@/services/mobileUpdateService';
import { UpdateInfo } from '@/types/update';
import { logger } from '@/utils/logger';

export interface UniversalUpdateInfo extends UpdateInfo {
  platform: 'web' | 'pwa' | 'ios' | 'android';
  nativeUpdateAvailable?: boolean;
  mobileInfo?: MobileUpdateInfo;
}

export interface UseUniversalUpdateReturn {
  updateAvailable: boolean;
  updateInfo: UniversalUpdateInfo | null;
  isUpdating: boolean;
  shouldShowPrompt: boolean;
  installUpdate: () => Promise<void>;
  dismissUpdate: (durationHours?: number) => void;
  platform: string;
}

export const useUniversalUpdate = (): UseUniversalUpdateReturn => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  // Hook PWA/Web
  const webUpdate = useAppUpdate();
  
  // État pour updates mobiles natives
  const [mobileUpdateInfo, setMobileUpdateInfo] = useState<MobileUpdateInfo | null>(null);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);

  // Vérifier les mises à jour mobiles
  const checkMobileUpdate = useCallback(async () => {
    if (!isNative) return;
    
    try {
      setIsCheckingMobile(true);
      const info = await mobileUpdateService.checkForUpdate();
      setMobileUpdateInfo(info);
      logger.info('Mobile update check complete', info);
    } catch (error) {
      logger.error('Mobile update check failed', error);
    } finally {
      setIsCheckingMobile(false);
    }
  }, [isNative]);

  // Vérification initiale et périodique
  useEffect(() => {
    if (isNative) {
      // Vérification initiale après 5 secondes
      const initialCheck = setTimeout(() => {
        checkMobileUpdate();
      }, 5000);

      // Vérification toutes les heures
      const interval = setInterval(() => {
        checkMobileUpdate();
      }, 60 * 60 * 1000);

      return () => {
        clearTimeout(initialCheck);
        clearInterval(interval);
      };
    }
  }, [isNative, checkMobileUpdate]);

  // Vérifier au focus de la fenêtre
  useEffect(() => {
    const handleFocus = () => {
      if (isNative) {
        checkMobileUpdate();
      } else {
        // Vérifier update PWA
        webUpdate.installUpdate;
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isNative, checkMobileUpdate]);

  // Installer la mise à jour
  const installUpdate = async () => {
    try {
      if (isNative && mobileUpdateInfo?.updateAvailable) {
        // Update native
        if (mobileUpdateInfo.immediateUpdateAllowed) {
          await mobileUpdateService.performImmediateUpdate();
        } else if (platform === 'ios') {
          // Sur iOS, rediriger vers l'App Store
          mobileUpdateService.openAppStore();
        } else {
          await mobileUpdateService.startFlexibleUpdate();
        }
      } else {
        // Update PWA/Web
        await webUpdate.installUpdate();
      }
    } catch (error) {
      logger.error('Update installation failed', error);
    }
  };

  // Combiner les infos de mise à jour
  const combinedUpdateInfo: UniversalUpdateInfo | null = webUpdate.updateInfo ? {
    ...webUpdate.updateInfo,
    platform: isNative ? (platform as 'ios' | 'android') : 'web',
    nativeUpdateAvailable: mobileUpdateInfo?.updateAvailable,
    mobileInfo: mobileUpdateInfo || undefined
  } : null;

  const updateAvailable = webUpdate.updateAvailable || (mobileUpdateInfo?.updateAvailable ?? false);

  return {
    updateAvailable,
    updateInfo: combinedUpdateInfo,
    isUpdating: webUpdate.isUpdating || isCheckingMobile,
    shouldShowPrompt: (webUpdate.shouldShowPrompt || (mobileUpdateInfo?.updateAvailable ?? false)) && updateAvailable,
    installUpdate,
    dismissUpdate: webUpdate.dismissUpdate,
    platform
  };
};
