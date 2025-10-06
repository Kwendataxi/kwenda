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

        // Vérifier si déjà chargé
        if (googleMapsLoader.isScriptLoaded()) {
          if (mounted) {
            setIsLoaded(true);
            setIsLoading(false);
          }
          return;
        }

        // Charger le script Google Maps
        await googleMapsLoader.load(['places', 'marker', 'geometry']);

        if (mounted) {
          setIsLoaded(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
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