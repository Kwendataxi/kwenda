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
import { GoogleMapsService } from '@/services/googleMapsService';

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
          
          const results = await GoogleMapsService.searchPlaces(query, proximity);
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
      const address = await GoogleMapsService.reverseGeocode(
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
      
      const results = await GoogleMapsService.searchPlaces(place, proximity);
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
    <div className="w-full space-y-6">
      {/* Titre avec icône proéminent et gradients */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
          <div className="relative z-10">{icon}</div>
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {label}
        </h3>
      </div>

      {/* Bouton Ma Position - Design ultra-moderne */}
      <Button
        onClick={handleCurrentLocation}
        disabled={isGettingLocation}
        className="w-full h-18 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
        size="lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
        <div className="relative z-10 flex items-center gap-4">
          {isGettingLocation ? (
            <Loader2 className="w-7 h-7 animate-spin drop-shadow-lg" />
          ) : (
            <Navigation2 className="w-7 h-7 drop-shadow-lg" />
          )}
          <div className="text-left">
            <div className="font-bold text-lg drop-shadow-sm">📍 Utiliser ma position actuelle</div>
            <div className="text-sm opacity-90">Géolocalisation automatique premium</div>
          </div>
        </div>
      </Button>

      {/* Champ de recherche ultra-moderne avec glassmorphism */}
      <Card className="p-6 border-2 border-primary/30 shadow-2xl bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 animate-pulse" />
        <div className="relative z-10">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-7 h-7 text-primary drop-shadow-sm" />
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
              className="pl-16 pr-5 h-24 text-xl font-medium border-2 border-primary/20 bg-white/50 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-lg placeholder:text-muted-foreground/70 shadow-inner transition-all duration-300 hover:shadow-lg"
            />
            {isSearching && (
              <Loader2 className="absolute right-5 top-1/2 transform -translate-y-1/2 w-7 h-7 animate-spin text-primary drop-shadow-sm" />
            )}
          </div>
          
          {/* Dropdown ultra-moderne avec glassmorphism */}
          {showDropdown && (
            <>
              {/* Backdrop premium pour isoler visuellement */}
              <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-md z-[9990]"
                onClick={() => setShowDropdown(false)}
              />
              <Card className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl rounded-2xl z-[9999] max-h-[65vh] overflow-auto">
              <div className="p-4">
                
                {/* Bouton Ma Position premium - toujours visible */}
                <Button
                  onClick={handleCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full h-16 mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-xl border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
                  <div className="relative z-10 flex items-center gap-4">
                    {isGettingLocation ? (
                      <Loader2 className="w-6 h-6 animate-spin drop-shadow-lg" />
                    ) : (
                      <Navigation2 className="w-6 h-6 drop-shadow-lg" />
                    )}
                    <div className="text-left flex-1">
                      <div className="font-bold text-base drop-shadow-sm">Ma position actuelle</div>
                      <div className="text-xs opacity-90">Géolocalisation automatique premium</div>
                    </div>
                    <ChevronRight className="w-5 h-5 drop-shadow-sm" />
                  </div>
                </Button>

                {/* Lieux populaires avec design premium */}
                {cityContext && cityContext.popular.length > 0 && query.length < 2 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3 px-2">
                      <Building className="w-4 h-4 text-purple-500" />
                      <h4 className="text-sm font-bold text-muted-foreground">
                        🏆 Lieux populaires à {cityContext.name}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {cityContext.popular.map((place, index) => (
                        <button
                          key={index}
                          onClick={() => handlePopularPlace(place)}
                          className="w-full p-4 text-left hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 rounded-xl transition-all duration-300 flex items-center gap-3 border border-border/30 hover:border-primary/30 hover:shadow-lg group bg-white/50 backdrop-blur-sm"
                        >
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Building className="w-5 h-5 text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">{place}</div>
                            <div className="text-xs text-muted-foreground">🌟 Lieu populaire premium</div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
            </>
          )}
        </div>
      </Card>

      {/* Adresse sélectionnée avec design premium */}
      {value && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl backdrop-blur-sm relative overflow-hidden animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/20 to-emerald-100/20 animate-pulse" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <MapPin className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg text-green-800 mb-1">✅ Adresse confirmée</h4>
              <p className="text-sm text-green-700 font-medium">{value.address}</p>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 shadow-lg animate-pulse">
              ✓ Confirmé
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
};