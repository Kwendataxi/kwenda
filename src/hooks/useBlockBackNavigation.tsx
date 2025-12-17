import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppReady } from '@/contexts/AppReadyContext';
import { getDashboardPathFromStorage } from './useProtectedNavigation';

/**
 * 🛡️ HOOK DE BLOCAGE NAVIGATION RETOUR
 * Empêche le bouton retour du navigateur de ramener vers les pages publiques
 */
export const useBlockBackNavigation = (shouldBlock: boolean = true) => {
  const { user } = useAppReady();
  const location = useLocation();
  const navigate = useNavigate();

  // Routes publiques interdites si connecté
  const PUBLIC_ROUTES = ['/', '/landing', '/auth', '/driver/auth', '/partner/auth', '/operatorx/admin/auth'];

  useEffect(() => {
    if (!shouldBlock || !user) return;

    // Remplacer l'état de l'historique pour empêcher le retour
    window.history.replaceState(
      { protected: true, path: location.pathname },
      '',
      location.pathname
    );

    const handlePopState = (event: PopStateEvent) => {
      const targetPath = window.location.pathname;
      
      // Si l'utilisateur essaie de retourner vers une route publique
      if (PUBLIC_ROUTES.some(r => targetPath === r || targetPath.startsWith(r + '/'))) {
        console.warn('🚫 [BlockBack] Navigation retour vers route publique bloquée:', targetPath);
        
        // Empêcher la navigation et rester sur la page actuelle
        const dashboardPath = getDashboardPathFromStorage();
        window.history.pushState({ protected: true }, '', dashboardPath);
        navigate(dashboardPath, { replace: true });
      }
    };

    // Écouter les événements popstate (bouton retour/avancer)
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlock, user, location.pathname, navigate]);
};

/**
 * Hook simplifié pour les pages authentifiées
 * Utiliser dans les layouts/containers des espaces protégés
 */
export const useAuthenticatedNavigation = () => {
  const { user } = useAppReady();
  
  // Activer le blocage uniquement si l'utilisateur est connecté
  useBlockBackNavigation(!!user);
  
  return { isBlocking: !!user };
};
