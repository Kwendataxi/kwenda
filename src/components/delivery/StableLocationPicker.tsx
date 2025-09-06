import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { masterLocationService } from '@/services/MasterLocationService';
import ProductionGeolocation from './ProductionGeolocation';
import type { LocationData, LocationSearchResult } from '@/services/MasterLocationService';
import type { UnifiedLocation } from '@/types/locationAdapter';
import { 
  MapPin, 
  Target, 
  Search, 
  X, 
  CheckCircle2,
  Clock,
  Navigation2,
  Star
} from 'lucide-react';

interface StableLocationPickerProps {
  type: 'pickup' | 'destination';
  onLocationSelect: (location: UnifiedLocation) => void;
  placeholder?: string;
  selectedLocation?: UnifiedLocation | null;
  autoFocus?: boolean;
  showCurrentLocation?: boolean;
  className?: string;
}

const StableLocationPicker: React.FC<StableLocationPickerProps> = ({
  type,
  onLocationSelect,
  placeholder,
  selectedLocation,
  autoFocus = false,
  showCurrentLocation = true,
  className
}) => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<LocationData | null>(null);

  // Adresses populaires par type
  const popularAddresses = {
    pickup: [
      { id: 'home', title: '🏠 Domicile', subtitle: 'Ma maison' },
      { id: 'work', title: '🏢 Bureau', subtitle: 'Mon lieu de travail' },
      { id: 'market', title: '🛒 Marché Central', subtitle: 'Centre commercial' }
    ],
    destination: [
      { id: 'airport', title: '✈️ Aéroport', subtitle: 'Aéroport de Ndjili' },
      { id: 'hospital', title: '🏥 Hôpital', subtitle: 'Centre médical' },
      { id: 'university', title: '🎓 Université', subtitle: 'Campus universitaire' }
    ]
  };

  // Recherche avec debouncing intelligent
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await masterLocationService.searchLocation(
        searchQuery,
        currentPosition || undefined
      );
      setResults(searchResults.slice(0, 8)); // Limiter à 8 résultats
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher des adresses pour le moment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentPosition, toast]);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchLocations(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchLocations]);

  // Gestion de la sélection d'adresse
  const handleLocationSelect = (location: LocationSearchResult | LocationData) => {
    const unifiedLocation: UnifiedLocation = {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      type: location.type,
      placeId: 'placeId' in location ? location.placeId : undefined,
      name: 'title' in location ? location.title : location.address,
      subtitle: 'subtitle' in location ? location.subtitle : undefined,
      coordinates: { lat: location.lat, lng: location.lng }
    };

    onLocationSelect(unifiedLocation);
    setQuery(location.address);
    setShowSuggestions(false);
    
    toast({
      title: type === 'pickup' ? "📍 Point de collecte défini" : "🎯 Destination définie",
      description: location.address,
    });
  };

  // Gestion de la position actuelle
  const handleCurrentLocationDetected = (location: LocationData) => {
    setCurrentPosition(location);
    if (showCurrentLocation && type === 'pickup') {
      // Auto-sélectionner pour le pickup
      handleLocationSelect(location);
    }
  };

  // Gestion de l'utilisation de la position actuelle
  const useCurrentPosition = () => {
    if (currentPosition) {
      handleLocationSelect(currentPosition);
    }
  };

  // Nettoyage de la sélection
  const clearSelection = () => {
    setQuery('');
    setResults([]);
    setShowSuggestions(false);
  };

  const isPickup = type === 'pickup';
  const icon = isPickup ? MapPin : Target;
  const iconColor = isPickup ? 'text-primary' : 'text-secondary';
  const cardColor = isPickup ? 'border-primary/20' : 'border-secondary/20';

  return (
    <div className={className}>
      {/* Géolocalisation automatique pour pickup */}
      {isPickup && showCurrentLocation && (
        <ProductionGeolocation
          onLocationDetected={handleCurrentLocationDetected}
          autoDetect={true}
          showFallback={true}
          className="mb-4"
        />
      )}

      {/* Interface de sélection principale */}
      <Card className={`${cardColor} transition-all duration-300`}>
        <CardContent className="p-4 space-y-4">
          {/* Header avec icône distinctive */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPickup ? 'bg-primary/10' : 'bg-secondary/10'}`}>
              {React.createElement(icon, { className: `h-5 w-5 ${iconColor}` })}
            </div>
            <div>
              <h3 className="font-semibold text-base">
                {isPickup ? 'Point de collecte' : 'Destination'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isPickup ? 'Où récupérer le colis ?' : 'Où livrer le colis ?'}
              </p>
            </div>
          </div>

          {/* Champ de recherche */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={placeholder || `Rechercher ${isPickup ? 'lieu de collecte' : 'destination'}...`}
                autoFocus={autoFocus}
                className={`pl-10 pr-10 h-12 rounded-xl border-border/20 bg-card/50 backdrop-blur-sm
                          hover:border-${isPickup ? 'primary' : 'secondary'}/30 
                          focus:border-${isPickup ? 'primary' : 'secondary'}/50 
                          transition-all duration-300`}
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Bouton position actuelle pour destination */}
            {!isPickup && currentPosition && (
              <Button
                variant="outline"
                size="sm"
                onClick={useCurrentPosition}
                className="mt-2 w-full flex items-center gap-2"
              >
                <Navigation2 className="h-4 w-4" />
                Utiliser ma position actuelle
              </Button>
            )}
          </div>

          {/* Suggestions et résultats */}
          {showSuggestions && (
            <div className="space-y-2">
              {/* Adresses populaires */}
              {!query && popularAddresses[type].length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Adresses populaires
                  </p>
                  <div className="space-y-1">
                    {popularAddresses[type].map((popular) => (
                      <Button
                        key={popular.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-auto p-3 text-left"
                        onClick={() => {
                          // Ici vous pourriez avoir une logique pour récupérer les coordonnées
                          // Pour l'instant, on utilise des coordonnées par défaut
                          const mockLocation: LocationSearchResult = {
                            id: popular.id,
                            address: `${popular.title}, Kinshasa, RDC`,
                            lat: -4.3217,
                            lng: 15.3069,
                            type: 'popular',
                            title: popular.title,
                            subtitle: popular.subtitle
                          };
                          handleLocationSelect(mockLocation);
                        }}
                      >
                        <div>
                          <div className="font-medium text-sm">{popular.title}</div>
                          <div className="text-xs text-muted-foreground">{popular.subtitle}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Résultats de recherche */}
              {query && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Résultats de recherche
                    {loading && <Clock className="h-3 w-3 animate-spin" />}
                  </p>
                  
                  {results.length > 0 ? (
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {results.map((result) => (
                        <Button
                          key={result.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-auto p-3 text-left"
                          onClick={() => handleLocationSelect(result)}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {result.title || result.address}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {result.subtitle || result.address}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : query.length >= 2 && !loading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun résultat trouvé pour "{query}"
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* Adresse sélectionnée */}
          {selectedLocation && (
            <div className={`p-3 rounded-lg border ${cardColor} bg-card/30`}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">Adresse confirmée</span>
                  <p className="text-sm text-muted-foreground mt-1 break-words">
                    {selectedLocation.address}
                  </p>
                  {selectedLocation.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {selectedLocation.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StableLocationPicker;