import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, Star, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UnifiedLocationService } from '@/services/unifiedLocationService';

export interface LocationResult {
  address: string;
  lat: number;
  lng: number;
  type?: 'geocoded' | 'popular' | 'fallback';
}

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

  // Recherche simplifiée et robuste
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length >= 1) {
      setLoading(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const searchResults = await UnifiedLocationService.searchLocation(query);
          setResults(searchResults || []);
          setIsOpen(true);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 200);
    } else {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
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
      case 'popular': return <Star className="w-4 h-4 text-amber-500 fill-amber-100" />;
      case 'geocoded': return <MapPin className="w-4 h-4 text-blue-600" />;
      default: return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLocationBadge = (type?: string) => {
    switch (type) {
      case 'popular': return { text: 'Populaire', color: 'bg-amber-100 text-amber-800' };
      case 'geocoded': return { text: 'Vérifié', color: 'bg-blue-100 text-blue-800' };
      default: return { text: 'Approx.', color: 'bg-muted text-muted-foreground' };
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? 
        <span key={i} className="bg-yellow-200 dark:bg-yellow-800/30 font-semibold">{part}</span> : 
        part
    );
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

      {/* Résultats de recherche modernes */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto border shadow-lg backdrop-blur-sm">
          {loading ? (
            <div className="p-4 text-center">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-r-transparent"></div>
                <span className="text-sm text-muted-foreground">Recherche instantanée...</span>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((result, index) => {
                const badge = getLocationBadge(result.type);
                return (
                  <button
                    key={index}
                    className="w-full px-4 py-3 text-left hover:bg-muted/80 active:bg-muted flex items-center gap-3 transition-all duration-200 group"
                    onClick={() => handleLocationSelect(result)}
                  >
                    <div className="flex-shrink-0">
                      {getLocationIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {highlightMatch(result.address, query)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.text}
                        </span>
                        {result.type === 'popular' && (
                          <span className="text-xs text-muted-foreground">• Recommandé</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.length >= 1 ? (
            <div className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-2">Aucun résultat trouvé</div>
              <div className="text-xs text-muted-foreground">
                Essayez un nom de quartier ou de lieu populaire
              </div>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
};

export default UnifiedLocationSearch;