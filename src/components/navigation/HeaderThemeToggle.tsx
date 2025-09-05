import React from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const HeaderThemeToggle = () => {
  return (
    <div className="fixed top-4 left-4 z-50">
      <ThemeToggle variant="icon" size="lg" className="glassmorphism hover:bg-accent/20" />
    </div>
  );
};