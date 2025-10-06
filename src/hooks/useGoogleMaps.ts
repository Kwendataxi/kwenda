import { useState, useEffect } from 'react';
import { googleMapsLoader } from '@/services/googleMapsLoader';

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const loadGoogleMaps = async (attempt: number = 0) => {
      if (!isMounted) return;

      const maxRetries = 5;
      const baseDelay = 2000; // 2 secondes
      
      try {
        console.log(`🔄 [useGoogleMaps] Tentative de chargement #${attempt + 1}/${maxRetries + 1}`);
        setLoadingProgress(20);
        setIsLoading(true);
        setRetryCount(attempt);

        // Timeout de 30 secondes (Phase 5)
        const loadPromise = googleMapsLoader.load(['places', 'marker', 'geometry']);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout Google Maps (30s)')), 30000)
        );

        setLoadingProgress(50);
        await Promise.race([loadPromise, timeoutPromise]);
        
        if (!isMounted) return;

        // Vérification finale
        if (window.google?.maps?.Map && typeof window.google.maps.Map === 'function') {
          console.log('✅ [useGoogleMaps] Google Maps chargé avec succès');
          setLoadingProgress(100);
          setIsLoaded(true);
          setIsLoading(false);
          setError(null);
        } else {
          throw new Error('google.maps.Map n\'est pas un constructeur valide');
        }
      } catch (err) {
        console.error(`❌ [useGoogleMaps] Échec tentative #${attempt + 1}:`, err);
        
        if (!isMounted) return;

        // Retry avec exponential backoff
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // 2s, 4s, 8s, 16s, 32s
          console.log(`⏳ [useGoogleMaps] Nouvelle tentative dans ${delay/1000}s...`);
          setLoadingProgress(30 + (attempt * 10));
          
          retryTimeout = setTimeout(() => {
            loadGoogleMaps(attempt + 1);
          }, delay);
        } else {
          console.error('❌ [useGoogleMaps] Échec définitif après toutes les tentatives');
          setError('Impossible de charger Google Maps. Veuillez vérifier votre connexion internet.');
          setIsLoading(false);
          setLoadingProgress(0);
        }
      }
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  return { 
    isLoaded, 
    error, 
    isLoading,
    retryCount,
    loadingProgress
  };
}
