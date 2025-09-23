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
          className="pl-10 pr-12 h-12 text-base glassmorphism border-primary/20 focus:border-primary/40"
        />

        {/* Bouton localisation actuelle */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0"
          onClick={handleUseCurrentLocation}
          disabled={isGettingLocation || locationLoading}
        >
          {isGettingLocation || locationLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Target className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Indicateur de précision pour la position actuelle */}
      {showAccuracy && currentLocation && !isGettingLocation && (
        <div className="mt-2 p-2 bg-muted/20 rounded-lg glassmorphism">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {getSourceIcon(source || 'unknown')}
              <span className="text-muted-foreground">Source: {source}</span>
            </div>
            <div className="flex items-center gap-2">
              {accuracy && getAccuracyBadge(accuracy, confidence || 0)}
              <span className="text-muted-foreground">±{accuracy}m</span>
            </div>
          </div>
          {confidence && (
            <div className="flex items-center gap-1 mt-1">
              <div className="h-1 bg-muted rounded-full flex-1">
                <div 
                  className="h-1 bg-primary rounded-full transition-all"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{confidence}%</span>
            </div>
          )}
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

      {/* Résultats de recherche */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto glassmorphism border-primary/20">
          <CardContent className="p-2">
            {isSearching ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 rounded-lg hover:bg-muted/20 cursor-pointer transition-colors group"
                    onClick={() => handleSelectLocation(result)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">{result.title}</p>
                          {result.isPopular && (
                            <Badge variant="outline" className="text-xs">Populaire</Badge>
                          )}
                        </div>
                        
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1">
                          {result.distance && currentLocation && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistance(result.distance)}
                            </span>
                          )}
                          
                          {result.confidence && result.confidence >= 70 && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Vérifié</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {getSourceIcon(result.source)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun résultat trouvé</p>
                <p className="text-xs mt-1">Essayez une autre recherche</p>
              </div>
            )}
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