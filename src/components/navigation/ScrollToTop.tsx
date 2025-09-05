import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force immediate scroll to top - no delay, no smooth behavior
    window.scrollTo(0, 0);
    
    // Also try scrolling the document element
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    
    // And the body element
    if (document.body) {
      document.body.scrollTop = 0;
    }
    
    // Then add smooth scroll after content is loaded
    const timeoutId = setTimeout(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (!prefersReducedMotion) {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
};