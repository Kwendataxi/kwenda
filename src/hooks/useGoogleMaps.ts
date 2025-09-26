import { useState, useEffect } from 'react';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };

    checkGoogleMaps();
  }, []);

  return { isLoaded, error };
};