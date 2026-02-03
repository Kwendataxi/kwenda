import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentCity } from '@/types/unifiedLocation';
import { googleMapsLoader } from '@/services/googleMapsLoader';

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

// ==========================================
// 🆕 CLIENT-SIDE GOOGLE PLACES FALLBACK
// ==========================================

/**
 * Détecte si l'erreur indique un problème de clé avec restrictions referrer
 */
const isReferrerRestrictionError = (error: any, data: any): boolean => {
  const errorMessage = error?.message || data?.error || '';
  return (
    errorMessage.includes('REQUEST_DENIED') ||
    errorMessage.includes('referer restrictions') ||
    errorMessage.includes('API keys with referer') ||
    (error?.status === 500 && data?.predictions?.length === 0)
  );
};

/**
 * Service singleton pour le fallback client-side
 */
class ClientSidePlacesService {
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private sessionToken: google.maps.places.AutocompleteSessionToken | null = null;
  private dummyDiv: HTMLDivElement | null = null;
  private isReady = false;

  async ensureReady(): Promise<boolean> {
    if (this.isReady && this.autocompleteService && this.placesService) {
      return true;
    }

    try {
      // Charger Google Maps via le loader unifié
      await googleMapsLoader.load(['places', 'geometry']);
      
      // Vérifier que l'API Places est disponible
      if (!window.google?.maps?.places) {
        console.error('❌ Google Maps Places library not available');
        return false;
      }

      // Créer les services
      this.autocompleteService = new window.google.maps.places.AutocompleteService();
      
      // PlacesService nécessite un élément DOM ou une Map
      this.dummyDiv = document.createElement('div');
      this.placesService = new window.google.maps.places.PlacesService(this.dummyDiv);
      
      // Créer un session token pour optimiser la facturation
      this.sessionToken = new window.google.maps.places.AutocompleteSessionToken();
      
      this.isReady = true;
      console.log('✅ Client-side Places API ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize client-side Places:', error);
      return false;
    }
  }

  refreshSessionToken(): void {
    if (window.google?.maps?.places) {
      this.sessionToken = new window.google.maps.places.AutocompleteSessionToken();
    }
  }

  async getAutocompletePredictions(
    input: string,
    locationBias: { lat: number; lng: number },
    radius: number,
    language: string
  ): Promise<AutocompletePrediction[]> {
    if (!this.autocompleteService) {
      throw new Error('AutocompleteService not initialized');
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        locationBias: new window.google.maps.Circle({
          center: locationBias,
          radius
        }),
        language,
        componentRestrictions: { country: ['cd', 'ci'] }, // RDC + Côte d'Ivoire
        sessionToken: this.sessionToken!
      };

      this.autocompleteService!.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const mapped: AutocompletePrediction[] = predictions.map(pred => ({
            placeId: pred.place_id || '',
            description: pred.description || '',
            structuredFormatting: {
              mainText: pred.structured_formatting?.main_text || '',
              secondaryText: pred.structured_formatting?.secondary_text || ''
            },
            types: pred.types || [],
            matchedSubstrings: (pred.matched_substrings || []).map(m => ({
              offset: m.offset,
              length: m.length
            })),
            terms: (pred.terms || []).map(t => ({
              offset: t.offset,
              value: t.value
            }))
          }));
          resolve(mapped);
        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          console.warn('⚠️ Client Places API status:', status);
          resolve([]);
        }
      });
    });
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.placesService) {
      throw new Error('PlacesService not initialized');
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['geometry', 'formatted_address', 'name', 'types', 'place_id'],
        sessionToken: this.sessionToken!
      };

      this.placesService!.getDetails(request, (place, status) => {
        // Rafraîchir le session token après getDetails (fin de session billable)
        this.refreshSessionToken();

        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const result: PlaceDetails = {
            id: place.place_id || placeId,
            placeId: place.place_id || placeId,
            name: place.name || '',
            address: place.formatted_address || '',
            coordinates: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0
            },
            types: place.types || []
          };
          resolve(result);
        } else {
          console.warn('⚠️ Client PlaceDetails status:', status);
          resolve(null);
        }
      });
    });
  }
}

// Instance singleton
const clientPlacesService = new ClientSidePlacesService();

// ==========================================
// 🎯 MAIN HOOK
// ==========================================

