import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface UseSimplifiedGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useSimplifiedGeolocation = (options: UseSimplifiedGeolocationOptions = {}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const {
    enableHighAccuracy = true,
    timeout = 8000, // Optimisé pour UX plus fluide
    maximumAge = 300000, // 5 minutes pour réutiliser positions récentes
  } = options;

  // Position par défaut Kinshasa si aucune géolocalisation
  const DEFAULT_POSITION = {
    latitude: -4.3217,
    longitude: 15.3069,
    accuracy: 1000,
    timestamp: Date.now()
  };

  const getStoredLocation = useCallback((): Location | null => {
    try {
      const stored = localStorage.getItem('lastKnownLocation');
      const timestamp = localStorage.getItem('lastKnownLocationTime');
      
      if (stored && timestamp) {
        const location = JSON.parse(stored);
        const time = parseInt(timestamp);
        
        // Utiliser la position stockée si elle a moins de 30 minutes
        if (Date.now() - time < 30 * 60 * 1000) {
          return { ...location, timestamp: time };
        }
      }
    } catch (err) {
      console.error('Error reading stored location:', err);
    }
    return null;
  }, []);

  const storeLocation = useCallback((location: Location) => {
    try {
      localStorage.setItem('lastKnownLocation', JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      }));
      localStorage.setItem('lastKnownLocationTime', location.timestamp.toString());
    } catch (err) {
      console.error('Error storing location:', err);
    }
  }, []);

  const getCurrentPosition = useCallback(async (useDefault = false, forceRefresh = false): Promise<Location> => {
    // Si on demande la position par défaut ou si c'est un fallback
    if (useDefault) {
      const defaultLocation = DEFAULT_POSITION;
      setLocation(defaultLocation);
      setError(null);
      toast.info('Position par défaut utilisée (Kinshasa centre)');
      return defaultLocation;
    }

    setLoading(true);
    setError(null);

    try {
      // Si forceRefresh est true, ne pas utiliser le cache
      if (!forceRefresh) {
        const stored = getStoredLocation();
        if (stored) {
          setLocation(stored);
          setLoading(false);
          return stored;
        }
      }

      // Vérifier le support de la géolocalisation
      if (!navigator.geolocation) {
        throw new Error('GEOLOCATION_NOT_SUPPORTED');
      }

      // Demander la position actuelle avec timeout plus long pour plus de précision
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true, // Force la haute précision
            timeout: 20000, // Augmenté à 20s pour GPS plus précis
            maximumAge: forceRefresh ? 0 : maximumAge, // Pas de cache si forceRefresh
          }
        );
      });

      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || undefined,
        timestamp: Date.now(),
      };

      setLocation(newLocation);
      storeLocation(newLocation);
      setLoading(false);

      toast.success('Position GPS précise obtenue');
      return newLocation;

    } catch (err: any) {
      setLoading(false);
      
      let errorMessage = 'Erreur de géolocalisation';
      
      if (err.code === 1) {
        errorMessage = 'Permission GPS refusée';
      } else if (err.code === 2) {
        errorMessage = 'Signal GPS indisponible';
      } else if (err.code === 3) {
        errorMessage = 'Délai GPS dépassé';
      } else if (err.message === 'GEOLOCATION_NOT_SUPPORTED') {
        errorMessage = 'Géolocalisation non supportée';
      }

      setError(errorMessage);

      // Essayer d'utiliser une position stockée même ancienne en dernier recours
      if (!forceRefresh) {
        const stored = getStoredLocation();
        if (stored) {
          setLocation(stored);
          toast.warning('Position GPS précédente utilisée');
          return stored;
        }
      }

      // Dernier recours: position par défaut adaptée à la ville
      const defaultLocation = DEFAULT_POSITION;
      setLocation(defaultLocation);
      toast.warning('Position par défaut utilisée (Kinshasa centre)');
      return defaultLocation;
    }
  }, [enableHighAccuracy, timeout, maximumAge, getStoredLocation, storeLocation]);

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return;
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || undefined,
          timestamp: Date.now(),
        };

        setLocation(newLocation);
        storeLocation(newLocation);
        setError(null);
      },
      (err) => {
        console.error('Watch position error:', err);
        // Ne pas afficher d'erreur continue, juste logger
      },
      {
        enableHighAccuracy,
        timeout: timeout * 2, // Plus de temps pour le watch
        maximumAge,
      }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, storeLocation]);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const useDefaultPosition = useCallback(() => {
    return getCurrentPosition(true);
  }, [getCurrentPosition]);

  const getCurrentPositionForced = useCallback(() => {
    return getCurrentPosition(false, true); // Force refresh du GPS
  }, [getCurrentPosition]);

  return {
    location,
    loading,
    error,
    getCurrentPosition,
    getCurrentPositionForced,
    watchPosition,
    clearWatch,
    useDefaultPosition,
    hasStoredLocation: !!getStoredLocation(),
  };
};