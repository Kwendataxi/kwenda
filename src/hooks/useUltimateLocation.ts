/**
 * 🚀 HOOK DE GÉOLOCALISATION ULTIME
 * Interface React pour le service de géolocalisation de dernière génération
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ultimateLocationService, 
  UltimateLocationData, 
  LocationSearchResult, 
  GeolocationConfig 
} from '@/services/ultimateLocationService';

interface UseUltimateLocationOptions extends GeolocationConfig {
  autoDetect?: boolean;
  continuous?: boolean;
}

interface LocationState {
  location: UltimateLocationData | null;
  loading: boolean;
  error: string | null;
  isTracking: boolean;
  accuracy: number | null;
  confidence: number | null;
  source: string | null;
}

export function useUltimateLocation(options: UseUltimateLocationOptions = {}) {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    isTracking: false,
    accuracy: null,
    confidence: null,
    source: null
  });

  const trackingRef = useRef<boolean>(false);
  const locationUpdateCallbackRef = useRef<((position: UltimateLocationData) => void) | null>(null);

  /**
   * 🎯 Obtenir la position actuelle avec la meilleure précision possible
   */
  const getCurrentPosition = useCallback(async (config?: GeolocationConfig): Promise<UltimateLocationData | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🚀 [useUltimate] Recherche position...');
      
      const position = await ultimateLocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 40000,
        fallbackToIP: false,
        useNetworkLocation: false,
        minAccuracy: 20,
        ...config
      });

      setState(prev => ({
        ...prev,
        location: position,
        loading: false,
        accuracy: position.accuracy,
        confidence: position.confidence,
        source: position.source,
        error: null
      }));

      console.log(`✅ [useUltimate] Position obtenue: ${position.source} (±${position.accuracy}m, ${position.confidence}%)`);
      return position;

    } catch (error: any) {
      console.error('❌ [useUltimate] Erreur géolocalisation:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Impossible de localiser'
      }));
      return null;
    }
  }, []);

  /**
   * 🔍 Rechercher des lieux avec intelligence avancée
   */
  const searchPlaces = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    try {
      if (!query.trim()) {
        return ultimateLocationService.searchPlaces('', state.location || undefined);
      }

      console.log(`🔍 [useUltimate] Recherche: "${query}"`);
      const results = await ultimateLocationService.searchPlaces(query, state.location || undefined);
      
      console.log(`✅ [useUltimate] ${results.length} résultats trouvés`);
      return results.slice(0, 5); // Limite à 5 résultats pour interface épurée

    } catch (error: any) {
      console.error('❌ [useUltimate] Erreur recherche:', error);
      return [];
    }
  }, [state.location]);

  /**
   * 📏 Calculer une distance précise
   */
  const calculateDistance = useCallback((
    point1: { lat: number; lng: number }, 
    point2: { lat: number; lng: number }
  ): number => {
    return ultimateLocationService.calculatePreciseDistance(point1, point2);
  }, []);

  /**
   * 📐 Formater une distance
   */
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }, []);

  /**
   * 🎯 Démarrer le suivi en temps réel
   */
  const startTracking = useCallback(async (
    onLocationUpdate?: (position: UltimateLocationData) => void,
    trackingConfig?: GeolocationConfig
  ): Promise<void> => {
    if (trackingRef.current) {
      console.warn('⚠️ [useUltimate] Suivi déjà actif');
      return;
    }

    setState(prev => ({ ...prev, isTracking: true, error: null }));
    trackingRef.current = true;

    const callback = (position: UltimateLocationData) => {
      setState(prev => ({
        ...prev,
        location: position,
        accuracy: position.accuracy,
        confidence: position.confidence,
        source: position.source
      }));

      if (onLocationUpdate) {
        onLocationUpdate(position);
      }
      
      if (locationUpdateCallbackRef.current) {
        locationUpdateCallbackRef.current(position);
      }
    };

    try {
      await ultimateLocationService.startPreciseTracking(callback, {
        enableHighAccuracy: true,
        timeout: 15000,
        ...trackingConfig
      });
      
      console.log('🎯 [useUltimate] Suivi démarré');
    } catch (error: any) {
      console.error('❌ [useUltimate] Erreur suivi:', error);
      setState(prev => ({
        ...prev,
        isTracking: false,
        error: error.message || 'Erreur de suivi'
      }));
      trackingRef.current = false;
    }
  }, []);

  /**
   * 🛑 Arrêter le suivi
   */
  const stopTracking = useCallback((): void => {
    if (!trackingRef.current) return;

    ultimateLocationService.stopTracking();
    trackingRef.current = false;
    locationUpdateCallbackRef.current = null;
    
    setState(prev => ({ ...prev, isTracking: false }));
    console.log('🛑 [useUltimate] Suivi arrêté');
  }, []);

  /**
   * 🔄 Rafraîchir la position
   */
  const refreshPosition = useCallback(async (): Promise<void> => {
    await getCurrentPosition({ enableHighAccuracy: true, maximumAge: 0 });
  }, [getCurrentPosition]);

  /**
   * 📍 Obtenir les lieux populaires
   */
  const getPopularPlaces = useCallback(async (): Promise<LocationSearchResult[]> => {
    return await searchPlaces('');
  }, [searchPlaces]);

  // Auto-détection au montage
  useEffect(() => {
    if (options.autoDetect && !state.location && !state.loading) {
      getCurrentPosition();
    }
  }, [options.autoDetect, state.location, state.loading, getCurrentPosition]);

  // Suivi continu
  useEffect(() => {
    if (options.continuous && !trackingRef.current) {
      startTracking();
    }

    return () => {
      if (options.continuous && trackingRef.current) {
        stopTracking();
      }
    };
  }, [options.continuous, startTracking, stopTracking]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (trackingRef.current) {
        ultimateLocationService.stopTracking();
        trackingRef.current = false;
      }
    };
  }, []);

  return {
    // État actuel
    location: state.location,
    loading: state.loading,
    error: state.error,
    isTracking: state.isTracking,
    accuracy: state.accuracy,
    confidence: state.confidence,
    source: state.source,
    
    // Actions
    getCurrentPosition,
    searchPlaces,
    calculateDistance,
    formatDistance,
    startTracking,
    stopTracking,
    refreshPosition,
    getPopularPlaces,
    
    // Utilitaires
    hasLocation: !!state.location,
    isPrecise: (state.accuracy || 1000) <= 100,
    isHighConfidence: (state.confidence || 0) >= 70
  };
}

export default useUltimateLocation;