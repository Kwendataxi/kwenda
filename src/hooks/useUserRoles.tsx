import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  isDegradedMode: boolean;
}

const CACHE_KEY = 'kwenda_user_roles_cache';
const CACHE_EXPIRATION = 10 * 60 * 1000; // 10 minutes

// 🔐 SÉCURITÉ PHASE 2: Import du stockage chiffré
import { secureStorage, migrateToSecureStorage } from '@/utils/secureStorage';

const getCachedRoles = (): { data: UserRoleInfo[] | null; timestamp: number | null } => {
  try {
    // Migration automatique des anciennes données non chiffrées
    migrateToSecureStorage(CACHE_KEY);
    
    const cached = secureStorage.getItem(CACHE_KEY);
    if (!cached) return { data: null, timestamp: null };
    
    const { data, timestamp } = cached;
    const now = Date.now();
    
    if (now - timestamp > CACHE_EXPIRATION) {
      secureStorage.removeItem(CACHE_KEY);
      return { data: null, timestamp: null };
    }
    
    return { data, timestamp };
  } catch (error) {
    console.error('❌ Erreur lecture cache sécurisé:', error);
    secureStorage.removeItem(CACHE_KEY);
    return { data: null, timestamp: null };
  }
};

const setCachedRoles = (data: UserRoleInfo[]) => {
  try {
    secureStorage.setItem(CACHE_KEY, { data, timestamp: Date.now() });
  } catch (error) {
    console.warn('Failed to cache roles:', error);
  }
};

export const useUserRoles = (): UseUserRolesReturn => {
  const { user } = useAuth();
  const [isDegradedMode, setIsDegradedMode] = useState(false);

  const fetchUserRoles = async (): Promise<{ roles: UserRoleInfo[]; permissions: Permission[] }> => {
    if (!user?.id) {
      const defaultRole = {
        role: 'client' as UserRole,
        admin_role: undefined,
        permissions: ['transport_read', 'marketplace_read'] as Permission[]
      };
      return { roles: [defaultRole], permissions: ['transport_read', 'marketplace_read'] };
    }

    try {
      console.log('🔍 [UserRoles] Fetching roles via RPC for user:', user.id);

      const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
        p_user_id: user.id
      });

      if (rolesError) {
        console.error('❌ [UserRoles] RPC Error:', {
          message: rolesError.message,
          code: rolesError.code,
          details: rolesError.details,
          hint: rolesError.hint
        });
        throw rolesError;
      }

      if (rolesData && rolesData.length > 0) {
        console.log('✅ [UserRoles] Roles retrieved:', rolesData);
        
        const rolesWithTypedInfo: UserRoleInfo[] = rolesData.map((item: any) => ({
          role: item.role as UserRole,
          admin_role: item.admin_role as AdminRole || undefined,
          permissions: item.permissions || []
        }));

        const allPermissions = Array.from(
          new Set(rolesWithTypedInfo.flatMap(role => role.permissions))
        ) as Permission[];

        setCachedRoles(rolesWithTypedInfo);
        setIsDegradedMode(false);
        
        return { roles: rolesWithTypedInfo, permissions: allPermissions };
      }

      console.log('⚠️ [UserRoles] No roles found, defaulting to client');
      const defaultRole = {
        role: 'client' as UserRole,
        admin_role: undefined,
        permissions: ['transport_read', 'marketplace_read'] as Permission[]
      };
      
      setCachedRoles([defaultRole]);
      return { roles: [defaultRole], permissions: ['transport_read', 'marketplace_read'] };

    } catch (err) {
      console.error('❌ [UserRoles] Error in fetchUserRoles:', err);
      
      // Mode dégradé : utiliser le cache si disponible
      const { data: cachedData } = getCachedRoles();
      if (cachedData) {
        console.warn('⚠️ [UserRoles] Using cached roles (degraded mode)');
        setIsDegradedMode(true);
        const allPermissions = Array.from(
          new Set(cachedData.flatMap(role => role.permissions))
        ) as Permission[];
        return { roles: cachedData, permissions: allPermissions };
      }
      
      // Fallback ultime
      const defaultRole = {
        role: 'client' as UserRole,
        admin_role: undefined,
        permissions: ['transport_read', 'marketplace_read'] as Permission[]
      };
      return { roles: [defaultRole], permissions: ['transport_read', 'marketplace_read'] };
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: fetchUserRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user?.id,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const userRoles = data?.roles || [];
  const permissions = data?.permissions || [];

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
    loading: isLoading,
    error: error ? 'Erreur lors du chargement des rôles' : null,
    refetch: async () => { await refetch(); },
    isDegradedMode
  };
};