import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MapPin, 
  Navigation2, 
  Clock, 
  Star, 
  Home, 
  Building, 
  Loader2,
  Target,
  ChevronRight
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePlaces } from '@/hooks/usePlaces';
import { useToast } from '@/hooks/use-toast';
import { GeocodingService } from '@/services/geocoding';

interface Location {
  address: string;
  coordinates: { lat: number; lng: number };
  type?: string;
}

interface EnhancedLocationSearchProps {
  value?: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
  cityContext?: {
    name: string;
    coordinates: [number, number];
    popular: string[];
  };
  label?: string;
  icon?: React.ReactNode;
}

export const EnhancedLocationSearch = ({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  cityContext,
  label = "Adresse",
  icon = <MapPin className="w-5 h-5" />
}: EnhancedLocationSearchProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { getCurrentPosition } = useGeolocation();
  const { recentPlaces, favoritePlaces } = usePlaces();
  const { toast } = useToast();

  // Effacer la recherche précédente et lancer une nouvelle recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 2) {
      setIsSearching(true);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const proximity = cityContext ? {
            lng: cityContext.coordinates[1],
            lat: cityContext.coordinates[0]
          } : undefined;
          
          const results = await GeocodingService.searchPlaces(query, proximity);
          setSuggestions(results);
        } catch (error) {
          console.error('Erreur de recherche:', error);
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
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, cityContext]);

  const handleLocationSelect = (location: Location) => {
    setQuery(location.address);
    setShowDropdown(false);
    onChange(location);
    inputRef.current?.blur();
    
    toast({
      title: "📍 Adresse sélectionnée",
      description: location.address,
    });
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await getCurrentPosition();
      const address = await GeocodingService.reverseGeocode(
        position.coords.longitude, 
        position.coords.latitude
      );
      
      const location: Location = {
        address: address || 'Ma position actuelle',
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        type: 'current'
      };
      
      handleLocationSelect(location);
    } catch (error) {
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handlePopularPlace = async (place: string) => {
    try {
      const proximity = cityContext ? {
        lng: cityContext.coordinates[1],
        lat: cityContext.coordinates[0]
      } : undefined;
      
      const results = await GeocodingService.searchPlaces(place, proximity);
      if (results.length > 0) {
        const location: Location = {
          address: results[0].place_name,
          coordinates: {
            lat: results[0].center[1],
            lng: results[0].center[0]
          },
          type: 'popular'
        };
        handleLocationSelect(location);
      }
    } catch (error) {
      console.error('Erreur recherche lieu populaire:', error);
    }
  };

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'current': return <Navigation2 className="w-4 h-4 text-blue-500" />;
      case 'recent': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'saved': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'popular': return <Building className="w-4 h-4 text-purple-500" />;
      default: return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Section principale de recherche */}
      <Card className="p-4 border-2 border-dashed border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3 mb-3">
          {icon}
          <h3 className="font-semibold text-lg">{label}</h3>
        </div>
        
        {/* Input de recherche amélioré */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-10 pr-4 h-14 text-lg bg-white border-2 border-border focus:border-primary transition-colors"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
            )}
          </div>
          
          {/* Dropdown amélioré avec fond solide */}
          {showDropdown && (
            <Card className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-border shadow-2xl rounded-lg z-50 max-h-80 overflow-auto">
              <div className="p-2">
                
                {/* Bouton Ma Position - toujours visible */}
                <Button
                  onClick={handleCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full h-14 mb-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    {isGettingLocation ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Navigation2 className="w-5 h-5" />
                    )}
                    <div className="text-left">
                      <div className="font-semibold">Ma position actuelle</div>
                      <div className="text-xs opacity-90">Géolocalisation automatique</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>

                {/* Lieux populaires */}
                {cityContext && cityContext.popular.length > 0 && query.length < 2 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                      Lieux populaires à {cityContext.name}
                    </h4>
                    <div className="space-y-1">
                      {cityContext.popular.map((place, index) => (
                        <button
                          key={index}
                          onClick={() => handlePopularPlace(place)}
                          className="w-full p-3 text-left hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <Building className="w-4 h-4 text-purple-500" />
                          <div>
                            <div className="font-medium">{place}</div>
                            <div className="text-xs text-muted-foreground">Lieu populaire</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Résultats de recherche */}
                {suggestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                      Résultats de recherche
                    </h4>
                    <div className="space-y-1">
                      {suggestions.slice(0, 5).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect({
                            address: suggestion.place_name,
                            coordinates: {
                              lat: suggestion.center[1],
                              lng: suggestion.center[0]
                            },
                            type: 'search'
                          })}
                          className="w-full p-3 text-left hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <MapPin className="w-4 h-4 text-green-500" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{suggestion.place_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {suggestion.properties?.category || 'Adresse'}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Places récentes */}
                {recentPlaces.length > 0 && query.length < 2 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">Récents</h4>
                    <div className="space-y-1">
                      {recentPlaces.slice(0, 3).map((place, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect({
                            address: place.address,
                            coordinates: place.coordinates,
                            type: 'recent'
                          })}
                          className="w-full p-3 text-left hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <Clock className="w-4 h-4 text-orange-500" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{place.address}</div>
                            <div className="text-xs text-muted-foreground">Récent</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* État vide */}
                {suggestions.length === 0 && query.length >= 2 && !isSearching && (
                  <div className="p-4 text-center text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun résultat pour "{query}"</p>
                    <p className="text-xs">Essayez un terme plus général</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Adresse sélectionnée */}
      {value && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-800">Adresse confirmée</h4>
              <p className="text-sm text-green-600">{value.address}</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Confirmé
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
};