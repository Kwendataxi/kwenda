import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useIntelligentAddressSearch } from '@/hooks/useIntelligentAddressSearch';
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
  const [recentPlaces, setRecentPlaces] = useState<any[]>([]);
  const geolocation = useGeolocation();
  const { getCurrentPosition } = geolocation;
  const { toast } = useToast();

  const {
    results,
    isSearching,
    search,
    searchWithLocation,
    addToHistory,
    popularPlaces
  } = useIntelligentAddressSearch({
    city: 'Kinshasa',
    country_code: 'CD',
    maxResults: 8,
    includeGoogleFallback: true,
    autoSearchOnMount: true
  });

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

  // Recherche avec debounce
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      if (geolocation.latitude && geolocation.longitude) {
        searchWithLocation(query);
      } else {
        search(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, geolocation, search, searchWithLocation]);

  const handleLocationSelect = async (result: any) => {
    const locationData = {
      lat: result.lat,
      lng: result.lng,
      address: result.name
    };

    onLocationSelect(locationData);

    // Ajouter à l'historique intelligent
    await addToHistory(result);

    // Save to recent places (format compatible)
    const recentFormat = {
      place_name: result.name,
      center: [result.lng, result.lat]
    };
    const updatedRecent = [recentFormat, ...recentPlaces.filter(p => p.place_name !== result.name)].slice(0, 5);
    setRecentPlaces(updatedRecent);
    localStorage.setItem('recentPlaces', JSON.stringify(updatedRecent));
    
    setQuery(result.name);
  };

  const handleRecentSelect = (place: any) => {
    const locationData = {
      lat: place.center[1],
      lng: place.center[0],
      address: place.place_name
    };
    onLocationSelect(locationData);
    setQuery(place.place_name);
  };

  const handleCurrentLocation = async () => {
    try {
      await getCurrentPosition();
      if (geolocation.latitude && geolocation.longitude) {
        onLocationSelect({
          lat: geolocation.latitude,
          lng: geolocation.longitude,
          address: 'Position actuelle'
        });
        setQuery('Position actuelle');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    }
  };

  const displayResults = query.trim() ? results : popularPlaces;
  const showRecents = !query.trim() && recentPlaces.length > 0;

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
      {(displayResults.length > 0 || showRecents) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-auto">
          {showRecents && (
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
                  onClick={() => handleRecentSelect(place)}
                >
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{place.place_name}</span>
                </Button>
              ))}
            </div>
          )}

          {displayResults.length > 0 && (
            <div className="p-2">
              {displayResults.map((result, index) => (
                <Button
                  key={result.id || index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => handleLocationSelect(result)}
                >
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="truncate font-medium">{result.name}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground truncate">{result.subtitle}</span>
                    )}
                  </div>
                  {result.badge && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {result.badge}
                    </span>
                  )}
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