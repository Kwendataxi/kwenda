import { ReactNode } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Permission, UserRole } from '@/types/roles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { useAdminPermissions } from '@/components/admin/AdminPermissionContext';

interface FlexiblePermissionGuardProps {
  children: ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: UserRole[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showError?: boolean;
}

export const FlexiblePermissionGuard = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false,
  fallback = null,
  showError = false
}: FlexiblePermissionGuardProps) => {
  const { hasPermission, hasAnyPermission, hasRole, loading, error } = useUserRoles();
  const { showAllSections } = useAdminPermissions();

  // Si le mode "Afficher toutes les sections" est activé, on autorise l'accès
  if (showAllSections) {
    return <>{children}</>;
  }

  // Mode dégradé: si erreur de chargement des rôles après 3s, afficher un fallback
  if (error && !loading) {
    return fallback || (
      <Alert variant="destructive" className="m-4">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Impossible de vérifier vos permissions. Veuillez rafraîchir la page.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Vérifier les permissions
  let hasRequiredPermissions = true;
  if (requiredPermissions.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = requiredPermissions.every(permission => hasPermission(permission));
    } else {
      hasRequiredPermissions = hasAnyPermission(requiredPermissions);
    }
  }

  // Vérifier les rôles
  let hasRequiredRoles = true;
  if (requiredRoles.length > 0) {
    if (requireAll) {
      hasRequiredRoles = requiredRoles.every(role => hasRole(role));
    } else {
      hasRequiredRoles = requiredRoles.some(role => hasRole(role));
    }
  }

  const hasAccess = hasRequiredPermissions && hasRequiredRoles;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showError) {
      return (
        <Alert className="m-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};