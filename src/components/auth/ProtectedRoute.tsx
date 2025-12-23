import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppReady } from '@/contexts/AppReadyContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSelectedRole } from '@/hooks/useSelectedRole';
import { APP_CONFIG } from '@/config/appConfig';
import { InvisibleLoadingBar } from '@/components/loading/InvisibleLoadingBar';
import { useBlockBackNavigation } from '@/hooks/useBlockBackNavigation';
import { getDashboardPathFromStorage } from '@/hooks/useProtectedNavigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'client' | 'driver' | 'partner' | 'admin';
}

/**
 * 🚀 PROTECTED ROUTE OPTIMISÉ
 * Utilise AppReadyContext pour éviter vérifications redondantes
 * Transition invisible avec barre de 2px
 * 🛡️ Bloque la navigation retour vers les routes publiques
 */
const ProtectedRoute = ({ children, requireAuth = true, requiredRole }: ProtectedRouteProps) => {
  const { user, sessionReady, contentReady } = useAppReady();
  const { userRoles, primaryRole, loading: rolesLoading } = useUserRoles();
  const { hasSelectedRole, setSelectedRole, selectedRole } = useSelectedRole();
  const location = useLocation();
  const navigate = useNavigate();

  // 🛡️ Bloquer la navigation retour si l'utilisateur est connecté
  useBlockBackNavigation(requireAuth && !!user);

  // 🛡️ Remplacer l'historique pour empêcher le retour vers les pages publiques
  useEffect(() => {
    if (user && requireAuth) {
      window.history.replaceState(
        { protected: true, path: location.pathname },
        '',
        location.pathname
      );
    }
  }, [user, requireAuth, location.pathname]);

  // Attendre que tout soit prêt (transition invisible)
  if (!sessionReady || !contentReady || rolesLoading) {
    return <InvisibleLoadingBar />;
  }

  // Si l'authentification est requise mais l'utilisateur n'est pas connecté
  if (requireAuth && !user) {
    // Rediriger vers la page d'auth appropriée selon le rôle requis
    const authRoutes: Record<string, string> = {
      'admin': '/operatorx/admin/auth',
      'driver': '/driver/auth',
      'partner': '/partner/auth',
      'restaurant': '/restaurant/auth',
      'client': '/auth'
    };
    const targetAuth = requiredRole ? authRoutes[requiredRole] || APP_CONFIG.authRoute : APP_CONFIG.authRoute;
    return <Navigate to={targetAuth} state={{ from: location }} replace />;
  }

  // ✅ Vérifier le rôle requis et rediriger si nécessaire
  if (requireAuth && user && requiredRole && !rolesLoading) {
    const hasRequiredRole = userRoles.some(ur => ur.role === requiredRole);
    
    console.log('🔍 [ProtectedRoute] Role check', { 
      requiredRole, 
      hasRequiredRole, 
      userRoles: userRoles.map(r => r.role),
      path: location.pathname 
    });
    
    if (!hasRequiredRole) {
      const roleRoutes: Record<string, string> = {
        'client': '/auth',
        'driver': '/driver/auth',
        'partner': '/partner/auth',
        'admin': '/operatorx/admin/auth'
      };
      
      return <Navigate to={roleRoutes[requiredRole] || '/auth'} replace />;
    }
    
    // ✅ Forcer la sélection du rôle requis si pas déjà fait
    // Si mono-rôle, auto-sélectionner silencieusement
    if (userRoles.length === 1) {
      if (!hasSelectedRole()) {
        setSelectedRole(requiredRole);
      }
    } else if (!hasSelectedRole() || selectedRole !== requiredRole) {
      // Multi-rôles : forcer sélection du rôle requis
      setSelectedRole(requiredRole);
    }
  }

  // Si l'utilisateur a plusieurs rôles et n'a pas sélectionné de rôle
  if (user && !rolesLoading && userRoles.length > 1 && !hasSelectedRole() && location.pathname !== '/role-selection') {
    // Vérifier s'il y a une intention de connexion (driver/partner/admin)
    const loginIntent = localStorage.getItem('kwenda_login_intent');
    
    console.log('🔍 [ProtectedRoute] Multiple roles detected', { 
      userRoles: userRoles.map(r => r.role), 
      loginIntent,
      path: location.pathname
    });
    
    // Si intention spécifique (driver, partner, admin), utiliser cette intention
    if (loginIntent && loginIntent !== 'client' && loginIntent !== 'vendor') {
      const intentRole = loginIntent as 'driver' | 'partner' | 'admin';
      if (userRoles.some(ur => ur.role === intentRole)) {
        setSelectedRole(intentRole);
        localStorage.removeItem('kwenda_login_intent');
        return null;
      }
      return <Navigate to="/role-selection" replace />;
    }
    
    // Par défaut, auto-sélectionner le rôle client (pas de choix)
    const hasClientRole = userRoles.some(ur => ur.role === 'client');
    if (hasClientRole) {
      setSelectedRole('client');
      return null;
    }
    
    // Si pas de rôle client, aller à la sélection
    return <Navigate to="/role-selection" replace />;
  }

  // 🛡️ Si l'utilisateur est connecté et essaie d'accéder à une page d'auth
  // Rediriger vers le dashboard approprié (pas vers '/')
  if (!requireAuth && user && location.pathname !== '/role-selection') {
    if (!primaryRole) {
      return <Navigate to="/auth" replace />;
    }
    
    // Rediriger vers le dashboard du rôle actuel
    const dashboardPath = getDashboardPathFromStorage();
    console.log('🔄 [ProtectedRoute] Utilisateur connecté sur page publique, redirection:', dashboardPath);
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;