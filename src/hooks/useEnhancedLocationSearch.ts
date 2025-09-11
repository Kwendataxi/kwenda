/**
 * Hook unifié pour la recherche de lieux enrichie avec Google Places API
 * Intègre le nouveau service Google Places enrichi
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { enhancedGooglePlacesService, type EnhancedPlaceResult } from '@/services/enhancedGooglePlacesService';
import { masterLocationService, type LocationData } from '@/services/MasterLocationService';
import { useToast } from '@/hooks/use-toast';

export interface UseEnhancedLocationSearchOptions {
  city?: string;
  category?: string;
  enableCurrentLocation?: boolean;
  enableNearbySearch?: boolean;
  maxResults?: number;
  debounceMs?: number;
}

export interface UseEnhancedLocationSearchReturn {
  // État
  results: EnhancedPlaceResult[];
  popularPlaces: EnhancedPlaceResult[];
  recentSearches: EnhancedPlaceResult[];
  isSearching: boolean;
  currentLocation: LocationData | null;
  error: string | null;
  
  // Actions
  search: (query: string) => void;
  getCurrentLocation: () => Promise<void>;
  clearResults: () => void;
  clearCache: () => void;
  setCity: (city: string) => void;
}

export const useEnhancedLocationSearch = (
  options: UseEnhancedLocationSearchOptions = {}
): UseEnhancedLocationSearchReturn => {
  const {
    city = 'Kinshasa',
    category,
    enableCurrentLocation = true,
    enableNearbySearch = true,
    maxResults = 15,
    debounceMs = 300
  } = options;

  const { toast } = useToast();
  
  // État local
  const [results, setResults] = useState<EnhancedPlaceResult[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<EnhancedPlaceResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<EnhancedPlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState(city);

  // Refs pour debouncing et cancellation
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // ============ RECHERCHE PRINCIPALE ============

  const search = useCallback(async (query: string) => {
    // Nettoyer le timer précédent
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Debouncing
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      
      try {
        // Créer un nouveau contrôleur d'abandon
        abortControllerRef.current = new AbortController();
        
        console.log('🔍 Enhanced search:', { query, city: currentCity, category });
        
        const searchResults = await enhancedGooglePlacesService.searchPlaces(
          query,
          currentCity,
          {
            category,
            userLocation: currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined,
            includeNearby: enableNearbySearch,
            maxResults
          }
        );

        // Vérifier si la requête n'a pas été annulée
        if (!abortControllerRef.current?.signal.aborted) {
          console.log('✅ Search results:', searchResults.length);
          setResults(searchResults);
          
          // Sauvegarder dans l'historique si non vide
          if (searchResults.length > 0) {
            saveToRecentSearches(searchResults[0]);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('❌ Enhanced search error:', err);
          setError(err.message || 'Erreur de recherche');
          
          // Fallback vers recherche basique
          try {
            const fallbackResults = await masterLocationService.searchLocation(query, currentLocation || undefined);
            const enhancedFallback = fallbackResults.map((result, index) => ({
              id: result.id || `fallback-${index}`,
              name: result.title || result.address.split(',')[0],
              address: result.address,
              lat: result.lat,
              lng: result.lng,
              type: result.type || 'geocoded',
              category: 'fallback'
            })) as EnhancedPlaceResult[];
            
            setResults(enhancedFallback);
          } catch (fallbackErr) {
            console.error('❌ Fallback search failed:', fallbackErr);
          }
        }
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);
  }, [currentCity, category, currentLocation, enableNearbySearch, maxResults, debounceMs]);

  // ============ GÉOLOCALISATION ============

  const getCurrentLocation = useCallback(async () => {
    if (!enableCurrentLocation) return;

    try {
      setIsSearching(true);
      console.log('📍 Getting current location...');
      
      const location = await masterLocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        fallbackToIP: true,
        fallbackToDatabase: true
      });
      
      console.log('✅ Current location:', location);
      setCurrentLocation(location);
      
      toast({
        title: "📍 Position trouvée",
        description: location.address,
        duration: 3000
      });
      
    } catch (err: any) {
      console.error('❌ Geolocation error:', err);
      setError(err.message || 'Impossible de localiser');
      
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  }, [enableCurrentLocation, toast]);

  // ============ LIEUX POPULAIRES ============

  const loadPopularPlaces = useCallback(async () => {
    try {
      const places = enhancedGooglePlacesService.getPopularPlaces(currentCity);
      console.log('🌟 Popular places loaded:', places.length);
      setPopularPlaces(places);
    } catch (err) {
      console.error('❌ Error loading popular places:', err);
    }
  }, [currentCity]);

  // ============ HISTORIQUE ============

  const loadRecentSearches = useCallback(() => {
    try {
      const saved = localStorage.getItem(`recent_searches_${currentCity}`);
      if (saved) {
        const parsed = JSON.parse(saved) as EnhancedPlaceResult[];
        setRecentSearches(parsed.slice(0, 5)); // Garder les 5 derniers
      }
    } catch (err) {
      console.error('❌ Error loading recent searches:', err);
    }
  }, [currentCity]);

  const saveToRecentSearches = useCallback((place: EnhancedPlaceResult) => {
    try {
      const current = recentSearches.filter(item => item.id !== place.id);
      const updated = [place, ...current].slice(0, 5);
      
      setRecentSearches(updated);
      localStorage.setItem(`recent_searches_${currentCity}`, JSON.stringify(updated));
    } catch (err) {
      console.error('❌ Error saving to recent searches:', err);
    }
  }, [recentSearches, currentCity]);

  // ============ ACTIONS UTILITAIRES ============

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    enhancedGooglePlacesService.clearCache();
    masterLocationService.clearCache();
    localStorage.removeItem(`recent_searches_${currentCity}`);
    setRecentSearches([]);
    toast({
      title: "Cache vidé",
      description: "Toutes les données mises en cache ont été supprimées"
    });
  }, [currentCity, toast]);

  const setCity = useCallback((newCity: string) => {
    console.log('🏙️ Changing city:', newCity);
    setCurrentCity(newCity);
    setResults([]);
    setError(null);
  }, []);

  // ============ EFFETS ============

  // Charger les lieux populaires au changement de ville
  useEffect(() => {
    loadPopularPlaces();
  }, [loadPopularPlaces]);

  // Charger l'historique au changement de ville
  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  // Géolocalisation automatique au montage si autorisée
  useEffect(() => {
    if (enableCurrentLocation && !currentLocation) {
      getCurrentLocation();
    }
  }, [enableCurrentLocation, currentLocation, getCurrentLocation]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // État
    results,
    popularPlaces,
    recentSearches,
    isSearching,
    currentLocation,
    error,
    
    // Actions
    search,
    getCurrentLocation,
    clearResults,
    clearCache,
    setCity
  };
};