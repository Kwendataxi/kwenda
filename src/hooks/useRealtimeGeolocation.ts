import { useState, useEffect } from 'react';
import { useSmartGeolocation } from './useSmartGeolocation';

/**
 * Hook de géolocalisation temps réel avec état exposé
 * Wrapper autour de useSmartGeolocation pour compatibilité avec les composants
 */
export const useRealtimeGeolocation = () => {
  const smartGeo = useSmartGeolocation();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isRealGPS, setIsRealGPS] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosition = async () => {
      try {
        setLoading(true);
        const position = await smartGeo.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        });
        
        setLatitude(position.lat);
        setLongitude(position.lng);
        setAccuracy(position.accuracy || null);
        setIsRealGPS(position.type === 'current' || position.type === 'gps');
      } catch (error) {
        console.error('🔴 Erreur géolocalisation:', error);
        setIsRealGPS(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPosition();
  }, []);

  // Sync avec smartGeo si currentLocation change
  useEffect(() => {
    if (smartGeo.currentLocation) {
      setLatitude(smartGeo.currentLocation.lat);
      setLongitude(smartGeo.currentLocation.lng);
      setAccuracy(smartGeo.currentLocation.accuracy || null);
      setIsRealGPS(smartGeo.currentLocation.type === 'current' || smartGeo.currentLocation.type === 'gps');
      setLoading(false);
    }
  }, [smartGeo.currentLocation]);

  return {
    latitude,
    longitude,
    accuracy,
    isRealGPS,
    loading,
    getCurrentPosition: smartGeo.getCurrentPosition,
    ...smartGeo
  };
};
