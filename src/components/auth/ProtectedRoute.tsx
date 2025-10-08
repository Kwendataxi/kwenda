import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSelectedRole } from '@/hooks/useSelectedRole';
import { Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/config/appConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { userRoles, primaryRole, loading: rolesLoading } = useUserRoles();
  const { hasSelectedRole } = useSelectedRole();
  const location = useLocation();

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Chargement...</h2>
            <p className="text-muted-foreground">Vérification de votre session</p>
          </div>
        </div>
      </div>
    );
  }

  // Si l'authentification est requise mais l'utilisateur n'est pas connecté
  if (requireAuth && !user) {
    // Rediriger vers la page d'auth appropriée selon l'app
    return <Navigate to={APP_CONFIG.authRoute} state={{ from: location }} replace />;
  }

  // Si l'utilisateur a plusieurs rôles et n'a pas sélectionné de rôle
  if (user && !rolesLoading && userRoles.length > 1 && !hasSelectedRole() && location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" replace />;
  }

  // Si l'utilisateur est connecté mais ne devrait pas accéder à cette page
  if (!requireAuth && user && location.pathname !== '/role-selection') {
    if (!primaryRole) {
      return <Navigate to={APP_CONFIG.authRoute} replace />;
    }
    
    switch (primaryRole) {
      case 'driver':
        return <Navigate to="/chauffeur" replace />;
      case 'partner':
        return <Navigate to="/partenaire" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'client':
        return <Navigate to="/client" replace />;
      default:
        return <Navigate to={APP_CONFIG.defaultRoute} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;