export const useGooglePlacesAutocomplete = (
  options: UseGooglePlacesAutocompleteOptions = {}
): UseGooglePlacesAutocompleteReturn => {
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken] = useState(() => crypto.randomUUID());
  
  // 🆕 Flag pour basculer en mode client-side si Edge Function échoue
  const forceClientProvider = useRef(false);
  const requestIdRef = useRef(0);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const {
    location,
    radius = 50000,
    types = [],
    language = 'fr',
    debounceMs = 300
  } = options;

  // ✅ Use useMemo to stabilize locationBias
  const locationBias = useMemo(() => {
    if (location) return location;
    
    const currentCity = getCurrentCity();
    if (currentCity?.defaultCoordinates) {
      return currentCity.defaultCoordinates;
    }
    
    // Default to Kinshasa if no location detected
    return { lat: -4.3217, lng: 15.3069 };
  }, [location]);

  // 🆕 Search via client-side Google Maps JS API
  const searchWithClientApi = useCallback(async (input: string, currentRequestId: number): Promise<AutocompletePrediction[]> => {
    const isReady = await clientPlacesService.ensureReady();
    if (!isReady) {
      throw new Error('Client Places API not available');
    }

    const results = await clientPlacesService.getAutocompletePredictions(
      input,
      locationBias,
      radius,
      language
    );

    // Vérifier que cette requête est toujours la plus récente
    if (currentRequestId !== requestIdRef.current) {
      return []; // Ignorer les résultats obsolètes
    }

    return results;
  }, [locationBias, radius, language]);

  // 🆕 Search via Edge Function (original behavior)
  const searchWithEdgeFunction = useCallback(async (input: string): Promise<{ predictions: AutocompletePrediction[], shouldFallback: boolean }> => {
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

      // Détecter si on doit basculer vers le client-side
      if (isReferrerRestrictionError(supabaseError, data)) {
        console.warn('⚠️ Edge Function blocked by referer restriction, switching to client-side');
        return { predictions: [], shouldFallback: true };
      }

      if (supabaseError) {
        console.error('Autocomplete error:', supabaseError);
        return { predictions: [], shouldFallback: false };
      }

      if (data?.error) {
        // Vérifier si c'est une erreur de restriction
        if (isReferrerRestrictionError(null, data)) {
          console.warn('⚠️ API error indicates referer restriction, switching to client-side');
          return { predictions: [], shouldFallback: true };
        }
        console.error('API error:', data.error);
        return { predictions: [], shouldFallback: false };
      }

      return { predictions: data?.predictions || [], shouldFallback: false };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { predictions: [], shouldFallback: false };
      }
      console.error('Search error:', err);
      return { predictions: [], shouldFallback: false };
    }
  }, [language, radius, types, sessionToken, locationBias]);

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

      // Incrémenter le request ID pour le pattern "latest wins"
      const currentRequestId = ++requestIdRef.current;

      try {
        // 🆕 Si on a déjà détecté que l'Edge Function ne marche pas, aller directement en client-side
        if (forceClientProvider.current) {
          console.log('🔄 Using client-side Places API (forced)');
          const results = await searchWithClientApi(input.trim(), currentRequestId);
          
          if (currentRequestId === requestIdRef.current) {
            setPredictions(results);
          }
        } else {
          // Essayer d'abord l'Edge Function
          const { predictions: edgePredictions, shouldFallback } = await searchWithEdgeFunction(input.trim());

          if (shouldFallback) {
            // Basculer définitivement vers le client-side pour cette session
            forceClientProvider.current = true;
            console.log('🔄 Switching to client-side Places API permanently');
            
            // Réessayer avec le client-side
            const results = await searchWithClientApi(input.trim(), currentRequestId);
            
            if (currentRequestId === requestIdRef.current) {
              setPredictions(results);
            }
          } else {
            if (currentRequestId === requestIdRef.current) {
              setPredictions(edgePredictions);
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && currentRequestId === requestIdRef.current) {
          console.error('Search error:', err);
          setError('Recherche indisponible');
          setPredictions([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, debounceMs);
  }, [searchWithEdgeFunction, searchWithClientApi, debounceMs]);

  // 🆕 Get place details with fallback support
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      setError(null);

      // 🆕 Si on utilise le client-side, aller directement
      if (forceClientProvider.current) {
        console.log('📍 Getting place details via client-side API');
        return await clientPlacesService.getPlaceDetails(placeId);
      }

      // Essayer l'Edge Function
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

      // Détecter si on doit basculer
      if (isReferrerRestrictionError(supabaseError, data)) {
        console.warn('⚠️ Edge Function place-details blocked, switching to client-side');
        forceClientProvider.current = true;
        return await clientPlacesService.getPlaceDetails(placeId);
      }

      if (supabaseError) {
        console.error('Place details error:', supabaseError);
        setError('Erreur lors de la récupération des détails');
        return null;
      }

      if (data?.error) {
        if (isReferrerRestrictionError(null, data)) {
          console.warn('⚠️ API error indicates referer restriction for details');
          forceClientProvider.current = true;
          return await clientPlacesService.getPlaceDetails(placeId);
        }
        console.error('API error:', data.error);
        setError(data.error);
        return null;
      }

      return data?.result || null;
      
    } catch (err) {
      console.error('Get place details error:', err);
      
      // Tenter le fallback client-side en cas d'erreur
      try {
        console.log('🔄 Fallback to client-side for place details');
        forceClientProvider.current = true;
        return await clientPlacesService.getPlaceDetails(placeId);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError('Erreur de connexion');
        return null;
      }
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
