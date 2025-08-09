import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, Star, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { smartLocationService } from '@/services/smartLocationService';
import type { LocationData, SearchResult } from '@/types/location';

interface SmartLocationSearchProps {
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: LocationData) => void;
  showCurrentLocation?: boolean;
  className?: string;
}

const SmartLocationSearch: React.FC<SmartLocationSearchProps> = ({
  placeholder = "Rechercher une adresse...",
  value = "",
  onLocationSelect,
  showCurrentLocation = true,
  className = ""
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Mettre à jour la query quand value change
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Recherche avec debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.trim().length === 0) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await smartLocationService.searchLocation(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Erreur recherche:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  // Fermer sur clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setIsOpen(true);
  };

  const handleLocationSelect = (location: LocationData) => {
    setQuery(location.address);
    setIsOpen(false);
    onLocationSelect(location);
    inputRef.current?.blur();
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await smartLocationService.getCurrentLocation();
      handleLocationSelect(location);
    } catch (error) {
      console.error('Erreur position actuelle:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
    // Afficher les lieux populaires si pas de query
    if (!query.trim()) {
      smartLocationService.searchLocation('').then(setResults);
    }
  };

  const getLocationIcon = (type?: string) => {
    switch (type) {
      case 'current':
        return <Navigation className="w-4 h-4 text-blue-500" />;
      case 'popular':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLocationBadge = (type?: string) => {
    switch (type) {
      case 'current':
        return { text: 'Actuel', variant: 'default' as const };
      case 'popular':
        return { text: 'Populaire', variant: 'secondary' as const };
      case 'recent':
        return { text: 'Récent', variant: 'outline' as const };
      default:
        return { text: 'Lieu', variant: 'outline' as const };
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Champ de recherche */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
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

      {/* Résultats */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              Recherche en cours...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.slice(0, 8).map((result) => {
                const badge = getLocationBadge(result.type);
                return (
                  <button
                    key={result.id}
                    onClick={() => handleLocationSelect(result)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                  >
                    {getLocationIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {result.address}
                      </div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    <Badge variant={badge.variant} className="text-xs">
                      {badge.text}
                    </Badge>
                  </button>
                );
              })}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Saisissez une adresse pour rechercher
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SmartLocationSearch;