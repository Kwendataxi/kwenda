import { useState, useEffect } from 'react';
import { googleMapsLoader } from '@/services/googleMapsLoader';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadGoogleMaps = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Vérifier si déjà chargé avec double vérification
        if (googleMapsLoader.isScriptLoaded() && window.google?.maps?.Map) {
          console.log('✅ Google Maps already loaded and verified');
          if (mounted) {
            setIsLoaded(true);
            setIsLoading(false);
          }
          return;
        }

        // Charger le script Google Maps avec retry
        let attempt = 0;
        const maxAttempts = 3;
        
        while (attempt < maxAttempts) {
          try {
            console.log(`🔄 Loading Google Maps (attempt ${attempt + 1}/${maxAttempts})...`);
            await googleMapsLoader.load(['places', 'marker', 'geometry']);
            
            // Vérification post-chargement
            if (window.google?.maps?.Map && typeof window.google.maps.Map === 'function') {
              console.log('✅ Google Maps loaded and verified successfully');
              if (mounted) {
                setIsLoaded(true);
                setIsLoading(false);
              }
              return;
            }
            
            throw new Error('Google Maps loaded but Map constructor not available');
          } catch (attemptError) {
            attempt++;
            if (attempt === maxAttempts) throw attemptError;
            
            // Backoff exponentiel: 1s, 2s, 4s
            const backoffDelay = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Retry in ${backoffDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      } catch (err) {
        console.error('❌ Error loading Google Maps after retries:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load Google Maps');
          setIsLoading(false);
        }
      }
    };

    loadGoogleMaps();

    return () => {
      mounted = false;
    };
  }, []);

  return { isLoaded, error, isLoading };
};