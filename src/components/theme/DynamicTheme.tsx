import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface DynamicThemeProps {
  children: React.ReactNode;
}

type ThemeMode = 'day' | 'sunset' | 'night';

const DynamicTheme: React.FC<DynamicThemeProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('day');
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      
      let newMode: ThemeMode;
      if (hour >= 6 && hour < 17) {
        newMode = 'day';
      } else if (hour >= 17 && hour < 20) {
        newMode = 'sunset';
      } else {
        newMode = 'night';
      }

      if (newMode !== themeMode) {
        setThemeMode(newMode);
      }
    };

    // Update immediately
    updateTheme();

    // Update every hour
    const interval = setInterval(updateTheme, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    const resolvedTheme = theme === 'system' ? systemTheme : theme;
    const isDark = resolvedTheme === 'dark';
    
    // Apply temporal theme adjustments that work with both light and dark modes
    switch (themeMode) {
      case 'sunset':
        if (isDark) {
          root.style.setProperty('--background', '35 25% 8%');
          root.style.setProperty('--congo-red', '357 90% 65%');
          root.style.setProperty('--congo-yellow', '42 100% 70%');
        } else {
          root.style.setProperty('--background', '35 25% 96%');
          root.style.setProperty('--congo-red', '357 90% 55%');
          root.style.setProperty('--congo-yellow', '42 100% 60%');
        }
        break;
      case 'night':
        if (isDark) {
          root.style.setProperty('--congo-red', '357 85% 70%');
          root.style.setProperty('--congo-yellow', '42 95% 75%');
        } else {
          root.style.setProperty('--congo-red', '357 85% 60%');
          root.style.setProperty('--congo-yellow', '42 95% 65%');
        }
        break;
      default: // day
        if (isDark) {
          root.style.setProperty('--background', '220 13% 9%');
          root.style.setProperty('--congo-red', '357 85% 60%');
          root.style.setProperty('--congo-yellow', '42 95% 65%');
        } else {
          root.style.setProperty('--background', '45 15% 97%');
          root.style.setProperty('--congo-red', '357 85% 50%');
          root.style.setProperty('--congo-yellow', '42 95% 55%');
        }
    }
  }, [themeMode, theme, systemTheme]);

  return (
    <div className="relative">
      {children}
      {/* Congo-inspired ambient overlay with theme awareness */}
      <div 
        className={`fixed inset-0 pointer-events-none z-0 transition-all duration-1000 ${
          themeMode === 'sunset' ? 'opacity-20' : 'opacity-10'
        }`}
        style={{
          background: theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
            ? themeMode === 'night' 
              ? 'radial-gradient(circle at 20% 20%, hsl(357, 85%, 60% / 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(42, 95%, 65% / 0.12) 0%, transparent 50%)'
              : 'radial-gradient(circle at 30% 30%, hsl(357, 85%, 60% / 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 70%, hsl(42, 95%, 65% / 0.06) 0%, transparent 50%)'
            : themeMode === 'night' 
              ? 'radial-gradient(circle at 20% 20%, hsl(357, 85%, 50% / 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(42, 95%, 55% / 0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at 30% 30%, hsl(357, 85%, 50% / 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 70%, hsl(42, 95%, 55% / 0.05) 0%, transparent 50%)'
        }}
      />
    </div>
  );
};

export default DynamicTheme;