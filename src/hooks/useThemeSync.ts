import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';

export const useThemeSync = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const { user } = useAuth();

  // Charger les préférences de thème depuis localStorage pour l'utilisateur connecté
  useEffect(() => {
    const loadUserThemePreference = () => {
      if (!user) return;

      const storageKey = `kwenda-theme-${user.id}`;
      const savedTheme = localStorage.getItem(storageKey);
      
      if (savedTheme && savedTheme !== theme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    };

    loadUserThemePreference();
  }, [user, setTheme, theme]);

  // Sauvegarder les changements de thème par utilisateur
  useEffect(() => {
    const saveThemePreference = () => {
      if (!user || !theme) return;

      const storageKey = `kwenda-theme-${user.id}`;
      localStorage.setItem(storageKey, theme);
    };

    saveThemePreference();
  }, [user, theme]);

  // Appliquer les classes CSS nécessaires
  useEffect(() => {
    const root = document.documentElement;
    const resolvedTheme = theme === 'system' ? systemTheme : theme;
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, systemTheme]);

  return { theme, setTheme, systemTheme };
};