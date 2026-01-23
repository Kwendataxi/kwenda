import { useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppReady } from '@/contexts/AppReadyContext';
import { getDashboardPathFromStorage } from './useProtectedNavigation';
import { toast } from 'sonner';

/**
 * 🧭 HOOK UNIFIÉ DE NAVIGATION NATIVE (v2 - Refonte complète)
 * 
 * Architecture à barrières d'historique pour Android, iOS et PWA
 * 
 * Fonctionnalités :
 * - Injecte des barrières dans l'historique pour empêcher la sortie accidentelle
 * - Double-back pour quitter sur les dashboards principaux
 * - Fonctionne sur Android (backButton), iOS (swipe edge), et PWA
 * - Bloque retour vers routes publiques si connecté
 * 
 * Stack d'historique :
 * [Barrière 1] → [Barrière 2] → [Dashboard] → [Page A] → [Page B (actuel)]
 * Swipe: B → A → Dashboard → Barrière → Toast "Appuyez encore" → Exit
 */

// Routes principales (dashboards) - double-back pour quitter
const MAIN_DASHBOARDS = [
  '/app/client',
  '/app/driver',
  '/app/partner',
  '/app/admin',
  '/app/restaurant',
  '/client',
  '/chauffeur',
  '/partenaire',
  '/operatorx/admin',
  '/restaurant'
];

// Routes publiques interdites si connecté
const PUBLIC_ROUTES = ['/', '/landing', '/auth'];

// Nombre de barrières à injecter
const BARRIER_COUNT = 3;

// Durée pour le double-back (ms)
const DOUBLE_BACK_THRESHOLD = 2000;

const isMainDashboard = (path: string): boolean => {
  return MAIN_DASHBOARDS.some(dashboard => 
    path === dashboard || path === dashboard + '/'
  );
};

const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.some(route => 
    path === route || path.startsWith(route + '/')
  );
};

/**
 * Détecte si l'app tourne en mode PWA standalone
 */
const isPWAStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

/**
 * Détecte si on est sur une plateforme native Capacitor
 */
