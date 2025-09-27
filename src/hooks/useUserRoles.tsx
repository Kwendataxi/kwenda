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
  
  // Utiliser le context admin de manière optionnelle avec un fallback
  let showAllSections = false;
  try {
    const { useAdminPermissions } = require('@/components/admin/AdminPermissionContext');
    const adminPermissions = useAdminPermissions();
    showAllSections = adminPermissions?.showAllSections || false;
  } catch {
    // Le context n'est pas disponible, utiliser la valeur par défaut
    showAllSections = false;
  }

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

      // Vérifier d'abord directement dans la table admins pour éviter les problèmes RLS
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1);

      if (!adminError && adminData && adminData.length > 0) {
        // Utilisateur admin trouvé - configurer les permissions admin
        const adminPermissions = (adminData[0].permissions || ['system_admin', 'user_management', 'content_moderation']) as Permission[];
        const adminRole = {
          role: 'admin' as UserRole,
          admin_role: (adminData[0].admin_level || 'moderator') as AdminRole,
          permissions: adminPermissions
        };
        setUserRoles([adminRole]);
        setPermissions(adminPermissions);
        return;
      }

      // Essayer la fonction RPC si disponible
      try {
        const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
          p_user_id: user.id
        });

        if (!rolesError && rolesData && rolesData.length > 0) {
          const rolesWithTypedInfo: UserRoleInfo[] = rolesData.map((item: any) => ({
            role: item.role as UserRole,
            admin_role: item.admin_role as AdminRole || undefined,
            permissions: item.permissions || []
          }));

          const allPermissions = Array.from(
            new Set(rolesWithTypedInfo.flatMap(role => role.permissions))
          ) as Permission[];

          setUserRoles(rolesWithTypedInfo);
          setPermissions(allPermissions);
          return;
        }
      } catch (rpcError) {
        console.warn('RPC get_user_roles failed, using fallback:', rpcError);
      }

      // Fallback : assigner un rôle client par défaut
      const defaultRole = {
        role: 'client' as UserRole,
        admin_role: undefined,
        permissions: ['transport_read', 'marketplace_read'] as Permission[]
      };
      setUserRoles([defaultRole]);
      setPermissions(['transport_read', 'marketplace_read']);

    } catch (err) {
      console.error('Error in fetchUserRoles:', err);
      setError('Erreur lors du chargement des rôles');
      // Fallback en cas d'erreur
      const defaultRole = {
        role: 'client' as UserRole,
        admin_role: undefined,
        permissions: ['transport_read', 'marketplace_read'] as Permission[]
      };
      setUserRoles([defaultRole]);
      setPermissions(['transport_read', 'marketplace_read']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, [user?.id]);

  // Utilitaires pour vérifier les permissions
  const hasPermission = (permission: Permission): boolean => {
    // Si le mode "Ignorer les permissions" est activé, autoriser tout
    if (showAllSections) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    // Si le mode "Ignorer les permissions" est activé, autoriser tout
    if (showAllSections) return true;
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