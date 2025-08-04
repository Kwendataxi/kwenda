import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, AdminRole, Permission } from '@/types/roles';

interface UseRoleManagementReturn {
  assignRole: (userId: string, role: UserRole, adminRole?: AdminRole) => Promise<boolean>;
  removeRole: (userId: string, role: UserRole, adminRole?: AdminRole) => Promise<boolean>;
  getUserRoles: (userId: string) => Promise<any[]>;
  checkPermission: (userId: string, permission: Permission) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export const useRoleManagement = (): UseRoleManagementReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignRole = async (userId: string, role: UserRole, adminRole?: AdminRole): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: assignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          admin_role: adminRole || null,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (assignError) {
        setError(`Erreur lors de l'assignation du rôle: ${assignError.message}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in assignRole:', err);
      setError('Erreur lors de l\'assignation du rôle');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (userId: string, role: UserRole, adminRole?: AdminRole): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role', role);

      if (adminRole) {
        query = query.eq('admin_role', adminRole);
      } else {
        query = query.is('admin_role', null);
      }

      const { error: removeError } = await query;

      if (removeError) {
        setError(`Erreur lors de la suppression du rôle: ${removeError.message}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in removeRole:', err);
      setError('Erreur lors de la suppression du rôle');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = async (userId: string): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        setError(`Erreur lors de la récupération des rôles: ${rolesError.message}`);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error in getUserRoles:', err);
      setError('Erreur lors de la récupération des rôles');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = async (userId: string, permission: Permission): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: permissionError } = await supabase.rpc('has_permission', {
        _user_id: userId,
        _permission: permission
      });

      if (permissionError) {
        setError(`Erreur lors de la vérification des permissions: ${permissionError.message}`);
        return false;
      }

      return data || false;
    } catch (err) {
      console.error('Error in checkPermission:', err);
      setError('Erreur lors de la vérification des permissions');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    assignRole,
    removeRole,
    getUserRoles,
    checkPermission,
    loading,
    error
  };
};