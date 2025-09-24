/**
 * Hook de géolocalisation unifié - Solution définitive
 * Remplace useSimpleLocation avec compatibilité complète
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { enhancedLocationService } from '@/services/enhancedLocationService';
import { useModernTracking } from '@/hooks/useModernTracking';
import type { UnifiedLocation, LocationSearchResult } from '@/types/unifiedLocation';

// Interface pour la compatibilité avec LocationData
export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'database' | 'google' | 'manual' | 'ip' | 'fallback' | 'default' | 'gps';
  placeId?: string;
  accuracy?: number;
  name?: string;
  subtitle?: string;
}

// Interface pour la compatibilité avec LocationSearchResult
export interface SimpleLocationSearchResult {
  id: string;
  title?: string;
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'database' | 'google' | 'manual' | 'ip' | 'fallback' | 'default' | 'gps';
  placeId?: string;
  name?: string;
  subtitle?: string;
  isPopular?: boolean;
}

interface UseUnifiedLocationState {
  currentPosition: LocationData | null;
  loading: boolean;
  error: string | null;
  isTracking: boolean;
}

export const useUnifiedLocation = () => {
  const [state, setState] = useState<UseUnifiedLocationState>({
    currentPosition: null,
    loading: false,
    error: null,
    isTracking: false
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const { 
    startTracking: startModernTracking, 
    stopTracking: stopModernTracking,
    isTracking: modernTrackingActive,
    getCurrentPosition: getModernPosition,
    error: trackingError
  } = useModernTracking();

  // Convertir UnifiedLocation vers LocationData pour compatibilité
  const convertToLocationData = useCallback((unified: UnifiedLocation): LocationData => {
    return {
      address: unified.address,
      lat: unified.coordinates.lat,
      lng: unified.coordinates.lng,
      type: unified.type as any,
      placeId: unified.placeId,
      accuracy: unified.accuracy,
      name: unified.name,
      subtitle: unified.subtitle
    };
  }, []);

  // Convertir LocationSearchResult vers SimpleLocationSearchResult
  const convertSearchResult = useCallback((result: LocationSearchResult): SimpleLocationSearchResult => {
    return {
      id: result.id,
      title: result.name,
      address: result.address,
      lat: result.coordinates.lat,
      lng: result.coordinates.lng,
      type: result.type,
      placeId: result.placeId,
      name: result.name,
      subtitle: result.subtitle,
      isPopular: result.badge === 'Populaire'
    };
  }, []);

  /**
   * Obtenir la position actuelle avec géolocalisation moderne
   */
  const getCurrentPosition = useCallback(async (options?: any): Promise<LocationData> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Utiliser le tracking moderne si possible
      const modernPosition = getModernPosition();
      if (modernPosition && modernPosition.latitude && modernPosition.longitude) {
        const locationData: LocationData = {
          address: 'Position actuelle',
          lat: modernPosition.latitude,
          lng: modernPosition.longitude,
          type: 'current',
          accuracy: modernPosition.accuracy || undefined,
          name: 'Position actuelle'
        };
        
        setState(prev => ({
          ...prev,
          currentPosition: locationData,
          loading: false,
          error: null
        }));

        return locationData;
      }

      // Fallback vers enhanced location service
      const unifiedPosition = await enhancedLocationService.getCurrentPosition(options);
      const locationData = convertToLocationData(unifiedPosition);
      
      setState(prev => ({
        ...prev,
        currentPosition: locationData,
        loading: false,
        error: null
      }));

      return locationData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de géolocalisation';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      // Retourner position par défaut de Kinshasa
      const defaultPosition: LocationData = {
        address: 'Kinshasa Centre, République Démocratique du Congo',
        lat: -4.3217,
        lng: 15.3069,
        type: 'manual',
        name: 'Kinshasa Centre'
      };

      setState(prev => ({
        ...prev,
        currentPosition: defaultPosition
      }));

      return defaultPosition;
    }
  }, [getModernPosition, convertToLocationData]);

  /**
   * Rechercher des lieux avec enhanced service
   */
  const searchLocations = useCallback(async (
    query: string,
    callback?: (results: SimpleLocationSearchResult[]) => void
  ): Promise<SimpleLocationSearchResult[]> => {
    try {
      const results = await enhancedLocationService.searchLocations(query);
      const convertedResults = results.map(convertSearchResult);
      
      if (callback) {
        callback(convertedResults);
      }
      
      return convertedResults;
    } catch (error) {
      console.error('Erreur de recherche:', error);
      // Fallback vers lieux populaires en cas d'erreur
      try {
        // Utiliser des lieux populaires statiques en fallback
        const convertedPopular = getPopularPlaces();
        
        if (callback) {
          callback(convertedPopular);
        }
        
        return convertedPopular;
      } catch (popularError) {
        console.error('Erreur récupération lieux populaires:', popularError);
        if (callback) {
          callback([]);
        }
        return [];
      }
    }
  }, [convertSearchResult]);

  /**
   * Version avec callback pour compatibilité useSimpleLocation
   */
  const searchLocationsWithCallback = useCallback((
    query: string,
    callback: (results: SimpleLocationSearchResult[]) => void
  ): void => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search avec enhanced service
    searchTimeoutRef.current = setTimeout(async () => {
      await searchLocations(query, callback);
    }, 300);
  }, [searchLocations]);

  /**
   * Obtenir les lieux populaires
   */
  const getPopularPlaces = useCallback((): SimpleLocationSearchResult[] => {
    try {
      // Retourner des lieux populaires statiques pour compatibilité immédiate
      return [
        {
          id: 'popular-1',
          title: 'Aéroport de N\'Djili',
          address: 'Aéroport International de Kinshasa',
          lat: -4.3857,
          lng: 15.4446,
          type: 'popular',
          name: 'Aéroport de N\'Djili',
          isPopular: true
        },
        {
          id: 'popular-2', 
          title: 'Centre-ville Kinshasa',
          address: 'Gombe, Kinshasa',
          lat: -4.3166,
          lng: 15.2963,
          type: 'popular',
          name: 'Centre-ville',
          isPopular: true
        },
        {
          id: 'popular-3',
          title: 'Université de Kinshasa',
          address: 'Mont Amba, Kinshasa',
          lat: -4.4325,
          lng: 15.3531,
          type: 'popular', 
          name: 'UNIKIN',
          isPopular: true
        },
        {
          id: 'popular-4',
          title: 'Marché Central',
          address: 'Kinshasa Centre',
          lat: -4.3217,
          lng: 15.3069,
          type: 'popular',
          name: 'Marché Central',
          isPopular: true
        }
      ];
    } catch (error) {
      console.error('Erreur récupération lieux populaires:', error);
      return [];
    }
  }, []);

  /**
   * Calculer la distance entre deux points
   */
  const calculateDistance = useCallback((
    point1: { lat: number; lng: number }, 
    point2: { lat: number; lng: number }
  ): number => {
    return enhancedLocationService.calculateDistance(point1, point2);
  }, []);

  /**
   * Formater la distance
   */
  const formatDistance = useCallback((meters: number): string => {
    return enhancedLocationService.formatDistance(meters);
  }, []);

  /**
   * Effacer les erreurs
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Commencer le suivi moderne en arrière-plan
   */
  const startTracking = useCallback(async (options?: any): Promise<void> => {
    if (state.isTracking || modernTrackingActive) {
      console.warn('⚠️ Suivi déjà en cours');
      return;
    }

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    try {
      // Démarrer le tracking moderne pour une meilleure précision
      const success = await startModernTracking({
        enableHighAccuracy: true,
        distanceFilterMeters: 10,
        minIntervalMs: 5000,
        ...options
      });

      if (success) {
        console.log('🎯 Suivi moderne démarré avec succès');
      } else {
        throw new Error('Impossible de démarrer le suivi moderne');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isTracking: false,
        error: error instanceof Error ? error.message : 'Erreur de tracking moderne'
      }));
      console.error('❌ Erreur démarrage tracking:', error);
    }
  }, [state.isTracking, modernTrackingActive, startModernTracking]);

  /**
   * Arrêter le suivi moderne
   */
  const stopTracking = useCallback((): void => {
    if (!state.isTracking && !modernTrackingActive) {
      return;
    }

    try {
      stopModernTracking();
      setState(prev => ({ ...prev, isTracking: false }));
      console.log('🛑 Suivi moderne arrêté');
    } catch (error) {
      console.error('❌ Erreur arrêt tracking:', error);
    }
  }, [state.isTracking, modernTrackingActive, stopModernTracking]);

  /**
   * Définir la ville actuelle
   */
  const setCurrentCity = useCallback((city: string): void => {
    enhancedLocationService.setCurrentCity(city);
  }, []);

  // Cleanup tracking on unmount + sync des erreurs
  useEffect(() => {
    // Synchroniser les erreurs de tracking moderne
    if (trackingError) {
      setState(prev => ({ ...prev, error: trackingError }));
    }
  }, [trackingError]);

  useEffect(() => {
    // Synchroniser l'état du tracking moderne
    setState(prev => ({ ...prev, isTracking: modernTrackingActive }));
  }, [modernTrackingActive]);

  useEffect(() => {
    return () => {
      if (state.isTracking || modernTrackingActive) {
        stopModernTracking();
      }
    };
  }, [state.isTracking, modernTrackingActive, stopModernTracking]);

  return {
    // État
    currentPosition: state.currentPosition,
    loading: state.loading,
    error: state.error,
    isTracking: state.isTracking,

    // Actions
    getCurrentPosition,
    searchLocations: searchLocationsWithCallback, // Version avec callback pour compatibilité
    searchLocationsAsync: searchLocations, // Version async moderne
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

// Export pour remplacer useSimpleLocation
export const useSimpleLocation = useUnifiedLocation;