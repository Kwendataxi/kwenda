import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, Building2, Car, Utensils, ShoppingBag, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import type { UnifiedLocation } from '@/types/unifiedLocation';

interface AutocompleteLocationInputProps {
  value?: UnifiedLocation | null;
  onChange: (location: UnifiedLocation | null) => void;
  placeholder?: string;
  className?: string;
  onLocationBias?: { lat: number; lng: number };
  types?: string[];
  showRecentSearches?: boolean;
}

const getPlaceIcon = (types: string[]) => {
  if (types.includes('restaurant') || types.includes('food') || types.includes('meal_takeaway')) {
    return <Utensils className="h-4 w-4 text-orange-500" />;
  }
  if (types.includes('lodging') || types.includes('hotel')) {
    return <Building2 className="h-4 w-4 text-blue-500" />;
  }
  if (types.includes('store') || types.includes('shopping_mall') || types.includes('establishment')) {
    return <ShoppingBag className="h-4 w-4 text-green-500" />;
  }
  if (types.includes('gas_station') || types.includes('car_repair')) {
    return <Car className="h-4 w-4 text-purple-500" />;
  }
  return <MapPin className="h-4 w-4 text-muted-foreground" />;
};

const highlightMatch = (text: string, matchedSubstrings: Array<{ offset: number; length: number }>) => {
  if (!matchedSubstrings || matchedSubstrings.length === 0) {
    return <span>{text}</span>;
  }

  const parts = [];
  let lastIndex = 0;

  matchedSubstrings.forEach(({ offset, length }) => {
    if (offset > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex, offset)}
        </span>
      );
    }
    parts.push(
      <span key={`match-${offset}`} className="font-medium text-foreground">
        {text.substring(offset, offset + length)}
      </span>
    );
    lastIndex = offset + length;
  });

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
};

export const AutocompleteLocationInput: React.FC<AutocompleteLocationInputProps> = ({
  value,
  onChange,
  placeholder = "Rechercher une adresse ou un lieu...",
  className,
  onLocationBias,
  types = [],
  showRecentSearches = true
}) => {
  const [query, setQuery] = useState(value?.name || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<UnifiedLocation[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { predictions, isLoading, error, search, getPlaceDetails, clearPredictions } = useGooglePlacesAutocomplete({
    location: onLocationBias,
    types,
    debounceMs: 300
  });

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches) {
      try {
        const stored = localStorage.getItem('kwenda-recent-searches');
        if (stored) {
          setRecentSearches(JSON.parse(stored).slice(0, 5));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, [showRecentSearches]);

  // Save to recent searches
  const saveToRecentSearches = (location: UnifiedLocation) => {
    if (!showRecentSearches) return;
    
    try {
      const existing = recentSearches.filter(item => item.id !== location.id);
      const updated = [location, ...existing].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('kwenda-recent-searches', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.trim().length >= 2) {
      search(newQuery);
      setShowSuggestions(true);
    } else {
      clearPredictions();
      setShowSuggestions(newQuery.length === 0 && recentSearches.length > 0);
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction: any) => {
    try {
      setQuery(prediction.description);
      setShowSuggestions(false);
      
      // Get place details
      const placeDetails = await getPlaceDetails(prediction.placeId);
      
      if (placeDetails) {
        const location: UnifiedLocation = {
          id: placeDetails.id,
          name: placeDetails.name || prediction.structuredFormatting.mainText,
          address: placeDetails.address,
          coordinates: placeDetails.coordinates,
          subtitle: prediction.structuredFormatting.secondaryText,
          type: 'google' as const,
          placeId: placeDetails.placeId
        };

        onChange(location);
        saveToRecentSearches(location);
      }
    } catch (error) {
      console.error('Error selecting prediction:', error);
    }
  };

  // Handle recent search selection
  const handleRecentSelect = (location: UnifiedLocation) => {
    setQuery(location.name);
    setShowSuggestions(false);
    onChange(location);
  };

  // Handle input focus
  const handleFocus = () => {
    if (query.length === 0 && recentSearches.length > 0) {
      setShowSuggestions(true);
    } else if (predictions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle clear input
  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    clearPredictions();
    onChange(null);
    inputRef.current?.focus();
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md z-50">
          {error}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {/* Recent searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                <Clock className="inline h-3 w-3 mr-1" />
                Recherches récentes
              </div>
              {recentSearches.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleRecentSelect(location)}
                  className="w-full px-3 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{location.name}</div>
                      {location.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">{location.subtitle}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Autocomplete predictions */}
          {predictions.length > 0 && (
            <>
              {query.length === 0 && recentSearches.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                  <Search className="inline h-3 w-3 mr-1" />
                  Suggestions
                </div>
              )}
              {predictions.map((prediction) => (
                <button
                  key={prediction.placeId}
                  onClick={() => handlePredictionSelect(prediction)}
                  className="w-full px-3 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {getPlaceIcon(prediction.types)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {highlightMatch(prediction.structuredFormatting.mainText, prediction.matchedSubstrings)}
                      </div>
                      {prediction.structuredFormatting.secondaryText && (
                        <div className="text-xs text-muted-foreground">
                          {prediction.structuredFormatting.secondaryText}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* No results */}
          {query.length >= 2 && predictions.length === 0 && !isLoading && !error && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé pour "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Export par défaut pour compatibilité
export default AutocompleteLocationInput;