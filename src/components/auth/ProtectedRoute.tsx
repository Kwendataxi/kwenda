import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
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
    // Sauvegarder la page demandée pour redirection après connexion
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est connecté mais ne devrait pas accéder à cette page
  if (!requireAuth && user) {
    // Utiliser useRoleBasedNavigation pour obtenir le rôle depuis user_roles
    const { primaryRole } = useUserRoles();
    
    if (!primaryRole) {
      return <Navigate to="/auth" replace />;
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
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;