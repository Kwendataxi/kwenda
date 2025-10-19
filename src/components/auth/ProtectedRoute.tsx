import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSelectedRole } from '@/hooks/useSelectedRole';
import { Loader2 } from 'lucide-react';
import { APP_CONFIG } from '@/config/appConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'client' | 'driver' | 'partner' | 'admin';
}

const ProtectedRoute = ({ children, requireAuth = true, requiredRole }: ProtectedRouteProps) => {
  const { user, loading, sessionReady } = useAuth();
  const { userRoles, primaryRole, loading: rolesLoading } = useUserRoles();
  const { hasSelectedRole, setSelectedRole, selectedRole } = useSelectedRole();
  const location = useLocation();
  const navigate = useNavigate();

  // Afficher un loader pendant la vérification de l'authentification ET de la session
  if (loading || !sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Chargement...</h2>
            <p className="text-muted-foreground">
              {loading ? 'Vérification de votre session' : 'Initialisation de la session'}
            </p>
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

  // ✅ PHASE 1.2: Vérifier le rôle requis EN PREMIER (avant auto-sélection)
  if (requireAuth && user && requiredRole && !rolesLoading) {
    const hasRequiredRole = userRoles.some(ur => ur.role === requiredRole);
    
    if (!hasRequiredRole) {
      const roleRoutes: Record<string, string> = {
        'client': '/auth',
        'driver': '/driver/auth',
        'partner': '/partner/auth',
        'admin': '/admin/auth'
      };
      
      navigate(roleRoutes[requiredRole] || '/auth');
      return null;
    }
    
    // ✅ FORCER la sélection du rôle requis si pas déjà fait
    if (!hasSelectedRole() || selectedRole !== requiredRole) {
      setSelectedRole(requiredRole);
    }
  }

  // Si l'utilisateur a plusieurs rôles et n'a pas sélectionné de rôle
  if (user && !rolesLoading && userRoles.length > 1 && !hasSelectedRole() && location.pathname !== '/role-selection') {
    // Vérifier s'il y a une intention de connexion (driver/partner/admin)
    const loginIntent = localStorage.getItem('kwenda_login_intent');
    
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