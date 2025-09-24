/**
 * Hook React pour le service de géolocalisation unifié
 * Remplace useSimpleLocation et useIntelligentLocation avec une approche unifiée
 */

import { useState, useEffect, useCallback } from 'react';
import { enhancedLocationService } from '@/services/enhancedLocationService';
import { 
  UnifiedLocation, 
  LocationSearchResult, 
  LocationState, 
  GeolocationOptions,
  CityConfig
} from '@/types/unifiedLocation';

export function useEnhancedLocation() {
  const [state, setState] = useState<LocationState>({
    currentLocation: null,
    lastKnownLocation: null,
    loading: false,
    error: null,
    accuracy: null,
    source: null,
    timestamp: null
  });

  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Obtenir la position actuelle
  const getCurrentPosition = useCallback(async (options?: GeolocationOptions): Promise<UnifiedLocation> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const location = await enhancedLocationService.getCurrentPosition(options);
      
      setState(prev => ({
        ...prev,
        currentLocation: location,
        lastKnownLocation: location,
        loading: false,
        source: location.type === 'current' ? 'gps' : 'manual',
        timestamp: new Date()
      }));

      return location;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de géolocalisation';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  // Recherche de lieux
  const searchLocations = useCallback(async (
    query: string, 
    city?: string, 
    maxResults?: number
  ): Promise<LocationSearchResult[]> => {
    if (!query || query.length < 2) {
      const popular = await enhancedLocationService.getPopularLocations(city, maxResults);
      setSearchResults(popular);
      return popular;
    }

    setIsSearching(true);
    try {
      const results = await enhancedLocationService.searchLocations(query, city, maxResults);
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Recherche avec callback (pour compatibilité)
  const searchWithCallback = useCallback((
    query: string,
    callback: (results: LocationSearchResult[]) => void,
    city?: string
  ) => {
    searchLocations(query, city).then(callback);
  }, [searchLocations]);

  // Obtenir les lieux populaires
  const getPopularPlaces = useCallback(async (city?: string): Promise<LocationSearchResult[]> => {
    try {
      const popular = await enhancedLocationService.getPopularLocations(city);
      setSearchResults(popular);
      return popular;
    } catch (error) {
      console.error('Popular places error:', error);
      return [];
    }
  }, []);

  // Géocodage inverse
  const reverseGeocode = useCallback(async (coordinates: { lat: number; lng: number }): Promise<string> => {
    try {
      return await enhancedLocationService.reverseGeocode(coordinates);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
    }
  }, []);

  // Calcul de distance
  const calculateDistance = useCallback((
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    return enhancedLocationService.calculateDistance(point1, point2);
  }, []);

  // Formatage de distance
  const formatDistance = useCallback((meters: number): string => {
    return enhancedLocationService.formatDistance(meters);
  }, []);

  // Gestion de la ville courante
  const setCurrentCity = useCallback((city: string) => {
    enhancedLocationService.setCurrentCity(city);
    // Vider les résultats car la ville a changé
    setSearchResults([]);
  }, []);

  const getCurrentCity = useCallback((): CityConfig => {
    return enhancedLocationService.getCurrentCity();
  }, []);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Effacer le cache
  const clearCache = useCallback(() => {
    enhancedLocationService.clearCache();
    setSearchResults([]);
  }, []);

  // Initialisation : essayer de récupérer la position au montage
  useEffect(() => {
    getCurrentPosition({ 
      fallbackToDefault: true,
      timeout: 5000 
    }).catch(() => {
      // Ignorer l'erreur lors de l'initialisation
    });
  }, [getCurrentPosition]);

  return {
    // État
    ...state,
    searchResults,
    isSearching,

    // Actions principales
    getCurrentPosition,
    searchLocations,
    searchWithCallback, // Pour compatibilité avec l'ancien code
    getPopularPlaces,
    reverseGeocode,

    // Utilitaires
    calculateDistance,
    formatDistance,
    setCurrentCity,
    getCurrentCity,
    clearError,
    clearCache,

    // Aliases pour compatibilité
    currentPosition: state.currentLocation,
    searchPlaces: searchLocations,
    getLocation: getCurrentPosition
  };
}

// Export par défaut pour faciliter l'import
export default useEnhancedLocation;