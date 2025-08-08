import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, Star, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UnifiedLocationService, LocationResult } from '@/services/unifiedLocationService';

interface UnifiedLocationSearchProps {
  placeholder: string;
  value?: string;
  onLocationSelect: (location: LocationResult) => void;
  showCurrentLocation?: boolean;
  className?: string;
}

const UnifiedLocationSearch: React.FC<UnifiedLocationSearchProps> = ({
  placeholder,
  value = '',
  onLocationSelect,
  showCurrentLocation = true,
  className = ''
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Recherche avec debounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        setLoading(true);
        try {
          const searchResults = await UnifiedLocationService.searchLocation(query);
          setResults(searchResults);
          setIsOpen(true);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query]);

  // Fermer les résultats au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationSelect = (location: LocationResult) => {
    setQuery(location.address);
    setIsOpen(false);
    onLocationSelect(location);
  };

  const handleCurrentLocation = async () => {
    setLoading(true);
    try {
      const currentLocation = await UnifiedLocationService.getCurrentLocation();
      handleLocationSelect(currentLocation);
    } catch (error) {
      console.error('Current location error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocationIcon = (type?: string) => {
    switch (type) {
      case 'popular': return <Star className="w-4 h-4 text-amber-500" />;
      case 'geocoded': return <MapPin className="w-4 h-4 text-blue-500" />;
      default: return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="pl-10 pr-12"
        />
        
        {/* Bouton position actuelle */}
        {showCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCurrentLocation}
            disabled={loading}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          >
            <Navigation className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Résultats de recherche */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Recherche...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={index}
                  className="w-full px-3 py-3 text-left hover:bg-muted/50 flex items-center gap-3 transition-colors"
                  onClick={() => handleLocationSelect(result)}
                >
                  {getLocationIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {result.address}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.type === 'popular' && 'Lieu populaire'}
                      {result.type === 'geocoded' && 'Adresse vérifiée'}
                      {result.type === 'fallback' && 'Position approximative'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
};

export default UnifiedLocationSearch;