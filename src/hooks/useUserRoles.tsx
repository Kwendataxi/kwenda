import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleInfo, Permission, UserRole, AdminRole } from '@/types/roles';

interface UseUserRolesReturn {
  userRoles: UserRoleInfo[];
  permissions: Permission[];
  primaryRole: UserRole | null;
  adminRole: AdminRole | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserRoles = (): UseUserRolesReturn => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRoleInfo[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRoles = async () => {
    if (!user?.id) {
      setUserRoles([]);
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Appeler la fonction PostgreSQL sécurisée pour obtenir les rôles et permissions
      const { data, error: rolesError } = await supabase.rpc('get_user_roles', {
        p_user_id: user.id
      });

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        setError('Erreur lors du chargement des rôles');
        return;
      }

      if (!data || data.length === 0) {
        // Si aucun rôle trouvé, assigner le rôle client par défaut
        setUserRoles([{
          role: 'client',
          admin_role: undefined,
          permissions: ['transport_read', 'marketplace_read']
        }]);
        setPermissions(['transport_read', 'marketplace_read']);
        return;
      }

      const rolesData: UserRoleInfo[] = data.map((item: any) => ({
        role: item.role,
        admin_role: item.admin_role || undefined,
        permissions: item.permissions || []
      }));

      // Collecter toutes les permissions uniques
      const allPermissions = Array.from(
        new Set(rolesData.flatMap(role => role.permissions))
      ) as Permission[];

      setUserRoles(rolesData);
      setPermissions(allPermissions);

    } catch (err) {
      console.error('Error in fetchUserRoles:', err);
      setError('Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, [user?.id]);

  // Utilitaires pour vérifier les permissions
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasRole = (role: UserRole): boolean => {
    return userRoles.some(userRole => userRole.role === role);
  };

  // Calculer le rôle principal (priorité aux rôles admin)
  const primaryRole: UserRole | null = userRoles.length > 0 
    ? userRoles.find(role => role.role === 'admin')?.role || userRoles[0]?.role || null
    : null;

  // Obtenir le rôle admin s'il existe
  const adminRole: AdminRole | null = userRoles.find(role => role.admin_role)?.admin_role || null;

  const isAdmin = hasRole('admin');
  const isSuperAdmin = adminRole === 'super_admin';

  const refetch = async () => {
    await fetchUserRoles();
  };

  return {
    userRoles,
    permissions,
    primaryRole,
    adminRole,
    hasPermission,
    hasAnyPermission,
    hasRole,
    isAdmin,
    isSuperAdmin,
    loading,
    error,
    refetch
  };
};