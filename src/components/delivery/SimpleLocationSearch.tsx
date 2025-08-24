import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Clock, 
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { useToast } from '@/hooks/use-toast';

interface DeliveryLocation {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface SimpleLocationSearchProps {
  onLocationSelect: (location: DeliveryLocation) => void;
  placeholder?: string;
  currentLocation?: DeliveryLocation | null;
}

const SimpleLocationSearch = ({
  onLocationSelect,
  placeholder = "Rechercher une adresse...",
  currentLocation
}: SimpleLocationSearchProps) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { getCurrentPosition, searchLocation, loading: locationLoading } = useMasterLocation();
  const { toast } = useToast();

  // Recherche avec délai
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 2) {
      setIsSearching(true);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchLocation(query);
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
  }, [query, searchLocation]);

  const handleLocationSelect = (location: DeliveryLocation) => {
    setQuery(location.address);
    setShowDropdown(false);
    onLocationSelect(location);
    inputRef.current?.blur();
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await getCurrentPosition();
      
      const location: DeliveryLocation = {
        address: position.address,
        coordinates: {
          lat: position.lat,
          lng: position.lng
        }
      };
      
      handleLocationSelect(location);
      
      toast({
        title: "📍 Position détectée",
        description: "Votre position actuelle a été définie",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Bouton position actuelle */}
      <Button
        onClick={handleCurrentLocation}
        disabled={isGettingLocation}
        variant="outline"
        className="w-full h-12 border-primary/30 hover:bg-primary/5"
      >
        {isGettingLocation ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4 mr-2 text-primary" />
        )}
        Utiliser ma position actuelle
      </Button>

      {/* Champ de recherche */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            className="pl-10 pr-4 h-12"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
          )}
        </div>
        
        {/* Dropdown de suggestions */}
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            <Card className="absolute top-full left-0 right-0 mt-1 bg-white border shadow-lg z-20 max-h-60 overflow-auto">
              <div className="p-2">
                {/* Résultats de recherche */}
                {suggestions.length > 0 && (
                  <div className="space-y-1">
                    {suggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect({
                          address: suggestion.address || suggestion.title || 'Adresse',
                          coordinates: {
                            lat: suggestion.lat,
                            lng: suggestion.lng
                          }
                        })}
                        className="w-full p-3 text-left hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                      >
                        <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{suggestion.title || suggestion.address}</div>
                          {suggestion.subtitle && (
                            <div className="text-xs text-muted-foreground truncate">{suggestion.subtitle}</div>
                          )}
                          {suggestion.type && (
                            <div className="text-xs text-muted-foreground capitalize">{suggestion.type}</div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}

                {/* État vide */}
                {suggestions.length === 0 && query.length >= 2 && !isSearching && (
                  <div className="p-4 text-center text-muted-foreground">
                    <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun résultat pour "{query}"</p>
                  </div>
                )}

                {/* Lieux récents fallback */}
                {suggestions.length === 0 && query.length < 2 && (
                  <div className="p-3 text-center text-muted-foreground">
                    <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Tapez pour rechercher une adresse</p>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Adresse sélectionnée */}
      {currentLocation && (
        <Card className="p-3 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Adresse sélectionnée</p>
              <p className="text-xs text-green-600 truncate">{currentLocation.address}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SimpleLocationSearch;