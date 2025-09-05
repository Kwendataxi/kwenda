import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Target, 
  Search, 
  CheckCircle2, 
  MapPin, 
  Navigation, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { useIntelligentAddressSearch } from '@/hooks/useIntelligentAddressSearch';
import { intelligentToUnified, type UnifiedLocation } from '@/types/locationAdapter';

interface CleanLocationPickerProps {
  placeholder?: string;
  onLocationSelect: (location: UnifiedLocation) => void;
  showCurrentLocation?: boolean;
  className?: string;
  autoFocus?: boolean;
  type?: 'pickup' | 'destination';
}

export const CleanLocationPicker: React.FC<CleanLocationPickerProps> = ({
  placeholder,
  onLocationSelect,
  showCurrentLocation = true,
  className = '',
  autoFocus = false,
  type = 'pickup'
}) => {
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<UnifiedLocation | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    results: searchResults, 
    isSearching: searching, 
    recentSearches, 
    popularPlaces,
    searchWithLocation
  } = useIntelligentAddressSearch();

  // Configuration selon le type
  const config = {
    pickup: {
      icon: Target,
      placeholder: placeholder || "Où souhaitez-vous être récupéré ?",
      currentText: "Ma position actuelle",
      confirmText: "Point de collecte confirmé",
      gpsText: "Détecter ma position"
    },
    destination: {
      icon: Navigation,
      placeholder: placeholder || "Où souhaitez-vous livrer ?",
      currentText: "Position de livraison",
      confirmText: "Point de livraison confirmé",
      gpsText: "Utiliser cette position"
    }
  };

  const Icon = config[type].icon;

  // Géolocalisation intelligente
  const getCurrentLocation = useCallback(async (): Promise<UnifiedLocation | null> => {
    if (!navigator.geolocation) {
      setLocationError('Géolocalisation non supportée');
      return null;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Geocoding intelligent avec fallback
      let address = `Position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
      // Zones connues de Kinshasa
      const knownZones = [
        { name: 'Gombe', center: [-4.3167, 15.3167], radius: 0.02 },
        { name: 'Kinshasa Centre', center: [-4.3217, 15.3069], radius: 0.03 },
        { name: 'Lemba', center: [-4.3833, 15.2833], radius: 0.03 },
        { name: 'Kalamu', center: [-4.3500, 15.3000], radius: 0.025 },
        { name: 'Bandalungwa', center: [-4.3700, 15.2900], radius: 0.025 }
      ];
      
      for (const zone of knownZones) {
        const distance = Math.sqrt(
          Math.pow(latitude - zone.center[0], 2) + Math.pow(longitude - zone.center[1], 2)
        );
        if (distance < zone.radius) {
          address = `${zone.name}, Kinshasa, RDC`;
          break;
        }
      }

      return {
        address,
        lat: latitude,
        lng: longitude,
        type: 'current',
        coordinates: { lat: latitude, lng: longitude }
      };
    } catch (error: any) {
      let errorMessage = 'Erreur de géolocalisation';
      
      switch (error.code) {
        case 1:
          errorMessage = 'Autorisation refusée pour la géolocalisation';
          break;
        case 2:
          errorMessage = 'Position indisponible';
          break;
        case 3:
          errorMessage = 'Délai de géolocalisation dépassé';
          break;
      }
      
      setLocationError(errorMessage);
      return null;
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  // Handler pour géolocalisation
  const handleCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setSelectedLocation(location);
      setQuery(location.address);
      setShowSuggestions(false);
      onLocationSelect(location);
    }
  };

  // Handler pour sélection depuis suggestions
  const handleLocationSelect = (suggestion: any) => {
    const unified = intelligentToUnified(suggestion);
    setSelectedLocation(unified);
    setQuery(unified.address);
    setShowSuggestions(false);
    onLocationSelect(unified);
  };

  // Recherche avec debounce
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setLocationError(null);
    
    if (value.length >= 2) {
      setShowSuggestions(true);
      // Déclencher la recherche
      searchWithLocation(value);
    } else {
      setShowSuggestions(false);
    }
  }, [searchWithLocation]);

  // Focus automatique
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Cacher suggestions quand on clique dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Combiner toutes les suggestions
  const allSuggestions = [
    ...searchResults,
    ...(query.length < 2 ? popularPlaces : []),
    ...(query.length < 2 ? recentSearches : [])
  ].slice(0, 6);

  return (
    <div className={`relative ${className}`}>
      {/* Interface principale épurée */}
      <div className="relative">
        {/* Champ de recherche moderne avec glassmorphism */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowSuggestions(query.length >= 2 || allSuggestions.length > 0)}
            placeholder={config[type].placeholder}
            className="h-14 pl-12 pr-16 text-base rounded-xl border-2 border-border/20 bg-card/50 backdrop-blur-sm
                      hover:border-primary/30 focus:border-primary/50 transition-all duration-300
                      placeholder:text-muted-foreground/70"
          />
          
          {/* Bouton GPS intégré */}
          {showCurrentLocation && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleCurrentLocation}
              disabled={isDetectingLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg 
                        hover:bg-primary/10 transition-all duration-200"
            >
              {isDetectingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Icon className="h-4 w-4 text-primary" />
              )}
            </Button>
          )}
        </div>

        {/* Erreur de géolocalisation */}
        {locationError && (
          <div className="flex items-center gap-2 mt-2 text-xs text-destructive animate-fade-in">
            <AlertCircle className="h-3 w-3" />
            {locationError}
          </div>
        )}
      </div>

      {/* Suggestions modernes */}
      {showSuggestions && allSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto
                        bg-card/95 backdrop-blur-md border-border/30 shadow-xl animate-fade-in">
          <CardContent className="p-2">
            {allSuggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.id || suggestion.name}-${index}`}
                className="flex items-center gap-3 p-3 hover:bg-primary/5 cursor-pointer 
                          rounded-lg transition-all duration-200 group"
                onClick={() => handleLocationSelect(suggestion)}
              >
                <div className="flex-shrink-0">
                  <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {suggestion.name}
                  </p>
                  {(suggestion.subtitle || suggestion.commune) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {suggestion.subtitle || `${suggestion.commune}, ${suggestion.city}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confirmation élégante */}
      {selectedLocation && (
        <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-success text-sm">
                {config[type].confirmText}
              </p>
              <p className="text-xs text-success/80 mt-1 truncate">
                📍 {selectedLocation.address}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loader de recherche */}
      {searching && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-40 mt-2">
          <Card className="bg-card/95 backdrop-blur-md border-border/30">
            <CardContent className="p-4 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
              <span className="text-sm text-muted-foreground">Recherche en cours...</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};