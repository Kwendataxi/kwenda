/**
 * Hook pour utiliser le système de recherche d'adresses intelligent
 */

import { useState, useEffect, useCallback } from 'react';
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
}

interface UseIntelligentAddressSearchReturn {
  results: IntelligentSearchResult[];
  isSearching: boolean;
  error: string | null;
  recentSearches: IntelligentSearchResult[];
  popularPlaces: IntelligentSearchResult[];
  search: (query: string, options?: SearchOptions) => Promise<void>;
  searchWithLocation: (query: string) => Promise<void>;
  getPopularPlaces: () => Promise<void>;
  clearResults: () => void;
  clearCache: () => void;
  addToHistory: (result: IntelligentSearchResult) => Promise<void>;
}

export const useIntelligentAddressSearch = ({
  city = 'Kinshasa',
  country_code = 'CD',
  maxResults = 8,
  minHierarchyLevel = 1,
  includeGoogleFallback = true,
  autoSearchOnMount = false,
  enableVoiceSearch = false,
  cacheResults = true
}: UseIntelligentAddressSearchProps = {}): UseIntelligentAddressSearchReturn => {
  
  const [results, setResults] = useState<IntelligentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<IntelligentSearchResult[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<IntelligentSearchResult[]>([]);
  
  const { location } = useUnifiedLocation();

  // Récupération des lieux populaires au montage
  useEffect(() => {
    if (autoSearchOnMount) {
      getPopularPlaces();
    }
  }, [autoSearchOnMount]);

  // Fonction de recherche principale
  const search = useCallback(async (query: string, customOptions?: SearchOptions) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const searchOptions: SearchOptions = {
        city,
        country_code,
        user_lat: location?.lat,
        user_lng: location?.lng,
        max_results: maxResults,
        min_hierarchy_level: minHierarchyLevel,
        include_google_fallback: includeGoogleFallback,
        cache_duration: cacheResults ? 5 * 60 * 1000 : 0, // 5 minutes ou pas de cache
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
  }, [city, country_code, location, maxResults, minHierarchyLevel, includeGoogleFallback, cacheResults]);

  // Recherche avec localisation automatique
  const searchWithLocation = useCallback(async (query: string) => {
    await search(query, {
      user_lat: location?.lat,
      user_lng: location?.lng
    });
  }, [search, location]);

  // Récupération des lieux populaires
  const getPopularPlaces = useCallback(async () => {
    setIsSearching(true);
    setError(null);

    try {
      const popular = await intelligentAddressSearch.search('', {
        city,
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
  }, [city, country_code, location, results.length]);

  // Ajout à l'historique
  const addToHistory = useCallback(async (result: IntelligentSearchResult) => {
    try {
      await intelligentAddressSearch.saveSearchToHistory(result);
      
      // Mettre à jour l'historique local
      setRecentSearches(prev => {
        const filtered = prev.filter(item => item.id !== result.id);
        return [result, ...filtered].slice(0, 5); // Garder seulement les 5 derniers
      });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde dans l\'historique:', err);
    }
  }, []);

  // Vider les résultats
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  // Vider le cache
  const clearCache = useCallback(() => {
    intelligentAddressSearch.clearCache();
  }, []);

  return {
    results,
    isSearching,
    error,
    recentSearches,
    popularPlaces,
    search,
    searchWithLocation,
    getPopularPlaces,
    clearResults,
    clearCache,
    addToHistory
  };
};