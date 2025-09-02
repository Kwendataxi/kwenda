/**
 * Composant de recherche d'adresses intelligent - Interface type Yango
 * Autocomplétion rapide avec suggestions hiérarchiques
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Clock, Star, Navigation, X, Mic, MicOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { intelligentAddressSearch, type IntelligentSearchResult, type SearchOptions } from '@/services/IntelligentAddressSearch';
import { useUnifiedLocation } from '@/hooks/useUnifiedLocation';
import { cn } from '@/lib/utils';

interface IntelligentAddressSearchProps {
  onLocationSelect: (location: IntelligentSearchResult) => void;
  placeholder?: string;
  city?: string;
  country_code?: string;
  showCurrentLocation?: boolean;
  showPopularPlaces?: boolean;
  showRecentSearches?: boolean;
  maxResults?: number;
  className?: string;
  autoFocus?: boolean;
  value?: string;
  disabled?: boolean;
}

export const IntelligentAddressSearch: React.FC<IntelligentAddressSearchProps> = ({
  onLocationSelect,
  placeholder = "Rechercher une adresse, quartier, lieu...",
  city = 'Kinshasa',
  country_code = 'CD',
  showCurrentLocation = true,
  showPopularPlaces = true,
  showRecentSearches = true,
  maxResults = 8,
  className,
  autoFocus = false,
  value = '',
  disabled = false
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<IntelligentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<IntelligentSearchResult[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<SpeechRecognition | null>(null);
  
  const { location, getCurrentPosition, loading: locationLoading } = useUnifiedLocation();

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'fr-FR';
      
      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      
      recognition.current.onerror = () => {
        setIsListening(false);
      };
      
      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Recherche avec debouncing
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // Afficher les suggestions par défaut
      const popular = await intelligentAddressSearch.search('', {
        city,
        country_code,
        user_lat: location?.lat,
        user_lng: location?.lng,
        max_results: maxResults
      });
      setResults(popular);
      return;
    }

    setIsSearching(true);
    
    try {
      const searchOptions: SearchOptions = {
        city,
        country_code,
        user_lat: location?.lat,
        user_lng: location?.lng,
        max_results: maxResults,
        include_google_fallback: true
      };
      
      const searchResults = await intelligentAddressSearch.search(searchQuery, searchOptions);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [city, country_code, location, maxResults]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // Gestion des clics extérieurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation au clavier
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectLocation(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Sélection d'un lieu
  const handleSelectLocation = async (result: IntelligentSearchResult) => {
    setQuery(result.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Enregistrer dans l'historique
    await intelligentAddressSearch.saveSearchToHistory(result);
    
    onLocationSelect(result);
  };

  // Position actuelle
  const handleCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      const currentLocationResult: IntelligentSearchResult = {
        id: 'current_location',
        name: 'Position actuelle',
        category: 'current',
        city,
        lat: position.lat,
        lng: position.lng,
        hierarchy_level: 5,
        popularity_score: 100,
        relevance_score: 100,
        type: 'database',
        badge: 'GPS',
        subtitle: position.address || 'Votre position actuelle'
      };
      
      handleSelectLocation(currentLocationResult);
    } catch (error) {
      console.error('Current location error:', error);
    }
  };

  // Reconnaissance vocale
  const handleVoiceSearch = () => {
    if (!recognition.current) return;
    
    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
    }
  };

  // Vider la recherche
  const clearSearch = () => {
    setQuery('');
    setSelectedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Icône de catégorie
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transport': return '🚌';
      case 'commercial': return '🏪';
      case 'education': return '🎓';
      case 'health': return '🏥';
      case 'sport': return '⚽';
      case 'government': return '🏛️';
      case 'industry': return '🏭';
      case 'current': return '📍';
      default: return '📍';
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Titre et instructions */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-grey-900 mb-1">
          Où allez-vous ?
        </h3>
        <p className="text-sm text-grey-600">
          Recherchez une adresse, un quartier ou un lieu populaire
        </p>
      </div>

      {/* Position actuelle */}
      {showCurrentLocation && (
        <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              onClick={handleCurrentLocation}
              disabled={locationLoading || disabled}
              className="w-full justify-start h-auto p-0 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-grey-900">
                    {locationLoading ? 'Localisation...' : 'Utiliser ma position actuelle'}
                  </p>
                  <p className="text-sm text-grey-600">
                    GPS • Précision optimale
                  </p>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Champ de recherche */}
      <Card className="border-2 border-grey-200 hover:border-primary/50 transition-colors">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="p-4">
              <Search className="w-5 h-5 text-grey-400" />
            </div>
            
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="border-0 focus-visible:ring-0 text-base"
            />
            
            {/* Actions de droite */}
            <div className="flex items-center gap-2 p-2">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              
              {recognition.current && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceSearch}
                  className={cn(
                    "w-8 h-8 p-0",
                    isListening && "text-primary animate-pulse"
                  )}
                  disabled={disabled}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-hidden border-2 border-grey-200 shadow-xl">
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-grey-600">Recherche...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    onClick={() => handleSelectLocation(result)}
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer border-b border-grey-100 last:border-b-0 transition-colors",
                      selectedIndex === index ? "bg-primary/10" : "hover:bg-grey-50"
                    )}
                  >
                    {/* Icône et catégorie */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-grey-100 flex items-center justify-center text-lg">
                        {getCategoryIcon(result.category)}
                      </div>
                    </div>
                    
                    {/* Informations principales */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-grey-900 truncate">
                          {result.name}
                        </p>
                        {result.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {result.badge}
                          </Badge>
                        )}
                      </div>
                      
                      {result.subtitle && (
                        <p className="text-sm text-grey-600 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    
                    {/* Score de popularité */}
                    {result.popularity_score > 50 && (
                      <div className="flex-shrink-0">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center">
                <MapPin className="w-8 h-8 text-grey-300 mx-auto mb-2" />
                <p className="text-sm text-grey-600">
                  Aucun résultat pour "{query}"
                </p>
                <p className="text-xs text-grey-500 mt-1">
                  Essayez un quartier ou lieu connu
                </p>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm font-medium text-grey-700 mb-3">
                  {showPopularPlaces ? 'Lieux populaires' : 'Suggestions'}
                </p>
                <div className="text-center text-grey-500">
                  <Search className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-xs">
                    Commencez à taper pour voir les suggestions
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Indicateur de reconnaissance vocale active */}
      {isListening && (
        <div className="absolute top-full left-0 right-0 z-40 mt-1">
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-primary">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium">Écoute en cours...</span>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};