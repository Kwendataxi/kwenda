import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';

export const useThemeSync = () => {
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();
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

  // Appliquer les classes CSS de manière synchrone et stable
  useEffect(() => {
    const root = document.documentElement;
    
    // Désactiver temporairement les transitions pendant le changement de thème
    const disableTransitions = () => {
      const css = document.createElement('style');
      css.textContent = '*, *::before, *::after { transition: none !important; }';
      document.head.appendChild(css);
      
      return () => {
        // Forcer un reflow avant de supprimer les styles
        document.body.offsetHeight;
        document.head.removeChild(css);
      };
    };

    const enableTransitions = disableTransitions();
    
    // Appliquer immédiatement la classe de thème
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Réactiver les transitions après un délai minimal
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        enableTransitions();
      });
    });
  }, [resolvedTheme]);

  return { theme, setTheme, systemTheme, resolvedTheme };
};