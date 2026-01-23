import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCity } from '@/types/unifiedLocation';

interface AutocompletePrediction {
  placeId: string;
  description: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
  };
  types: string[];
  matchedSubstrings: Array<{ offset: number; length: number }>;
  terms: Array<{ offset: number; value: string }>;
}

interface PlaceDetails {
  id: string;
  placeId: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  types: string[];
}

interface UseGooglePlacesAutocompleteOptions {
  location?: { lat: number; lng: number };
  radius?: number;
  types?: string[];
  language?: string;
  debounceMs?: number;
}

interface UseGooglePlacesAutocompleteReturn {
  predictions: AutocompletePrediction[];
  isLoading: boolean;
  error: string | null;
  search: (input: string) => void;
  getPlaceDetails: (placeId: string) => Promise<PlaceDetails | null>;
  clearPredictions: () => void;
  sessionToken: string;
}

export const useGooglePlacesAutocomplete = (
  options: UseGooglePlacesAutocompleteOptions = {}
): UseGooglePlacesAutocompleteReturn => {
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useState(() => crypto.randomUUID());
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const {
    location,
    radius = 50000,
    types = [],
    language = 'fr',
    debounceMs = 300
  } = options;

  // ✅ FIX: Use useMemo instead of useCallback to stabilize locationBias
  const locationBias = useMemo(() => {
    if (location) return location;
    
    const currentCity = getCurrentCity();
    if (currentCity?.defaultCoordinates) {
      return currentCity.defaultCoordinates;
    }
    
    // Default to Kinshasa if no location detected
    return { lat: -4.3217, lng: 15.3069 };
  }, [location]);

  const search = useCallback((input: string) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!input || input.trim().length < 2) {
      setPredictions([]);
      setError(null);
      return;
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        abortControllerRef.current = new AbortController();
        
        const { data, error: supabaseError } = await supabase.functions.invoke(
          'google-places-autocomplete',
          {
            body: {
              input: input.trim(),
              lat: locationBias.lat,
              lng: locationBias.lng,
              radius,
              types,
              language,
              sessionToken
            }
          }
        );

        if (supabaseError) {
          console.error('Autocomplete error:', supabaseError);
          setError('Erreur lors de la recherche');
          setPredictions([]);
          return;
        }

        if (data?.error) {
          console.error('API error:', data.error);
          setError(data.error);
          setPredictions([]);
          return;
        }

        setPredictions(data?.predictions || []);
        
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
          setError('Erreur de connexion');
          setPredictions([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [language, radius, types, sessionToken, locationBias, debounceMs]);

  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      setError(null);

      const { data, error: supabaseError } = await supabase.functions.invoke(
        'google-place-details',
        {
          body: {
            placeId,
            sessionToken,
            fields: ['geometry', 'formatted_address', 'name', 'types', 'place_id']
          }
        }
      );

      if (supabaseError) {
        console.error('Place details error:', supabaseError);
        setError('Erreur lors de la récupération des détails');
        return null;
      }

      if (data?.error) {
        console.error('API error:', data.error);
        setError(data.error);
        return null;
      }

      return data?.result || null;
      
    } catch (err) {
      console.error('Get place details error:', err);
      setError('Erreur de connexion');
      return null;
    }
  }, [sessionToken]);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
    
    // Cancel ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    predictions,
    isLoading,
    error,
    search,
    getPlaceDetails,
    clearPredictions,
    sessionToken
  };
};
