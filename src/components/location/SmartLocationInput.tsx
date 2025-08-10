import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, Navigation, Star, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { unifiedLocationService, type LocationData, type LocationSearchResult } from '@/services/unifiedLocationService';

interface SmartLocationInputProps {
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: LocationData) => void;
  showCurrentLocation?: boolean;
  className?: string;
  enableManualFallback?: boolean;
}

export const SmartLocationInput: React.FC<SmartLocationInputProps> = ({
  placeholder = "Rechercher une adresse...",
  value = "",
  onLocationSelect,
  showCurrentLocation = true,
  className = "",
  enableManualFallback = true
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Update internal query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const searchResults = await unifiedLocationService.searchLocation(query, currentLocation || undefined);
          setResults(searchResults);
          setIsOpen(true);
        } catch (error) {
          console.error('Search failed:', error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, currentLocation]);

  // Close dropdown when clicking outside
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
    setQuery(e.target.value);
    setGpsError(null);
  };

  const handleLocationSelect = (location: LocationData) => {
    setQuery(location.address);
    setIsOpen(false);
    setGpsError(null);
    onLocationSelect(location);
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    setGpsError(null);
    
    try {
      const position = await unifiedLocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        fallbackToIP: true,
        fallbackToDefault: true
      });
      
      setCurrentLocation(position);
      handleLocationSelect(position);
      
      if (position.type === 'ip' || position.type === 'fallback') {
        toast({
          title: "Position approximative",
          description: position.type === 'ip' 
            ? "Position estimée via votre connexion internet"
            : "Position par défaut utilisée",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setGpsError(errorMessage);
      
      toast({
        title: "Géolocalisation indisponible",
        description: enableManualFallback 
          ? "Vous pouvez saisir votre adresse manuellement"
          : "Veuillez saisir votre adresse",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getLocationIcon = (type?: string) => {
    switch (type) {
      case 'current': return <Navigation className="w-4 h-4 text-blue-500" />;
      case 'popular': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'recent': return <Clock className="w-4 h-4 text-green-500" />;
      default: return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLocationBadge = (type?: string) => {
    switch (type) {
      case 'current': return { text: 'Actuelle', className: 'bg-blue-100 text-blue-800' };
      case 'popular': return { text: 'Populaire', className: 'bg-yellow-100 text-yellow-800' };
      case 'recent': return { text: 'Récente', className: 'bg-green-100 text-green-800' };
      case 'ip': return { text: 'Estimée', className: 'bg-orange-100 text-orange-800' };
      case 'fallback': return { text: 'Par défaut', className: 'bg-gray-100 text-gray-800' };
      default: return null;
    }
  };

  const getErrorAction = () => {
    if (!gpsError) return null;

    if (gpsError.includes('PERMISSION')) {
      return (
        <div className="p-3 border-t text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Autorisez la géolocalisation dans les paramètres
          </p>
          <Button variant="outline" size="sm" onClick={handleCurrentLocation}>
            Réessayer
          </Button>
        </div>
      );
    }

    if (gpsError.includes('HTTPS')) {
      return (
        <div className="p-3 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Connexion sécurisée requise pour la géolocalisation
          </p>
        </div>
      );
    }

    return (
      <div className="p-3 border-t text-center">
        <p className="text-sm text-muted-foreground mb-2">
          {enableManualFallback 
            ? "GPS indisponible - Saisissez manuellement"
            : "Erreur de géolocalisation"
          }
        </p>
        <Button variant="outline" size="sm" onClick={handleCurrentLocation}>
          Réessayer GPS
        </Button>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input avec boutons */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          className="pl-10 pr-20"
        />
        
        {/* Bouton position actuelle */}
        {showCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCurrentLocation}
            disabled={isGettingLocation}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-2"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* GPS Error indicator */}
      {gpsError && (
        <div className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="w-3 h-3" />
          <span>GPS indisponible</span>
        </div>
      )}

      {/* Dropdown résultats */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-hidden">
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Recherche...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {results.map((result) => {
                  const badge = getLocationBadge(result.type);
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleLocationSelect(result)}
                      className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {getLocationIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">
                              {result.title || result.address}
                            </p>
                            {badge && (
                              <Badge variant="secondary" className={`text-xs ${badge.className}`}>
                                {badge.text}
                              </Badge>
                            )}
                          </div>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : query.trim() ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
                {enableManualFallback && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Continuez à taper pour ajouter manuellement
                  </p>
                )}
              </div>
            ) : null}

            {/* Actions d'erreur */}
            {getErrorAction()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};