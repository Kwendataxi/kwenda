/**
 * Composant de recherche de localisation temps réel
 * Optimisé pour les 3 villes : Kinshasa, Lubumbashi, Kolwezi
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Clock, Star, Navigation, X, Loader2 } from 'lucide-react';
import { useIntelligentAddressSearch } from '@/hooks/useIntelligentAddressSearch';
import { intelligentToUnified, type UnifiedLocation } from '@/types/locationAdapter';
import { cn } from '@/lib/utils';

interface RealTimeLocationSearchProps {
  placeholder?: string;
  onLocationSelect: (location: UnifiedLocation) => void;
  value?: string;
  className?: string;
  autoFocus?: boolean;
  showCurrentLocation?: boolean;
  showCitySelector?: boolean;
  compact?: boolean;
}

export const RealTimeLocationSearch: React.FC<RealTimeLocationSearchProps> = ({
  placeholder = "Rechercher un lieu...",
  onLocationSelect,
  value = '',
  className,
  autoFocus = false,
  showCurrentLocation = true,
  showCitySelector = true,
  compact = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentCity, setCurrentCity] = useState('Kinshasa');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    results,
    isSearching,
    error,
    recentSearches,
    popularPlaces,
    search,
    addToHistory,
    clearResults
  } = useIntelligentAddressSearch({
    city: currentCity,
    maxResults: 8, // Limiter pour améliorer les performances
    debounceMs: 200, // Réduire le délai pour plus de réactivité
    autoSearchOnMount: true
  });

  // États locaux pour la gestion multi-villes
  const availableCities = ['Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'];
  
  const detectCityFromLocation = useCallback(() => {
    // Simulation de détection géographique
    console.log('Détection de ville pour:', currentCity);
  }, [currentCity]);

  // Icônes par catégorie
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      'transport': '🚌',
      'commerce': '🏪',
      'éducation': '🎓',
      'santé': '🏥',
      'quartier': '🏘️',
      'religion': '⛪',
      'sport': '⚽',
      'hospitalité': '🏨',
      'restauration': '🍽️',
      'finance': '🏦',
      'industrie': '🏭',
      'administration': '🏛️'
    };
    return iconMap[category] || '📍';
  };

  // Gestion de la recherche avec debounce optimisé et recherche intelligente
  const handleSearch = useCallback((query: string) => {
    setInputValue(query);
    if (query.trim().length > 0) {
      // Recherche immédiate pour les caractères courts dans la ville actuelle
      search(query, { 
        city: currentCity,
        include_google_fallback: query.length > 3 
      });
      setIsOpen(true);
    } else {
      clearResults();
      setIsOpen(true); // Garder ouvert pour montrer les suggestions populaires
    }
    setSelectedIndex(-1);
  }, [search, clearResults, currentCity]);

  // Gestion de la sélection
  const handleLocationSelect = useCallback((result: any) => {
    const unified = intelligentToUnified(result);
    setInputValue(unified.address);
    setIsOpen(false);
    addToHistory(result);
    onLocationSelect(unified);
  }, [onLocationSelect, addToHistory]);

  // Navigation clavier
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalResults = results.length + (showCurrentLocation ? 1 : 0);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalResults);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalResults - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < totalResults) {
          if (selectedIndex === 0 && showCurrentLocation) {
            // Géolocalisation actuelle
            detectCityFromLocation();
          } else {
            const resultIndex = showCurrentLocation ? selectedIndex - 1 : selectedIndex;
            if (results[resultIndex]) {
              handleLocationSelect(results[resultIndex]);
            }
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [results, selectedIndex, showCurrentLocation, handleLocationSelect, detectCityFromLocation]);

  // Clic en dehors pour fermer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Synchronisation avec value externe
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const allResults = [
    ...(showCurrentLocation ? [{ 
      id: 'current', 
      name: 'Position actuelle', 
      category: 'current',
      city: currentCity,
      type: 'current' as const
    }] : []),
    ...results
  ];

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Card className="overflow-hidden">
        <div className="flex items-center space-x-2 p-3">
          {/* Sélecteur de ville */}
          {showCitySelector && !compact && (
            <Select value={currentCity} onValueChange={setCurrentCity}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Input de recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="pl-10 pr-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
            )}
            {inputValue && !isSearching && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInputValue('');
                  clearResults();
                  setIsOpen(false);
                }}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Bouton détection actuelle (compact) */}
          {compact && showCurrentLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={detectCityFromLocation}
              className="shrink-0"
            >
              <Navigation className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Ville actuelle badge */}
        {showCitySelector && compact && (
          <div className="px-3 pb-2">
            <Badge variant="secondary" className="text-xs">
              📍 {currentCity}
            </Badge>
          </div>
        )}
      </Card>

      {/* Dropdown des résultats */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-auto border shadow-lg">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10">
              {error}
            </div>
          )}

          {allResults.length > 0 ? (
            <div className="py-2">
              {allResults.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => {
                    if (result.type === 'current') {
                      detectCityFromLocation();
                    } else {
                      handleLocationSelect(result);
                    }
                  }}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors",
                    selectedIndex === index && "bg-accent"
                  )}
                >
                  <div className="text-lg">{
                    result.type === 'current' ? '🎯' : getCategoryIcon(result.category)
                  }</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-sm truncate">
                        {result.name}
                      </p>
                      {result.type !== 'current' && (
                        <>
                          {'is_verified' in result && result.is_verified && (
                            <Badge variant="secondary" className="text-xs">
                              ✓ Vérifié
                            </Badge>
                          )}
                          {'popularity_score' in result && result.popularity_score > 80 && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.type === 'current' 
                        ? `Détecter votre position à ${currentCity}`
                        : `${'commune' in result ? result.commune : ''}, ${result.city}`
                      }
                    </p>
                  </div>

                  {result.type !== 'current' && 'category' in result && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {result.category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : inputValue && !isSearching ? (
            <div className="p-4 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun lieu trouvé</p>
              <p className="text-xs">Essayez un autre terme de recherche</p>
            </div>
          ) : popularPlaces.length > 0 && !inputValue ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                Lieux populaires à {currentCity}
              </div>
              {popularPlaces.slice(0, 5).map((place, index) => (
                <div
                  key={place.id}
                  onClick={() => handleLocationSelect(place)}
                  className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
                >
                  <div className="text-lg">{getCategoryIcon(place.category)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{place.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {place.commune}, {place.city}
                    </p>
                  </div>
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                </div>
              ))}
            </div>
          ) : null}

          {/* Historique récent */}
          {recentSearches.length > 0 && !inputValue && (
            <div className="border-t">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Recherches récentes</span>
              </div>
              {recentSearches.slice(0, 3).map((search, index) => (
                <div
                  key={`recent-${search.id}`}
                  onClick={() => handleLocationSelect(search)}
                  className="flex items-center space-x-3 px-4 py-2 cursor-pointer hover:bg-accent transition-colors"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{search.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};