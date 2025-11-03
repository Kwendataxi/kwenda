/**
 * Hook pour l'autocomplétion Google Places
 * Utilise useSmartGeolocation en arrière-plan
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSmartGeolocation, LocationSearchResult } from './useSmartGeolocation';

interface Prediction {
  placeId: string;
  description: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
  };
  types: string[];
  matchedSubstrings: Array<{ offset: number; length: number }>;
}

interface PlaceDetails {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  placeId: string;
  types?: string[];
}

interface UseGooglePlacesAutocompleteOptions {
  location?: { lat: number; lng: number };
  types?: string[];
  debounceMs?: number;
}

export const useGooglePlacesAutocomplete = (options: UseGooglePlacesAutocompleteOptions = {}) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { searchLocations, loading: geoLoading, error: geoError } = useSmartGeolocation();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Convertir LocationSearchResult en Prediction
  const convertToPrediction = (result: LocationSearchResult): Prediction => ({
    placeId: result.placeId || result.id,
    description: result.address,
    structuredFormatting: {
      mainText: result.name || result.title || result.address,
      secondaryText: result.subtitle || ''
    },
    types: result.type ? [result.type] : [],
    matchedSubstrings: []
  });

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setPredictions([]);
      return;
    }

    // Annuler la recherche précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await searchLocations(query);
        const convertedPredictions = results.map(convertToPrediction);
        setPredictions(convertedPredictions);
      } catch (err: any) {
        console.error('Erreur recherche places:', err);
        setError(err.message || 'Erreur de recherche');
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    }, options.debounceMs || 300);
  }, [searchLocations, options.debounceMs]);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      // Rechercher dans les prédictions existantes
      const prediction = predictions.find(p => p.placeId === placeId);
      
      if (!prediction) {
        return null;
      }

      // Pour les lieux populaires ou déjà géocodés, retourner directement
      return {
        id: placeId,
        name: prediction.structuredFormatting.mainText,
        address: prediction.description,
        coordinates: { lat: 0, lng: 0 }, // Sera remplacé par les vraies coordonnées
        placeId: placeId,
        types: prediction.types
      };
    } catch (err) {
      console.error('Erreur détails lieu:', err);
      return null;
    }
  }, [predictions]);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    predictions,
    isLoading: isLoading || geoLoading,
    error: error || geoError,
    search,
    getPlaceDetails,
    clearPredictions
  };
};
