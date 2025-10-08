import { useState, useEffect } from 'react';
import { UserRole } from '@/types/roles';

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
