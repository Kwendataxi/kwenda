/**
 * Hook pour utiliser le système de recherche d'adresses intelligent temps réel
 * Optimisé pour Kinshasa, Lubumbashi et Kolwezi
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { intelligentAddressSearch, type IntelligentSearchResult, type SearchOptions } from '@/services/IntelligentAddressSearch';
import { useUnifiedLocation } from './useUnifiedLocation';

interface UseIntelligentAddressSearchProps {
  city?: string;
  country_code?: string;
  maxResults?: number;
  minHierarchyLevel?: number;
  includeGoogleFallback?: boolean;
  autoSearchOnMount?: boolean;
  enableVoiceSearch?: boolean;
  cacheResults?: boolean;
  autoDetectCity?: boolean; // Nouvelle option pour détection automatique de ville
  realtimeSearch?: boolean; // Nouvelle option pour recherche temps réel
  debounceMs?: number; // Délai de debounce personnalisable
}

interface UseIntelligentAddressSearchReturn {
  results: IntelligentSearchResult[];
  isSearching: boolean;
  error: string | null;
  recentSearches: IntelligentSearchResult[];
  popularPlaces: IntelligentSearchResult[];
  currentCity: string;
  availableCities: string[];
  search: (query: string, options?: SearchOptions) => Promise<void>;
  searchWithLocation: (query: string) => Promise<void>;
  getPopularPlaces: () => Promise<void>;
  clearResults: () => void;
  clearCache: () => void;
  addToHistory: (result: IntelligentSearchResult) => Promise<void>;
  setCity: (city: string) => void;
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
  autoDetectCity = true,
  realtimeSearch = true,
  debounceMs = 150
}: UseIntelligentAddressSearchProps = {}): UseIntelligentAddressSearchReturn => {
  
  const [results, setResults] = useState<IntelligentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<IntelligentSearchResult[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<IntelligentSearchResult[]>([]);
  const [currentCity, setCurrentCity] = useState(city);
  
  const { location } = useUnifiedLocation();
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // Villes disponibles avec coordonnées pour détection automatique
  const availableCities = ['Kinshasa', 'Lubumbashi', 'Kolwezi'];
  const cityCoordinates = {
    'Kinshasa': { lat: -4.3217, lng: 15.3069 },
    'Lubumbashi': { lat: -11.6594, lng: 27.4794 },
    'Kolwezi': { lat: -10.7147, lng: 25.4615 }
  };

  // Fonction pour calculer la distance entre deux points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Détection automatique de la ville basée sur la géolocalisation
  const detectCityFromLocation = useCallback(async () => {
    if (!location?.lat || !location?.lng || !autoDetectCity) return;

    let closestCity = 'Kinshasa';
    let minDistance = Infinity;

    Object.entries(cityCoordinates).forEach(([cityName, coords]) => {
      const distance = calculateDistance(location.lat, location.lng, coords.lat, coords.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = cityName;
      }
    });

    // Changer de ville seulement si on est proche (< 100km)
    if (minDistance < 100 && closestCity !== currentCity) {
      setCurrentCity(closestCity);
    }
  }, [location, autoDetectCity, currentCity]);

  // Fonction de recherche avec debounce optimisé
  const search = useCallback(async (query: string, customOptions?: SearchOptions) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Recherche immédiate pour les requêtes très courtes (lieux populaires)
    if (query.length === 1 && realtimeSearch) {
      setIsSearching(true);
      try {
        const popularResults = await intelligentAddressSearch.search('', {
          city: currentCity,
          country_code,
          max_results: 3
        });
        const filteredPopular = popularResults.filter(place => 
          place.name.toLowerCase().startsWith(query.toLowerCase())
        );
        setResults(filteredPopular);
      } catch (err) {
        console.error('Error searching popular places:', err);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    // Debounce pour les requêtes plus longues
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const searchOptions: SearchOptions = {
          city: currentCity,
          country_code,
          user_lat: location?.lat,
          user_lng: location?.lng,
          max_results: maxResults,
          min_hierarchy_level: minHierarchyLevel,
          include_google_fallback: includeGoogleFallback,
          
          ...customOptions
        };

        const searchResults = await intelligentAddressSearch.search(query, searchOptions);
        setResults(searchResults);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de recherche';
        setError(errorMessage);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);
  }, [currentCity, country_code, location, maxResults, minHierarchyLevel, includeGoogleFallback, cacheResults, realtimeSearch, debounceMs]);

  // Recherche avec localisation automatique
  const searchWithLocation = useCallback(async (query: string) => {
    await search(query, {
      user_lat: location?.lat,
      user_lng: location?.lng
    });
  }, [search, location]);

  // Récupération des lieux populaires par ville
  const getPopularPlaces = useCallback(async () => {
    setIsSearching(true);
    setError(null);

    try {
      const popular = await intelligentAddressSearch.search('', {
        city: currentCity,
        country_code,
        user_lat: location?.lat,
        user_lng: location?.lng,
        max_results: 6
      });
      
      setPopularPlaces(popular);
      
      // Si pas de résultats actuels, afficher les populaires
      if (results.length === 0) {
        setResults(popular);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des lieux populaires';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [currentCity, country_code, location, results.length]);

  // Ajout à l'historique avec cache local
  const addToHistory = useCallback(async (result: IntelligentSearchResult) => {
    try {
      await intelligentAddressSearch.saveSearchToHistory(result);
      
      // Mettre à jour l'historique local
      setRecentSearches(prev => {
        const filtered = prev.filter(item => item.id !== result.id);
        return [result, ...filtered].slice(0, 5); // Garder seulement les 5 derniers
      });

      // Cache local pour chaque ville
      const cacheKey = `recent_searches_${currentCity}`;
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      const newCached = [result, ...cached.filter((item: any) => item.id !== result.id)].slice(0, 10);
      localStorage.setItem(cacheKey, JSON.stringify(newCached));
    } catch (err) {
      console.error('Erreur lors de la sauvegarde dans l\'historique:', err);
    }
  }, [currentCity]);

  // Fonction pour changer de ville manuellement
  const setCity = useCallback((newCity: string) => {
    if (availableCities.includes(newCity)) {
      setCurrentCity(newCity);
      setResults([]);
      setError(null);
    }
  }, [availableCities]);

  // Vider les résultats
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Vider le cache
  const clearCache = useCallback(() => {
    intelligentAddressSearch.clearCache();
    // Vider aussi le cache local
    availableCities.forEach(cityName => {
      localStorage.removeItem(`recent_searches_${cityName}`);
    });
  }, [availableCities]);

  // Auto-détection de ville au montage
  useEffect(() => {
    if (autoDetectCity && location) {
      detectCityFromLocation();
    }
  }, [detectCityFromLocation, autoDetectCity, location]);

  // Récupération des lieux populaires au montage ou changement de ville
  useEffect(() => {
    if (autoSearchOnMount || currentCity !== city) {
      getPopularPlaces();
    }

    // Charger l'historique local
    const cacheKey = `recent_searches_${currentCity}`;
    const cached = JSON.parse(localStorage.getItem(cacheKey) || '[]');
    setRecentSearches(cached);
  }, [autoSearchOnMount, currentCity, city, getPopularPlaces]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    results,
    isSearching,
    error,
    recentSearches,
    popularPlaces,
    currentCity,
    availableCities,
    search,
    searchWithLocation,
    getPopularPlaces,
    clearResults,
    clearCache,
    addToHistory,
    setCity,
    detectCityFromLocation
  };
};