import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppReady } from '@/contexts/AppReadyContext';
import { getDashboardPathFromStorage } from '@/hooks/useProtectedNavigation';

/**
 * 🛡️ MIDDLEWARE DE NAVIGATION GLOBAL
 * Intercepte TOUTES les navigations pour empêcher les utilisateurs connectés
 * d'accéder aux routes publiques
 */
export const NavigationGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, sessionReady } = useAppReady();
  const location = useLocation();
  const navigate = useNavigate();

  // Routes publiques interdites aux utilisateurs connectés
  // NOTE: Les pages d'auth spécialisées (/driver/auth, /partner/auth, /operatorx/admin/auth)
  // sont exclues pour permettre le changement de rôle
  const PUBLIC_ROUTES = [
    '/',
    '/landing',
    '/auth'
  ];

  // Routes de callback/redirection à ignorer
  const IGNORED_ROUTES = [
    '/payment-confirmation',
    '/client/verify-email',
    '/campaign'
  ];

  useEffect(() => {
    // Ne pas agir pendant le chargement
    if (!sessionReady) return;

    const currentPath = location.pathname;

    // Ignorer certaines routes spéciales
    if (IGNORED_ROUTES.some(route => currentPath.startsWith(route))) {
      return;
    }

    // Si l'utilisateur est connecté et tente d'accéder à une route publique
    if (user && PUBLIC_ROUTES.some(route => currentPath === route || currentPath.startsWith(route + '/'))) {
      const dashboardPath = getDashboardPathFromStorage();
      
      console.warn('🛡️ [NavigationGuard] Redirection automatique:', {
        from: currentPath,
        to: dashboardPath,
        reason: 'Utilisateur connecté sur route publique'
      });

      navigate(dashboardPath, { replace: true });
    }
  }, [user, sessionReady, location.pathname, navigate]);

  return <>{children}</>;
};
