import { useState, useEffect, useCallback } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { useToast } from '@/hooks/use-toast';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
  });
  
  const { toast } = useToast();

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watchPosition = false,
  } = options;

  const requestPermissions = async () => {
    try {
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        throw new Error('Permission de géolocalisation refusée');
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const getCurrentPosition = useCallback(async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));

    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Permissions de géolocalisation requises');
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        loading: false,
        error: null,
      });

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de géolocalisation';
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Erreur de géolocalisation",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [enableHighAccuracy, timeout, maximumAge, toast]);

  const watchCurrentPosition = useCallback(() => {
    let watchId: string | null = null;

    const startWatching = async () => {
      try {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          throw new Error('Permissions de géolocalisation requises');
        }

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
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                loading: false,
                error: null,
              });
            }
          }
        );
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
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge]);

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