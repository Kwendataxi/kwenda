import { useState, useEffect, useCallback } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { useToast } from '@/hooks/use-toast';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  lastKnownPosition: { latitude: number; longitude: number } | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

// Check if Capacitor is available
const isCapacitorAvailable = () => {
  return typeof window !== 'undefined' && 
         (window as any).Capacitor && 
         (window as any).Capacitor.isNativePlatform &&
         (window as any).Capacitor.isNativePlatform();
};

// Fallback using browser geolocation API
const getBrowserLocation = (options: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée par le navigateur'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    lastKnownPosition: null,
  });
  
  const { toast } = useToast();

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watchPosition = false,
  } = options;

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (isCapacitorAvailable()) {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location !== 'granted') {
          throw new Error('Permission de géolocalisation refusée');
        }
        return true;
      } else {
        // For browser, check if geolocation is supported
        if (!navigator.geolocation) {
          throw new Error('Géolocalisation non supportée par le navigateur');
        }
        // Browser permission is requested automatically when getting position
        return true;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    try {
      let position: Position | GeolocationPosition;
      
      if (isCapacitorAvailable()) {
        // Use Capacitor geolocation for mobile apps
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          throw new Error('Permissions de géolocalisation requises');
        }

        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy,
          timeout,
          maximumAge,
        });
      } else {
        // Fallback to browser geolocation API
        const browserPosition = await getBrowserLocation({
          enableHighAccuracy,
          timeout,
          maximumAge,
        });
        position = {
          coords: browserPosition.coords,
          timestamp: browserPosition.timestamp,
        } as Position;
      }

      const newPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      setLocation(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        loading: false,
        error: null,
        lastKnownPosition: newPosition,
      }));

      return position;
    } catch (error) {
      // Fallback to Kinshasa coordinates if geolocation fails
      const kinshasaCoords = getKinshasaCoordinates();
      const errorMessage = error instanceof Error ? error.message : 'Erreur de géolocalisation';
      
      setLocation(prev => ({
        ...prev,
        latitude: kinshasaCoords.latitude,
        longitude: kinshasaCoords.longitude,
        accuracy: null,
        loading: false,
        error: errorMessage,
        lastKnownPosition: kinshasaCoords,
      }));
      
      toast({
        title: "Position par défaut",
        description: "Utilisation de Kinshasa comme position par défaut",
        variant: "default",
      });
      
      return {
        coords: {
          latitude: kinshasaCoords.latitude,
          longitude: kinshasaCoords.longitude,
          accuracy: null,
        },
        timestamp: Date.now(),
      } as Position;
    }
  }, [enableHighAccuracy, timeout, maximumAge, toast, requestPermissions]);

  const watchCurrentPosition = useCallback(() => {
    let watchId: string | number | null = null;

    const startWatching = async () => {
      try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          throw new Error('Permissions de géolocalisation requises');
        }

        if (isCapacitorAvailable()) {
          // Use Capacitor watch position
          watchId = await Geolocation.watchPosition(
            {
              enableHighAccuracy,
              timeout,
              maximumAge,
            },
            (position: Position | null, err) => {
              if (err) {
                const errorMessage = err.message || 'Erreur de géolocalisation';
                setLocation(prev => ({
                  ...prev,
                  loading: false,
                  error: errorMessage,
                }));
                return;
              }

              if (position) {
                const newPosition = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                
                setLocation(prev => ({
                  ...prev,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  loading: false,
                  error: null,
                  lastKnownPosition: newPosition,
                }));
              }
            }
          );
        } else {
          // Use browser watch position
          watchId = navigator.geolocation.watchPosition(
            (position: GeolocationPosition) => {
              const newPosition = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              
              setLocation(prev => ({
                ...prev,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                loading: false,
                error: null,
                lastKnownPosition: newPosition,
              }));
            },
            (error: GeolocationPositionError) => {
              const errorMessage = error.message || 'Erreur de géolocalisation';
              setLocation(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
              }));
            },
            {
              enableHighAccuracy,
              timeout,
              maximumAge,
            }
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur de géolocalisation';
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    };

    startWatching();

    return () => {
      if (watchId) {
        if (isCapacitorAvailable()) {
          Geolocation.clearWatch({ id: watchId as string });
        } else {
          navigator.geolocation.clearWatch(watchId as number);
        }
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, requestPermissions]);

  useEffect(() => {
    if (watchPosition) {
      return watchCurrentPosition();
    }
  }, [watchPosition, watchCurrentPosition]);

  // Kinshasa default coordinates
  const getKinshasaCoordinates = () => ({
    latitude: -4.4419,
    longitude: 15.2663,
  });

  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const getDistanceToKinshasa = useCallback(() => {
    if (!location.latitude || !location.longitude) return null;
    
    const kinshasa = getKinshasaCoordinates();
    return calculateDistance(
      location.latitude,
      location.longitude,
      kinshasa.latitude,
      kinshasa.longitude
    );
  }, [location.latitude, location.longitude, calculateDistance]);

  return {
    ...location,
    getCurrentPosition,
    watchCurrentPosition,
    calculateDistance,
    getDistanceToKinshasa,
    getKinshasaCoordinates,
    isInKinshasa: getDistanceToKinshasa() ? getDistanceToKinshasa()! < 50 : null, // Within 50km
  };
};