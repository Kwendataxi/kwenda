import React, { useEffect, useState } from 'react';

interface DynamicThemeProps {
  children: React.ReactNode;
}

type ThemeMode = 'day' | 'sunset' | 'night';

const DynamicTheme: React.FC<DynamicThemeProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('day');

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
    
    // Apply theme-specific adjustments
    switch (themeMode) {
      case 'sunset':
        root.style.setProperty('--background', '35 25% 96%');
        root.style.setProperty('--congo-red', '357 90% 55%');
        root.style.setProperty('--congo-yellow', '42 100% 60%');
        break;
      case 'night':
        root.classList.add('dark');
        root.style.setProperty('--congo-red', '357 85% 60%');
        root.style.setProperty('--congo-yellow', '42 95% 65%');
        break;
      default: // day
        root.classList.remove('dark');
        root.style.setProperty('--background', '45 15% 97%');
        root.style.setProperty('--congo-red', '357 85% 50%');
        root.style.setProperty('--congo-yellow', '42 95% 55%');
    }
  }, [themeMode]);

  return (
    <div className="relative">
      {children}
      {/* Congo-inspired ambient overlay */}
      <div 
        className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${
          themeMode === 'sunset' ? 'opacity-20' : 'opacity-10'
        }`}
        style={{
          background: themeMode === 'night' 
            ? 'radial-gradient(circle at 20% 20%, hsl(357, 85%, 50% / 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(42, 95%, 55% / 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 30% 30%, hsl(357, 85%, 50% / 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 70%, hsl(42, 95%, 55% / 0.05) 0%, transparent 50%)'
        }}
      />
    </div>
  );
};

export default DynamicTheme;