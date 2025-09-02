import { useState, useEffect, useCallback } from 'react';
import { useMasterLocation } from './useMasterLocation';
import type { LocationData } from '@/types/location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  lastKnownPosition: LocationData | null;
  isGpsRealTime: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const masterLocation = useMasterLocation();

  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    lastKnownPosition: null,
    isGpsRealTime: false
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  // Update location state when master location changes
  useEffect(() => {
    if (masterLocation.location) {
      setLocation(prev => ({
        ...prev,
        latitude: masterLocation.location.lat,
        longitude: masterLocation.location.lng,
        accuracy: masterLocation.accuracy || null,
        lastKnownPosition: masterLocation.location,
        loading: false,
        error: null,
        isGpsRealTime: true
      }));
    }
  }, [masterLocation.location]);

  // Update loading and error states
  useEffect(() => {
    setLocation(prev => ({
      ...prev,
      loading: masterLocation.loading,
      error: masterLocation.error || null
    }));
  }, [masterLocation.loading, masterLocation.error]);

  const getCurrentPosition = useCallback(async () => {
    try {
      const position = await masterLocation.getCurrentPosition();
      return position;
    } catch (error) {
      console.error('Error getting current position:', error);
      throw error;
    }
  }, [masterLocation.getCurrentPosition]);

  const forceRefreshPosition = useCallback(async () => {
    return getCurrentPosition();
  }, [getCurrentPosition]);

  const watchCurrentPosition = useCallback(() => {
    // This is a simplified implementation
    // The actual watching is handled by useMasterLocation internally
    if (options.watch) {
      getCurrentPosition();
    }
  }, [options.watch, getCurrentPosition]);

  // Calculate distance between two points
  const calculateDistance = useCallback((
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const getDistanceToMainCity = useCallback((): number | null => {
    if (!location.latitude || !location.longitude) return null;
    // Kinshasa coordinates
    return calculateDistance(location.latitude, location.longitude, -4.3217, 15.3069);
  }, [location.latitude, location.longitude, calculateDistance]);

  return {
    // Direct access properties for backward compatibility
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    loading: location.loading,
    error: location.error,
    isRealGPS: location.isGpsRealTime,
    lastKnownPosition: location.lastKnownPosition,
    
    // State object
    location,
    
    // Functions
    getCurrentPosition,
    forceRefreshPosition,
    watchCurrentPosition,
    calculateDistance,
    getDistanceToMainCity,
    getCurrentCountryMainCity: () => ({ lat: -4.3217, lng: 15.3069, name: 'Kinshasa' }),
    detectCurrentCity: () => 'Kinshasa',
    isInMainCity: (getDistanceToMainCity() || 0) < 20,
    currentCity: 'Kinshasa',
    currentCountry: 'RDC'
  };
};