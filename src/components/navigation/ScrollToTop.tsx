import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Immediate scroll for instant feedback
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });
    
    // Enhanced delay and smooth scroll for better UX
    const timeoutId = setTimeout(() => {
      if (!prefersReducedMotion) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
};