const isCapacitorNative = async (): Promise<boolean> => {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export const useNativeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppReady();
  
  // Refs pour accès stable sans recréer les listeners
  const pathRef = useRef(location.pathname);
  const lastBackPressRef = useRef<number>(0);
  const listenerRef = useRef<any>(null);
  const userRef = useRef(user);
  const barriersInjectedRef = useRef(false);
  const isRecoveringRef = useRef(false);

  // Sync refs sans recréer les listeners
  useLayoutEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);

  useLayoutEffect(() => {
    userRef.current = user;
  }, [user]);

  // Obtenir le dashboard de l'utilisateur
  const getDashboard = useCallback(() => {
    return getDashboardPathFromStorage() || '/app/client';
  }, []);

  // Rediriger vers le dashboard approprié
  const redirectToDashboard = useCallback(() => {
    const dashboard = getDashboard();
    navigate(dashboard, { replace: true });
  }, [navigate, getDashboard]);

  /**
   * 🛡️ Injecter les barrières d'historique
   * Ces entrées "fantômes" empêchent le swipe back de sortir de l'app
   */
  const injectHistoryBarriers = useCallback(() => {
    if (barriersInjectedRef.current) return;
    
    const currentPath = window.location.pathname;
    
    // Injecter N barrières
    for (let i = 0; i < BARRIER_COUNT; i++) {
      window.history.pushState(
        { barrier: true, index: i, timestamp: Date.now() },
        '',
        currentPath
      );
    }
    
    barriersInjectedRef.current = true;
    console.log(`🛡️ [NativeNav] ${BARRIER_COUNT} history barriers injected`);
  }, []);

  /**
   * Réinjecter une barrière après navigation
   */
  const ensureBarrier = useCallback(() => {
    if (isRecoveringRef.current) return;
    
    const currentPath = window.location.pathname;
    window.history.pushState(
      { barrier: true, recovered: true, timestamp: Date.now() },
      '',
      currentPath
    );
  }, []);

  /**
   * Gérer le double-back pour quitter
   */
  const handleDoubleBackToExit = useCallback(async () => {
    const now = Date.now();
    
    if (now - lastBackPressRef.current < DOUBLE_BACK_THRESHOLD) {
      // Double back dans le délai = quitter
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          const { App } = await import('@capacitor/app');
          App.exitApp();
        }
        // Sur PWA/web : on laisse le comportement par défaut (sortie)
        return true; // Exit
      } catch {
        return true; // Exit sur web
      }
    } else {
      // Premier back = toast d'avertissement
      lastBackPressRef.current = now;
      toast.info('Appuyez encore pour quitter', { 
        duration: DOUBLE_BACK_THRESHOLD,
        id: 'exit-toast'
      });
      return false; // Don't exit
    }
  }, []);

  // Gérer la navigation retour (pour Capacitor backButton)
  const handleBackNavigation = useCallback(async (canGoBack: boolean) => {
    const currentPath = pathRef.current;
    const isMain = isMainDashboard(currentPath);

    if (isMain) {
      // Sur un dashboard principal : double-back pour quitter
      const shouldExit = await handleDoubleBackToExit();
      if (!shouldExit) {
        // Réinjecter une barrière pour bloquer le prochain back
        ensureBarrier();
      }
    } else if (canGoBack) {
      // Navigation normale en arrière
      navigate(-1);
    } else {
      // Pas d'historique = retour au dashboard
      redirectToDashboard();
    }
  }, [navigate, redirectToDashboard, handleDoubleBackToExit, ensureBarrier]);

  /**
   * 📱 Listener Capacitor pour bouton retour Android
   */
  useEffect(() => {
    let isMounted = true;

    const setupCapacitorListener = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import('@capacitor/app');

        // Nettoyer l'ancien listener
        if (listenerRef.current) {
          await listenerRef.current.remove();
          listenerRef.current = null;
        }

        if (!isMounted) return;

        // Créer un nouveau listener stable
        listenerRef.current = await App.addListener('backButton', ({ canGoBack }) => {
          handleBackNavigation(canGoBack);
        });

        console.log('📱 [NativeNav] Capacitor backButton listener active');

      } catch (error) {
        console.debug('[NativeNav] Not on native platform');
      }
    };

    setupCapacitorListener();

    return () => {
      isMounted = false;
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
    };
  }, [handleBackNavigation]);

  /**
   * 🌐 Injection des barrières au montage + Listener popstate pour iOS/PWA
   */
  useEffect(() => {
    const shouldActivate = async () => {
      const isNative = await isCapacitorNative();
      return isNative || isPWAStandalone();
    };

    const setup = async () => {
      const active = await shouldActivate();
      
      if (!active) {
        console.debug('[NativeNav] Not in standalone mode, skipping barriers');
        return;
      }

      // Injecter les barrières initiales
      injectHistoryBarriers();

      /**
       * Handler popstate pour iOS swipe edge et PWA
       * Ce handler intercepte les navigations "back" et les gère intelligemment
       */
      const handlePopState = async (event: PopStateEvent) => {
        const state = event.state;
        const currentPath = window.location.pathname;
        const currentUser = userRef.current;
        
        console.log('🔄 [NativeNav] popstate detected', { 
          state, 
          path: currentPath, 
          hasUser: !!currentUser 
        });

        // 🚫 Si on atteint une barrière
        if (state?.barrier) {
          isRecoveringRef.current = true;
          
          // Vérifier si on est sur un dashboard principal
          const isMain = isMainDashboard(pathRef.current);
          
          if (isMain) {
            // Sur dashboard : logique double-back
            const shouldExit = await handleDoubleBackToExit();
            
            if (!shouldExit) {
              // Annuler le back en re-pushant l'état actuel
              window.history.pushState(
                { barrier: true, recovered: true },
                '',
                pathRef.current
              );
            }
            // Si shouldExit = true, on laisse la navigation se produire (sortie)
          } else {
            // Pas sur dashboard : restaurer la position
            window.history.pushState(
              { barrier: true, recovered: true },
              '',
              pathRef.current
            );
            
            // Naviguer vers le dashboard au lieu de sortir
            const dashboard = getDashboard();
            if (currentUser) {
              navigate(dashboard);
            }
          }
          
          isRecoveringRef.current = false;
          return;
        }

        // 🚫 Si utilisateur connecté tente de retourner vers route publique
        if (isPublicRoute(currentPath) && currentUser) {
          console.warn('🚫 [NativeNav] Blocked back to public route:', currentPath);
          isRecoveringRef.current = true;
          
          const dashboard = getDashboard();
          window.history.pushState({ barrier: true }, '', dashboard);
          navigate(dashboard, { replace: true });
          
          isRecoveringRef.current = false;
          return;
        }
      };

      window.addEventListener('popstate', handlePopState);
      console.log('🌐 [NativeNav] popstate listener active (iOS/PWA)');

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    };

    const cleanup = setup();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [injectHistoryBarriers, handleDoubleBackToExit, getDashboard, navigate]);

  /**
   * Réinjecter une barrière après chaque changement de route
   */
  useEffect(() => {
    if (!user || isRecoveringRef.current || !barriersInjectedRef.current) return;
    
    // Petit délai pour laisser React Router terminer sa navigation
    const timer = setTimeout(() => {
      ensureBarrier();
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, user, ensureBarrier]);

  return {
    handleBackNavigation,
    redirectToDashboard,
    isOnMainDashboard: isMainDashboard(location.pathname),
    injectHistoryBarriers
  };
};

/**
 * Hook simplifié pour les composants qui ont juste besoin
 * de savoir si on est sur un dashboard principal
 */
export const useIsMainDashboard = () => {
  const location = useLocation();
  return isMainDashboard(location.pathname);
};
