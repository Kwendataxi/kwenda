import React, { useState, useRef } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import type { LocationData } from '@/types/location';

interface SimpleLocationSearchProps {
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: LocationData) => void;
  showCurrentLocation?: boolean;
  className?: string;
}

interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

const SimpleLocationSearch: React.FC<SimpleLocationSearchProps> = ({
  placeholder = "Rechercher une adresse...",
  value = "",
  onLocationSelect,
  showCurrentLocation = true,
  className = ""
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout>();

  const searchLocation = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { query: searchQuery }
      });

      if (error) {
        console.error('Erreur geocode-proxy:', error);
        setResults([]);
        return;
      }

      const geocodeResults = data as GeocodeResult[];
      const locationResults: LocationData[] = geocodeResults.map((result, index) => ({
        address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        type: 'geocoded' as const,
        placeId: `geocoded-${index}`
      }));

      setResults(locationResults.slice(0, 5));
    } catch (error) {
      console.error('Erreur recherche:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setIsOpen(true);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce search
    timeoutRef.current = setTimeout(() => {
      searchLocation(newValue);
    }, 300);
  };

  const handleLocationSelect = (location: LocationData) => {
    setQuery(location.address);
    setIsOpen(false);
    onLocationSelect(location);
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const location: LocationData = {
        address: "Position actuelle",
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        type: 'current'
      };

      handleLocationSelect(location);
    } catch (error) {
      console.error('Erreur position actuelle:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    // Delay closing to allow click on results
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10 pr-12"
        />
        {showCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleCurrentLocation}
            disabled={isGettingLocation}
          >
            <Navigation className={`w-4 h-4 ${isGettingLocation ? 'animate-pulse' : ''}`} />
          </Button>
        )}
      </div>

      {/* Results */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Recherche en cours...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.placeId}-${index}`}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {result.address}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Saisissez au moins 2 caractères
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SimpleLocationSearch;