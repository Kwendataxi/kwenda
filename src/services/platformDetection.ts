/**
 * Service de détection de plateforme d'exécution
 * Permet de différencier entre web, PWA et Capacitor
 */

// Détection si c'est un appareil mobile (basé sur user agent)
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isMobileApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Détection Capacitor native
  // @ts-ignore - Capacitor injecte cette propriété
  return window.Capacitor?.isNativePlatform() ?? false;
};

export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-ignore - iOS Safari
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Desktop web (pas mobile app, pas PWA, pas mobile device)
export const isDesktopWeb = (): boolean => {
  return !isMobileApp() && !isPWA() && !isMobileDevice();
};

export const isWebBrowser = (): boolean => {
  return !isMobileApp() && !isPWA();
};

export const getPlatformType = (): 'capacitor' | 'pwa' | 'web' => {
  if (isMobileApp()) return 'capacitor';
  if (isPWA()) return 'pwa';
  return 'web';
};

// Détection spécifique du système d'exploitation
export const getOS = (): 'ios' | 'android' | 'other' => {
  if (typeof window === 'undefined') return 'other';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  
  return 'other';
};

// Log de diagnostic
export const logPlatformInfo = () => {
  const platform = getPlatformType();
  const os = getOS();
  
  console.log('🌐 Platform Detection:', {
    platform,
    os,
    isMobile: isMobileApp(),
    isPWA: isPWA(),
    protocol: window.location.protocol,
    userAgent: window.navigator.userAgent.substring(0, 100)
  });
};
