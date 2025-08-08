import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GoogleMapsService, GeocodeResult } from '@/services/googleMapsService';
import { useToast } from '@/hooks/use-toast';

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  className?: string;
}

export const IntelligentLocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  placeholder = "Rechercher une adresse...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentPlaces, setRecentPlaces] = useState<GeocodeResult[]>([]);
  const geolocation = useGeolocation();
  const { getCurrentPosition } = geolocation;
  const { toast } = useToast();

  // Load recent places
  useEffect(() => {
    const stored = localStorage.getItem('recentPlaces');
    if (stored) {
      try {
        setRecentPlaces(JSON.parse(stored).slice(0, 3));
      } catch (error) {
        console.error('Error loading recent places:', error);
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 2) {
        searchPlaces(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchPlaces = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const proximity = geolocation.latitude && geolocation.longitude 
        ? { lat: geolocation.latitude, lng: geolocation.longitude }
        : undefined;
      
      const searchResults = await GoogleMapsService.searchPlaces(searchQuery, proximity);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher les lieux",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (result: GeocodeResult) => {
    const locationData = {
      lat: result.center[1],
      lng: result.center[0],
      address: result.place_name
    };

    onLocationSelect(locationData);

    // Save to recent places
    const updatedRecent = [result, ...recentPlaces.filter(p => p.place_name !== result.place_name)].slice(0, 5);
    setRecentPlaces(updatedRecent);
    localStorage.setItem('recentPlaces', JSON.stringify(updatedRecent));
    
    setQuery(result.place_name);
    setResults([]);
  };

  const handleCurrentLocation = async () => {
    try {
      await getCurrentPosition();
      if (geolocation.latitude && geolocation.longitude) {
        const address = await GoogleMapsService.reverseGeocode(geolocation.longitude, geolocation.latitude);
        onLocationSelect({
          lat: geolocation.latitude,
          lng: geolocation.longitude,
          address
        });
        setQuery(address);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-12"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCurrentLocation}
          className="absolute right-1 top-1 h-8 w-8 p-0"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {/* Results dropdown */}
      {(results.length > 0 || (query.length === 0 && recentPlaces.length > 0)) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-auto">
          {query.length === 0 && recentPlaces.length > 0 && (
            <div className="p-2">
              <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Récents
              </div>
              {recentPlaces.map((place, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleLocationSelect(place)}
                >
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{place.place_name}</span>
                </Button>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleLocationSelect(result)}
                >
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{result.place_name}</span>
                </Button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Recherche en cours...
            </div>
          )}
        </Card>
      )}
    </div>
  );
};