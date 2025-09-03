import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Clock, Home, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useIntelligentAddressSearch } from '@/hooks/useIntelligentAddressSearch';
import { useUnifiedLocation } from '@/hooks/useUnifiedLocation';
import { LocationErrorHandler } from './LocationErrorHandler';

interface Location {
  address: string;
  coordinates: { lat: number; lng: number };
  type?: 'home' | 'work' | 'recent' | 'search';
}

interface LocationInputProps {
  placeholder?: string;
  value?: string;
  onChange: (location: Location) => void;
  onFocus?: () => void;
}

const LocationInput = ({ 
  placeholder = "Où allez-vous ?", 
  value = "", 
  onChange, 
  onFocus 
}: LocationInputProps) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { getCurrentPosition, loading: geoLoading, error: geoError, location: lastKnownPosition } = useUnifiedLocation();
  const { 
    results, 
    isSearching, 
    search,
    addToHistory,
    recentSearches 
  } = useIntelligentAddressSearch({
    city: 'Kinshasa',
    country_code: 'CD',
    maxResults: 8,
    autoSearchOnMount: true
  });

  // Debounced search using intelligent search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length > 2) {
      debounceRef.current = setTimeout(async () => {
        await search(searchQuery);
      }, 300);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, search]);

  const handleLocationSelect = async (location: Location) => {
    setSearchQuery(location.address);
    setIsOpen(false);
    
    // Save to search history if it's a search result
    if (location.type === 'search' && results.length > 0) {
      const selectedResult = results.find(r => r.name === location.address);
      if (selectedResult) {
        await addToHistory(selectedResult);
      }
    }
    
    onChange(location);
  };

  const handleGetCurrentLocation = async () => {
    setShowLocationError(false);
    try {
      const position = await getCurrentPosition();
      if (position) {
        const location: Location = {
          address: position.address,
          coordinates: {
            lat: position.lat,
            lng: position.lng
          },
          type: 'search'
        };
        
        await handleLocationSelect(location);
      }
    } catch (error) {
      console.error('Geolocation error:', error);
      setShowLocationError(true);
    }
  };

  const handleRetryLocation = () => {
    setShowLocationError(false);
    handleGetCurrentLocation();
  };

  const handleManualLocation = () => {
    setShowLocationError(false);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleSearchAddress = () => {
    setShowLocationError(false);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  if (showLocationError && geoError) {
    return (
      <LocationErrorHandler
        error={geoError}
        onRetry={handleRetryLocation}
        onManualLocation={handleManualLocation}
        onSearchAddress={handleSearchAddress}
        loading={geoLoading}
      />
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              onFocus?.();
            }}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleGetCurrentLocation}
          disabled={geoLoading}
          className="shrink-0"
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {/* Current Location */}
            <div
              className="p-3 hover:bg-accent cursor-pointer border-b flex items-center gap-3"
              onClick={handleGetCurrentLocation}
            >
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Position actuelle</div>
                <div className="text-sm text-muted-foreground">Utiliser ma localisation</div>
              </div>
              {geoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {/* Intelligent Search Results */}
            {results.length > 0 && (
              <>
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                  Suggestions
                </div>
                {results.map((suggestion, index) => (
                  <div
                    key={suggestion.id || index}
                    className="p-3 hover:bg-accent cursor-pointer border-b flex items-center gap-3"
                    onClick={() => handleLocationSelect({
                      address: suggestion.name,
                      coordinates: {
                        lat: suggestion.lat,
                        lng: suggestion.lng
                      },
                      type: 'search'
                    })}
                  >
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                      <Search className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium truncate">{suggestion.name}</div>
                      {suggestion.category && (
                        <div className="text-sm text-muted-foreground">{suggestion.category}</div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Recent Places */}
            {recentSearches.length > 0 && results.length === 0 && (
              <>
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                  Récents
                </div>
                {recentSearches.slice(0, 3).map((place, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-accent cursor-pointer flex items-center gap-3"
                    onClick={() => handleLocationSelect({
                      address: place.name,
                      coordinates: { lat: place.lat, lng: place.lng },
                      type: 'recent'
                    })}
                  >
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                      <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium truncate">{place.name}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {!isSearching && results.length === 0 && recentSearches.length === 0 && searchQuery.length > 2 && (
              <div className="p-4 text-center text-muted-foreground">
                Aucun résultat trouvé
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LocationInput;