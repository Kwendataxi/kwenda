import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: string;
  systemTheme: string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function SafeThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('kwenda-theme') || 'dark';
    setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.className = theme;
      localStorage.setItem('kwenda-theme', theme);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme: theme,
    systemTheme: 'dark'
  };

  if (!mounted) {
    return <div className="dark">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useSafeTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return safe defaults if context is not available
    return {
      theme: 'dark',
      setTheme: () => {},
      resolvedTheme: 'dark',
      systemTheme: 'dark'
    };
  }
  return context;
}