/**
 * 🎯 HOOK GÉOLOCALISATION INTELLIGENT
 * 
 * Hook React unifié pour la géolocalisation moderne
 * Remplace useSimpleLocation avec plus de fonctionnalités
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { intelligentLocationService, LocationData, LocationSearchResult, GeolocationOptions } from '@/services/intelligentLocationService';

interface UseIntelligentLocationState {
  currentPosition: LocationData | null;
  loading: boolean;
  error: string | null;
  isTracking: boolean;
  searchResults: LocationSearchResult[];
  searchLoading: boolean;
}

export const useIntelligentLocation = () => {
  const [state, setState] = useState<UseIntelligentLocationState>({
    currentPosition: null,
    loading: false,
    error: null,
    isTracking: false,
    searchResults: [],
    searchLoading: false
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * 🎯 OBTENIR POSITION ACTUELLE
   */
  const getCurrentPosition = useCallback(async (options?: GeolocationOptions): Promise<LocationData> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const position = await intelligentLocationService.getCurrentPosition(options);
      setState(prev => ({ ...prev, currentPosition: position, loading: false }));
      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de géolocalisation';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  /**
   * 🔍 RECHERCHE DE LIEUX AVEC DEBOUNCING
   */
  const searchLocations = useCallback((query: string, callback?: (results: LocationSearchResult[]) => void) => {
    // Annuler la recherche précédente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setState(prev => ({ ...prev, searchLoading: true }));

    // Debouncing de 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await intelligentLocationService.searchLocations(query);
        setState(prev => ({ 
          ...prev, 
          searchResults: results, 
          searchLoading: false 
        }));
        
        if (callback) {
          callback(results);
        }
      } catch (error) {
        console.error('Erreur recherche:', error);
        setState(prev => ({ 
          ...prev, 
          searchResults: [], 
          searchLoading: false 
        }));
        
        if (callback) {
          callback([]);
        }
      }
    }, 300);
  }, []);

  /**
   * 🏆 OBTENIR LIEUX POPULAIRES
   */
  const getPopularPlaces = useCallback((): LocationSearchResult[] => {
    return intelligentLocationService.getPopularPlaces();
  }, []);

  /**
   * 📏 CALCULER DISTANCE
   */
  const calculateDistance = useCallback((
    point1: { lat: number; lng: number }, 
    point2: { lat: number; lng: number }
  ): number => {
    return intelligentLocationService.calculateDistance(point1, point2);
  }, []);

  /**
   * 📝 FORMATER DISTANCE
   */
  const formatDistance = useCallback((meters: number): string => {
    return intelligentLocationService.formatDistance(meters);
  }, []);

  /**
   * ❌ EFFACER ERREUR
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * 🎯 DÉMARRER SUIVI
   */
  const startTracking = useCallback(async (options?: GeolocationOptions): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isTracking: true, error: null }));
      
      await intelligentLocationService.startTracking(
        (position) => {
          setState(prev => ({ ...prev, currentPosition: position }));
        },
        options
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de suivi';
      setState(prev => ({ ...prev, error: errorMessage, isTracking: false }));
      throw error;
    }
  }, []);

  /**
   * ⏹️ ARRÊTER SUIVI
   */
  const stopTracking = useCallback(() => {
    intelligentLocationService.stopTracking();
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  /**
   * 🏙️ DÉFINIR VILLE ACTUELLE
   */
  const setCurrentCity = useCallback((city: string) => {
    intelligentLocationService.setCurrentCity(city);
    // Nettoyer les résultats de recherche car ils peuvent être obsolètes
    setState(prev => ({ ...prev, searchResults: [] }));
  }, []);

  /**
   * 🧹 NETTOYAGE AU DÉMONTAGE
   */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      intelligentLocationService.stopTracking();
    };
  }, []);

  return {
    // États
    currentPosition: state.currentPosition,
    loading: state.loading,
    error: state.error,
    isTracking: state.isTracking,
    searchResults: state.searchResults,
    searchLoading: state.searchLoading,

    // Actions
    getCurrentPosition,
    searchLocations,
    getPopularPlaces,
    calculateDistance,
    formatDistance,
    clearError,
    startTracking,
    stopTracking,
    setCurrentCity
  };
};