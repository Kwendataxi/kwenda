/**
 * 🌍 COMPOSANT DE SÉLECTION DE LIEU ULTIME
 * Interface moderne avec géolocalisation de dernière génération
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUltimateLocation } from '@/hooks/useUltimateLocation';
import { UltimateLocationData, LocationSearchResult } from '@/services/ultimateLocationService';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Target, 
  Loader2, 
  CheckCircle, 
  Wifi, 
  Satellite,
  Clock,
  AlertCircle
} from 'lucide-react';

interface UltimateLocationPickerProps {
  value?: UltimateLocationData | null;
  onChange?: (location: UltimateLocationData | null) => void;
  placeholder?: string;
  autoDetect?: boolean;
  showAccuracy?: boolean;
  context?: 'pickup' | 'destination' | 'search';
  className?: string;
}

export function UltimateLocationPicker({
  value,
  onChange,
  placeholder = "Où êtes-vous ?",
  autoDetect = false,
  showAccuracy = true,
  context = 'search',
  className = ''
}: UltimateLocationPickerProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    location: currentLocation,
    loading: locationLoading,
    accuracy,
    confidence,
    source,
    error: locationError,
    getCurrentPosition,
    searchPlaces,
    calculateDistance,
    formatDistance
  } = useUltimateLocation({ autoDetect });

  // Auto-focus et chargement initial
  useEffect(() => {
    if (inputRef.current && !value) {
      inputRef.current.focus();
    }
    
    if (!query && !isSearching) {
      loadPopularPlaces();
    }
  }, []);

  // Mise à jour de la valeur sélectionnée
  useEffect(() => {
    if (value && value.address && !query) {
      setQuery(value.address);
    }
  }, [value]);

  const loadPopularPlaces = async () => {
    try {
      setIsSearching(true);
      const popular = await searchPlaces('');
      setSearchResults(popular);
    } catch (error) {
      console.warn('Erreur chargement lieux populaires:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      loadPopularPlaces();
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchPlaces(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.warn('Erreur recherche:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await getCurrentPosition({ 
        enableHighAccuracy: true,
        timeout: 20000,
        minAccuracy: 50
      });
      
      if (position) {
        setQuery(position.address);
        onChange?.(position);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Erreur position actuelle:', error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSelectLocation = (location: LocationSearchResult) => {
    const selectedLocation: UltimateLocationData = {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      confidence: location.confidence,
      source: location.source,
      timestamp: location.timestamp,
      type: location.type
    };

    setQuery(location.address);
    onChange?.(selectedLocation);
    setShowResults(false);
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'capacitor':
      case 'gps-native':
        return <Satellite className="h-4 w-4" />;
      case 'browser':
        return <Navigation className="h-4 w-4" />;
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'ip-consensus':
        return <Target className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getAccuracyBadge = (acc: number, conf: number) => {
    if (acc <= 20) return <Badge variant="default" className="text-xs">Très précis</Badge>;
    if (acc <= 100) return <Badge variant="secondary" className="text-xs">Précis</Badge>;
    if (acc <= 1000) return <Badge variant="outline" className="text-xs">Approximatif</Badge>;
    return <Badge variant="destructive" className="text-xs">Peu précis</Badge>;
  };

  const contextIcons = {
    pickup: <Navigation className="h-4 w-4 text-primary" />,
    destination: <MapPin className="h-4 w-4 text-secondary" />,
    search: <Search className="h-4 w-4 text-muted-foreground" />
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input de recherche principal */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          {contextIcons[context]}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="pl-10 pr-16 h-11 border-border/30 focus:border-primary/40 transition-all duration-200 rounded-xl bg-background/50"
        />

        {/* Bouton localisation actuelle */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-primary/5 rounded-lg transition-all duration-200"
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation || locationLoading}
        >
          {isGettingLocation || locationLoading ? (
            <div className="animate-spin w-3.5 h-3.5 border-2 border-primary/60 border-t-transparent rounded-full" />
          ) : (
            <Target className="w-3.5 h-3.5 text-primary/70" />
          )}
        </Button>
      </div>

      {/* Message simple de statut */}
      {isGettingLocation && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mt-2">
          <div className="w-3 h-3 border border-primary/40 border-t-transparent rounded-full animate-spin" />
          <span>Localisation en cours...</span>
        </div>
      )}

      {/* Erreur de géolocalisation */}
      {locationError && (
        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{locationError}</span>
          </div>
        </div>
      )}

      {/* Résultats de recherche simplifiés */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 border-border/20 shadow-sm z-50 max-h-64 overflow-hidden rounded-xl bg-background/95 backdrop-blur-sm">
          <CardContent className="p-1">
            {isSearching ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin w-4 h-4 border-2 border-primary/60 border-t-transparent rounded-full" />
                <span className="ml-2 text-sm text-muted-foreground/70">Recherche...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-0.5">
                {searchResults.slice(0, 5).map((result) => (
                  <div
                    key={result.id}
                    className="p-2.5 rounded-lg hover:bg-muted/30 cursor-pointer transition-all duration-150 group"
                    onClick={() => handleSelectLocation(result)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-muted-foreground/60 group-hover:text-primary/70 transition-colors">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground/90">
                          {result.title || result.address}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 2 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground/70">Aucun résultat</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Overlay pour fermer les résultats */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}

export default UltimateLocationPicker;