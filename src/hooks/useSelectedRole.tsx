import { useState, useEffect } from 'react';
import { UserRole } from '@/types/roles';
import { supabase } from '@/integrations/supabase/client';

const SELECTED_ROLE_KEY = 'kwenda_selected_role';

/**
 * Hook pour gérer le rôle sélectionné par l'utilisateur
 * Permet aux utilisateurs avec plusieurs rôles de choisir leur rôle actif
 */
export const useSelectedRole = () => {
  const [selectedRole, setSelectedRoleState] = useState<UserRole | null>(() => {
    const stored = localStorage.getItem(SELECTED_ROLE_KEY);
    return stored as UserRole | null;
  });

  // ✅ PHASE 1.3: Récupérer le rôle depuis Supabase metadata au montage
  useEffect(() => {
    const checkSessionRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const savedRole = user?.user_metadata?.active_role;
      
      if (savedRole && !localStorage.getItem(SELECTED_ROLE_KEY)) {
        setSelectedRoleState(savedRole as UserRole);
        localStorage.setItem(SELECTED_ROLE_KEY, savedRole);
      }
    };
    
    checkSessionRole();
  }, []);

  const setSelectedRole = (role: UserRole | null) => {
    if (role) {
      localStorage.setItem(SELECTED_ROLE_KEY, role);
    } else {
      localStorage.removeItem(SELECTED_ROLE_KEY);
    }
    setSelectedRoleState(role);
  };

  const clearSelectedRole = () => {
    localStorage.removeItem(SELECTED_ROLE_KEY);
    setSelectedRoleState(null);
  };

  const hasSelectedRole = (): boolean => {
    return !!localStorage.getItem(SELECTED_ROLE_KEY);
  };

  return {
    selectedRole,
    setSelectedRole,
    clearSelectedRole,
    hasSelectedRole
  };
};
