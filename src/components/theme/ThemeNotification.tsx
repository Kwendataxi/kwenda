import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';

export const ThemeNotification = () => {
  const { theme, systemTheme } = useTheme();
  const [previousTheme, setPreviousTheme] = useState<string | undefined>();

  useEffect(() => {
    if (previousTheme && theme !== previousTheme) {
      const resolvedTheme = theme === 'system' ? systemTheme : theme;
      const icons = {
        light: '☀️',
        dark: '🌙',
        system: '🖥️'
      };

      const messages = {
        light: 'Mode clair activé',
        dark: 'Mode sombre activé',
        system: 'Mode automatique activé'
      };

      toast.success(messages[theme as keyof typeof messages] || 'Thème changé', {
        icon: icons[theme as keyof typeof icons],
        duration: 2000,
        className: 'glassmorphism',
      });
    }
    setPreviousTheme(theme);
  }, [theme, systemTheme, previousTheme]);

  return null;
};