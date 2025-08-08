import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Search, Clock, Home, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { GooglePlacesService } from '@/services/googlePlacesService';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlaces } from '@/hooks/usePlaces';
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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showLocationError, setShowLocationError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const { getCurrentPosition, loading: geoLoading, error: geoError, lastKnownPosition } = useGeolocation();
  const { places, addPlace, loading: placesLoading } = usePlaces();

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length > 2) {
      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await GooglePlacesService.searchPlaces(
            searchQuery,
            lastKnownPosition
              ? { lng: lastKnownPosition.longitude, lat: lastKnownPosition.latitude }
              : undefined
          );
          setSuggestions(results);
        } catch (error) {
          console.error('Search error:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleLocationSelect = async (location: Location) => {
    setSearchQuery(location.address);
    setIsOpen(false);
    
    // Save to recent places if it's a search result
    if (location.type === 'search') {
      await addPlace({
        name: location.address,
        address: location.address,
        coordinates: location.coordinates,
        place_type: 'recent'
      });
    }
    
    onChange(location);
  };

  const handleGetCurrentLocation = async () => {
    setShowLocationError(false);
    try {
      const position = await getCurrentPosition();
      if (position) {
        // Reverse geocode to get address
        const address = await GooglePlacesService.reverseGeocode(
          position.coords.longitude,
          position.coords.latitude
        );
        
        const location: Location = {
          address,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
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
    // Could open a map picker or provide default suggestions
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleSearchAddress = () => {
    setShowLocationError(false);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const savedPlaces = useMemo(() => {
    return places.filter(place => place.place_type === 'home' || place.place_type === 'work');
  }, [places]);

  const recentPlaces = useMemo(() => {
    return places.filter(place => place.place_type === 'recent' || place.place_type === 'favorite').slice(0, 3);
  }, [places]);

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

            {/* Saved Places */}
            {savedPlaces.length > 0 && (
              <>
                {savedPlaces.map((place, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-accent cursor-pointer border-b flex items-center gap-3"
                    onClick={() => handleLocationSelect({
                      address: place.address,
                      coordinates: place.coordinates || { lat: 0, lng: 0 },
                      type: place.place_type as 'home' | 'work'
                    })}
                  >
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                      {place.place_type === 'home' ? (
                        <Home className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Building2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {place.place_type === 'home' ? 'Domicile' : 'Travail'}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {place.address}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <>
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-accent cursor-pointer border-b flex items-center gap-3"
                    onClick={() => handleLocationSelect({
                      address: suggestion.place_name,
                      coordinates: {
                        lat: suggestion.center[1],
                        lng: suggestion.center[0]
                      },
                      type: 'search'
                    })}
                  >
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900">
                      <Search className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium truncate">{suggestion.place_name}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Recent Places */}
            {recentPlaces.length > 0 && (
              <>
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground bg-muted/50">
                  Récents
                </div>
                {recentPlaces.map((place, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-accent cursor-pointer flex items-center gap-3"
                    onClick={() => handleLocationSelect({
                      address: place.address,
                      coordinates: place.coordinates || { lat: 0, lng: 0 },
                      type: 'recent'
                    })}
                  >
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                      <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium truncate">{place.address}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {!isSearching && suggestions.length === 0 && searchQuery.length > 2 && (
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