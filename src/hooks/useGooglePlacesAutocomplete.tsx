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
  
  // 🆕 Stocker les résultats originaux avec coordonnées
  const resultsMapRef = useRef<Map<string, LocationSearchResult>>(new Map());
  
  // 🆕 PHASE 2.4: Cache des détails de lieux pour éviter appels répétés
  const placeDetailsCache = useRef<Map<string, { details: PlaceDetails; timestamp: number }>>(new Map());
  const DETAILS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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
        
        // 🆕 Stocker les résultats avec leurs coordonnées
        results.forEach(r => {
          resultsMapRef.current.set(r.id, r);
          if (r.placeId) resultsMapRef.current.set(r.placeId, r);
        });
        
        const convertedPredictions = results.map(convertToPrediction);
        setPredictions(convertedPredictions);
      } catch (err: any) {
        console.error('Erreur recherche places:', err);
        setError(err.message || 'Erreur de recherche');
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    }, options.debounceMs || 500);
  }, [searchLocations, options.debounceMs]);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      // Vérifier le cache d'abord
      const cached = placeDetailsCache.current.get(placeId);
      if (cached && Date.now() - cached.timestamp < DETAILS_CACHE_TTL) {
        console.log('✅ [getPlaceDetails] Coordonnées depuis cache:', cached.details);
        return cached.details;
      }
      
      console.log('📍 [getPlaceDetails] Recherche pour placeId:', placeId);
      
      // 1. Chercher d'abord dans resultsMapRef avec coordonnées valides
      const storedResult = resultsMapRef.current.get(placeId);
      
      if (storedResult && storedResult.lat !== 0 && storedResult.lng !== 0) {
        console.log('✅ [getPlaceDetails] Coordonnées trouvées dans cache:', storedResult);
        return {
          id: placeId,
          name: storedResult.name || storedResult.address,
          address: storedResult.address,
          coordinates: { lat: storedResult.lat, lng: storedResult.lng },
          placeId: placeId,
          types: storedResult.type ? [storedResult.type] : []
        };
      }
      
      // 2. 🆕 PHASE 2: Appel API google-place-details si coordonnées manquantes
      console.log('🔍 [getPlaceDetails] Récupération coordonnées via API pour:', placeId);
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: detailsData, error: detailsError } = await supabase.functions.invoke(
        'google-place-details',
        { body: { placeId } }
      );
      
      if (detailsError || !detailsData?.result?.geometry?.location) {
        console.error('❌ [getPlaceDetails] Échec récupération coordonnées:', detailsError);
        
        // Fallback: chercher dans predictions
        const prediction = predictions.find(p => p.placeId === placeId);
        if (prediction) {
          return {
            id: placeId,
            name: prediction.structuredFormatting.mainText,
            address: prediction.description,
            coordinates: { lat: 0, lng: 0 },
            placeId: placeId,
            types: prediction.types
          };
        }
        return null;
      }
      
      const location = detailsData.result.geometry.location;
      
      console.log('✅ [getPlaceDetails] Coordonnées récupérées:', location);
      
      const placeDetails: PlaceDetails = {
        id: placeId,
        name: detailsData.result.name || storedResult?.name || 'Lieu',
        address: detailsData.result.formatted_address || storedResult?.address || '',
        coordinates: { lat: location.lat, lng: location.lng },
        placeId: placeId,
        types: detailsData.result.types || []
      };
      
      // 🆕 Stocker dans le cache
      placeDetailsCache.current.set(placeId, {
        details: placeDetails,
        timestamp: Date.now()
      });
      
      // 🆕 Mettre à jour le cache avec les nouvelles coordonnées
      resultsMapRef.current.set(placeId, {
        id: placeId,
        address: placeDetails.address,
        lat: location.lat,
        lng: location.lng,
        type: 'google',
        placeId: placeId,
        name: placeDetails.name
      });
      
      return placeDetails;
      
    } catch (err) {
      console.error('❌ [getPlaceDetails] Erreur détails lieu:', err);
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
