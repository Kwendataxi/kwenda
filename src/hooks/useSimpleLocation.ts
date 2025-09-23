/**
 * Hook de géolocalisation ultra-simplifié
 * Remplace tous les autres hooks de géolocalisation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { simpleLocationService, type LocationData, type LocationSearchResult, type GeolocationOptions } from '@/services/simpleLocationService';

interface UseSimpleLocationState {
  currentPosition: LocationData | null;
  loading: boolean;
  error: string | null;
  isTracking: boolean;
}

export const useSimpleLocation = () => {
  const [state, setState] = useState<UseSimpleLocationState>({
    currentPosition: null,
    loading: false,
    error: null,
    isTracking: false
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Obtenir la position actuelle avec options avancées
   */
  const getCurrentPosition = useCallback(async (options?: GeolocationOptions): Promise<LocationData> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await simpleLocationService.getCurrentPosition(options);
      
      setState(prev => ({
        ...prev,
        currentPosition: position,
        loading: false,
        error: null
      }));

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de géolocalisation';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      // Retourner position par défaut même en cas d'erreur
      const defaultPosition: LocationData = {
        address: 'Kinshasa Centre, République Démocratique du Congo',
        lat: -4.3217,
        lng: 15.3069,
        type: 'default'
      };

      setState(prev => ({
        ...prev,
        currentPosition: defaultPosition
      }));

      return defaultPosition;
    }
  }, []);

  /**
   * Rechercher des lieux avec debouncing
   */
  const searchLocations = useCallback(async (
    query: string,
    callback: (results: LocationSearchResult[]) => void
  ): Promise<void> => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await simpleLocationService.searchLocations(query);
        callback(results);
      } catch (error) {
        console.error('Erreur de recherche:', error);
        callback([]);
      }
    }, 300);
  }, []);

  /**
   * Obtenir les lieux populaires
   */
  const getPopularPlaces = useCallback((): LocationSearchResult[] => {
    return simpleLocationService.getPopularPlaces();
  }, []);

  /**
   * Calculer la distance entre deux points
   */
  const calculateDistance = useCallback((
    point1: { lat: number; lng: number }, 
    point2: { lat: number; lng: number }
  ): number => {
    return simpleLocationService.calculateDistance(point1, point2);
  }, []);

  /**
   * Formater la distance
   */
  const formatDistance = useCallback((meters: number): string => {
    return simpleLocationService.formatDistance(meters);
  }, []);

  /**
   * Effacer les erreurs
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Commencer le suivi en temps réel
   */
  const startTracking = useCallback(async (options?: GeolocationOptions): Promise<void> => {
    if (state.isTracking) {
      console.warn('⚠️ Suivi déjà en cours');
      return;
    }

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    try {
      await simpleLocationService.startTracking(
        (position: LocationData) => {
          setState(prev => ({
            ...prev,
            currentPosition: position,
            error: null
          }));
        },
        {
          enableHighAccuracy: true,
          interval: 5000, // 5 secondes par défaut
          distanceFilter: 10, // 10 mètres minimum
          ...options
        }
      );
      console.log('🎯 Suivi démarré');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isTracking: false,
        error: error instanceof Error ? error.message : 'Erreur de tracking'
      }));
    }
  }, [state.isTracking]);

  /**
   * Arrêter le suivi en temps réel
   */
  const stopTracking = useCallback((): void => {
    if (!state.isTracking) {
      return;
    }

    simpleLocationService.stopTracking();
    setState(prev => ({ ...prev, isTracking: false }));
    console.log('🛑 Suivi arrêté');
  }, [state.isTracking]);

  /**
   * Définir la ville actuelle
   */
  const setCurrentCity = useCallback((city: string): void => {
    simpleLocationService.setCurrentCity(city);
  }, []);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (state.isTracking) {
        simpleLocationService.stopTracking();
      }
    };
  }, [state.isTracking]);

  return {
    // État
    currentPosition: state.currentPosition,
    loading: state.loading,
    error: state.error,
    isTracking: state.isTracking,

    // Actions
    getCurrentPosition,
    searchLocations,
    getPopularPlaces,
    calculateDistance,
    formatDistance,
    clearError,
    setCurrentCity,
    startTracking,
    stopTracking,

    // Alias pour compatibilité
    isLoading: state.loading,
    position: state.currentPosition
  };
};