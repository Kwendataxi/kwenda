/**
 * Hook pour utiliser le système de recherche d'adresses intelligent temps réel
 * Maintenant unifié avec LocationService
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationService, type LocationSearchResult } from '@/services/LocationService';
import { useUnifiedLocation } from './useUnifiedLocation';

// Types redéfinis localement pour compatibilité
export interface IntelligentSearchResult {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  type: 'google' | 'database' | 'search';
  city: string;
  commune: string;
  category: string;
  confidence: number;
}

interface UseIntelligentAddressSearchProps {
  city?: string;
  country_code?: string;
  maxResults?: number;
  minHierarchyLevel?: number;
  includeGoogleFallback?: boolean;
  autoSearchOnMount?: boolean;
  enableVoiceSearch?: boolean;
  cacheResults?: boolean;
  autoDetectCity?: boolean;
  realtimeSearch?: boolean;
  debounceMs?: number;
}

interface UseIntelligentAddressSearchReturn {
  results: IntelligentSearchResult[];
  recentSearches: IntelligentSearchResult[];
  popularPlaces: IntelligentSearchResult[];
  isSearching: boolean;
  hasHistory: boolean;
  currentCity: string;
  location: any;
  error: string | null;
  search: (query: string, options?: any) => Promise<void>;
  searchWithLocation: (query: string) => Promise<void>;
  getPopularPlaces: () => Promise<void>;
  addToHistory: (result: IntelligentSearchResult) => void;
  setCity: (city: string) => void;
  clearResults: () => void;
  clearCache: () => void;
  detectCityFromLocation: () => Promise<void>;
}

export const useIntelligentAddressSearch = ({
  city = 'Kinshasa',
  country_code = 'CD',
  maxResults = 8,
  minHierarchyLevel = 1,
  includeGoogleFallback = true,
  autoSearchOnMount = false,
  enableVoiceSearch = false,
  cacheResults = true,
  autoDetectCity = false,
  realtimeSearch = true,
  debounceMs = 300
}: UseIntelligentAddressSearchProps = {}): UseIntelligentAddressSearchReturn => {

  // États
  const [results, setResults] = useState<IntelligentSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<IntelligentSearchResult[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<IntelligentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState(city);

  // Hooks et refs
  const { location } = useUnifiedLocation();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Villes disponibles avec leurs coordonnées
  const availableCities = {
    'Kinshasa': { lat: -4.4419, lng: 15.2663 },
    'Lubumbashi': { lat: -11.6792, lng: 27.4894 },
    'Kolwezi': { lat: -10.7069, lng: 25.4664 },
    'Abidjan': { lat: 5.3600, lng: -4.0083 }
  };

  // Helper pour calculer la distance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Détection automatique de la ville basée sur la localisation
  const detectCityFromLocation = useCallback(async () => {
    if (!location?.lat || !location?.lng) return;

    let closestCity = 'Kinshasa';
    let minDistance = Infinity;

    Object.entries(availableCities).forEach(([cityName, coords]) => {
      const distance = calculateDistance(location.lat, location.lng, coords.lat, coords.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = cityName;
      }
    });

    if (closestCity !== currentCity) {
      setCurrentCity(closestCity);
    }
  }, [location, currentCity]);

  // Fonction de recherche avec debouncing
  const search = useCallback(async (query: string, customOptions: any = {}) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Annuler la recherche précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Créer nouveau controller
    abortControllerRef.current = new AbortController();

    // Debouncing
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        // Recherche unifiée via LocationService
        const results = await LocationService.searchLocation(query, location, {
          city: currentCity,
          maxResults
        });
        
        // Conversion au format attendu
        const searchResults: IntelligentSearchResult[] = results.map(result => ({
          id: result.id,
          name: result.address,
          subtitle: result.subtitle || '',
          lat: result.lat,
          lng: result.lng,
          type: 'search' as const,
          city: currentCity,
          commune: result.subtitle?.split(',')[0] || '',
          category: 'lieu',
          confidence: result.confidence || 0.8
        }));

        setResults(searchResults);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de recherche';
        setError(errorMessage);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);
  }, [currentCity, location, maxResults, debounceMs]);

  // Recherche avec localisation automatique
  const searchWithLocation = useCallback(async (query: string) => {
    await search(query, {
      user_lat: location?.lat,
      user_lng: location?.lng
    });
  }, [search, location]);

  // Récupérer les lieux populaires
  const getPopularPlaces = useCallback(async () => {
    try {
      setIsSearching(true);
      
      // Utiliser getNearbyPlaces avec une position par défaut si pas de localisation
      const defaultLocation = availableCities[currentCity as keyof typeof availableCities];
      const lat = location?.lat || defaultLocation.lat;
      const lng = location?.lng || defaultLocation.lng;
      
      const places = await LocationService.getNearbyPlaces(lat, lng, 50); // 50km radius
      
      const popularResults: IntelligentSearchResult[] = places.map(place => ({
        id: place.id,
        name: place.address,
        subtitle: place.subtitle || '',
        lat: place.lat,
        lng: place.lng,
        type: 'database' as const,
        city: currentCity,
        commune: place.subtitle?.split(',')[0] || '',
        category: 'lieu populaire',
        confidence: place.confidence || 0.9
      }));

      setPopularPlaces(popularResults);
    } catch (error) {
      console.error('Erreur récupération lieux populaires:', error);
      setError('Impossible de charger les lieux populaires');
    } finally {
      setIsSearching(false);
    }
  }, [currentCity, location]);

  // Ajouter à l'historique
  const addToHistory = useCallback((result: IntelligentSearchResult) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.id !== result.id);
      const newHistory = [result, ...filtered].slice(0, 5);
      
      // Sauvegarder dans localStorage
      try {
        localStorage.setItem(`search-history-${currentCity}`, JSON.stringify(newHistory));
      } catch (error) {
        console.warn('Impossible de sauvegarder l\'historique:', error);
      }
      
      return newHistory;
    });
  }, [currentCity]);

  // Définir une nouvelle ville
  const setCity = useCallback((newCity: string) => {
    setCurrentCity(newCity);
    setResults([]);
    getPopularPlaces();
  }, [getPopularPlaces]);

  // Nettoyer les résultats
  const clearResults = useCallback(() => {
    setResults([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Nettoyer le cache
  const clearCache = useCallback(() => {
    LocationService.clearCache();
    setResults([]);
    setRecentSearches([]);
    setPopularPlaces([]);
    
    // Nettoyer localStorage
    try {
      Object.keys(availableCities).forEach(cityName => {
        localStorage.removeItem(`search-history-${cityName}`);
      });
    } catch (error) {
      console.warn('Impossible de nettoyer le cache local:', error);
    }
  }, []);

  // Effet : Détection automatique de ville
  useEffect(() => {
    if (autoDetectCity && location) {
      detectCityFromLocation();
    }
  }, [autoDetectCity, location, detectCityFromLocation]);

  // Effet : Charger les lieux populaires au montage
  useEffect(() => {
    getPopularPlaces();
  }, [currentCity]);

  // Effet : Charger l'historique local
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(`search-history-${currentCity}`);
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setRecentSearches(history);
      }
    } catch (error) {
      console.warn('Impossible de charger l\'historique:', error);
    }
  }, [currentCity]);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    recentSearches,
    popularPlaces,
    isSearching,
    hasHistory: recentSearches.length > 0,
    currentCity,
    location,
    error,
    search,
    searchWithLocation,
    getPopularPlaces,
    addToHistory,
    setCity,
    clearResults,
    clearCache,
    detectCityFromLocation
  };
};