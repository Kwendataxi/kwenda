import { useState, useEffect, useCallback } from 'react';
import { masterLocationService, type LocationData, type LocationSearchResult } from '@/services/MasterLocationService';

export interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  loading: boolean;
  error: string;
  isRealGPS: boolean;
  lastKnownPosition: LocationData | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<LocationState>({
    latitude: -4.3217,
    longitude: 15.3069,
    accuracy: 0,
    loading: false,
    error: '',
    isRealGPS: false,
    lastKnownPosition: null
  });

  const getCurrentPosition = useCallback(async (): Promise<LocationData> => {
    setState(prev => ({ ...prev, loading: true, error: '' }));
    
    try {
      const position = await masterLocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
        fallbackToIP: true,
        fallbackToDatabase: true,
        fallbackToDefault: true
      });
      
      setState(prev => ({
        ...prev,
        latitude: position.lat,
        longitude: position.lng,
        accuracy: position.accuracy || 0,
        loading: false,
        isRealGPS: position.type === 'current',
        lastKnownPosition: position,
        error: ''
      }));
      
      return position;
    } catch (error) {
      const fallbackPosition = {
        address: 'Kinshasa, République Démocratique du Congo',
        lat: -4.3217,
        lng: 15.3069,
        type: 'fallback' as const
      };
      
      setState(prev => ({
        ...prev,
        latitude: fallbackPosition.lat,
        longitude: fallbackPosition.lng,
        accuracy: 0,
        loading: false,
        isRealGPS: false,
        lastKnownPosition: fallbackPosition,
        error: error instanceof Error ? error.message : 'Erreur de géolocalisation'
      }));
      
      return fallbackPosition;
    }
  }, []);

  const searchLocation = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    if (!query.trim()) return [];
    
    try {
      const results = await masterLocationService.searchLocation(query, state.lastKnownPosition || undefined);
      return results;
    } catch (error) {
      console.error('Search location error:', error);
      return [];
    }
  }, [state.lastKnownPosition]);

  const searchPlaces = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    return searchLocation(query);
  }, [searchLocation]);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const fallbackService = masterLocationService as any;
      return await fallbackService.reverseGeocode(lat, lng);
    } catch (error) {
      return `Position ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  const requestLocation = useCallback(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: '' }));
  }, []);

  const calculateDistance = useCallback((point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    return masterLocationService.calculateDistance(point1, point2);
  }, []);

  const formatDistance = useCallback((meters: number): string => {
    return masterLocationService.formatDistance(meters);
  }, []);

  // Initialiser la position au premier chargement
  useEffect(() => {
    getCurrentPosition();
  }, []);

  return {
    ...state,
    getCurrentLocation,
    requestLocation,
    forceRefreshPosition: getCurrentPosition,
    isLoading: state.loading,
    searchLocation,
    searchPlaces,
    reverseGeocode,
    clearError,
    getCurrentPosition,
    calculateDistance,
    formatDistance,
    currentCountry: 'CD',
    currentCity: 'Kinshasa'
  };
};