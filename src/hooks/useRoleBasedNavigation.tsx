import { useNavigate } from 'react-router-dom';
import { useUserRoles } from './useUserRoles';
import { UserRole } from '@/types/roles';

/**
 * Hook centralisé pour la navigation basée sur les rôles
 * Remplace tous les usages de user.user_metadata.role
 */
export const useRoleBasedNavigation = () => {
  const navigate = useNavigate();
  const { primaryRole, loading } = useUserRoles();

  /**
   * Retourne le chemin de redirection selon le rôle principal
   */
  const getRedirectPath = (role: UserRole | null): string => {
    if (!role) return '/auth';
    
    switch (role) {
      case 'admin':
        return '/admin';
      case 'partner':
        return '/partenaire';
      case 'driver':
        return '/chauffeur';
      case 'client':
        return '/client';
      default:
        return '/';
    }
  };

  /**
   * Navigue vers la page appropriée selon le rôle
   */
  const navigateToRolePage = () => {
    const path = getRedirectPath(primaryRole);
    navigate(path);
  };

  /**
   * Vérifie si l'utilisateur a le bon rôle pour la page actuelle
   */
  const canAccessRoute = (requiredRole: UserRole): boolean => {
    return primaryRole === requiredRole;
  };

  return {
    primaryRole,
    loading,
    getRedirectPath,
    navigateToRolePage,
    canAccessRoute
  };
};
