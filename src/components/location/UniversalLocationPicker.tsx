/**
 * Composant de sélection de localisation universel
 * Remplace tous les autres composants de localisation
 * Interface adaptative selon le contexte (transport, livraison, marketplace)
 */

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2, Search, LocateFixed, Clock, Star, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { LocationData, LocationSearchResult } from '@/services/MasterLocationService';
import { cn } from '@/lib/utils';

interface UniversalLocationPickerProps {
  // Configuration de base
  value?: LocationData | null;
  onLocationSelect: (location: LocationData) => void;
  placeholder?: string;
  className?: string;
  
  // Options d'affichage
  showCurrentLocation?: boolean;
  showNearbyPlaces?: boolean;
  showRecentLocations?: boolean;
  
  // Personnalisation contextuelle
  context?: 'transport' | 'delivery' | 'marketplace' | 'general';
  variant?: 'default' | 'compact' | 'inline';
  
  // Options avancées
  maxResults?: number;
  nearbyRadius?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}

// Configuration par contexte
const contextConfig = {
  transport: {
    placeholder: "Où souhaitez-vous aller ?",
    icon: MapPin,
    showCurrentLocation: true,
    showNearbyPlaces: true,
    maxResults: 8,
    nearbyRadius: 10
  },
  delivery: {
    placeholder: "Adresse de livraison",
    icon: MapPin,
    showCurrentLocation: true,
    showNearbyPlaces: false,
    maxResults: 6,
    nearbyRadius: 5
  },
  marketplace: {
    placeholder: "Votre localisation",
    icon: MapPin,
    showCurrentLocation: true,
    showNearbyPlaces: true,
    maxResults: 5,
    nearbyRadius: 3
  },
  general: {
    placeholder: "Rechercher une adresse",
    icon: Search,
    showCurrentLocation: true,
    showNearbyPlaces: true,
    maxResults: 8,
    nearbyRadius: 5
  }
};

export const UniversalLocationPicker: React.FC<UniversalLocationPickerProps> = ({
  value,
  onLocationSelect,
  placeholder,
  className,
  showCurrentLocation,
  showNearbyPlaces,
  showRecentLocations = true,
  context = 'general',
  variant = 'default',
  maxResults,
  nearbyRadius,
  autoFocus = false,
  disabled = false
}) => {
  // Configuration contextualisée
  const config = contextConfig[context];
  const finalPlaceholder = placeholder || config.placeholder;
  const finalMaxResults = maxResults || config.maxResults;
  const finalNearbyRadius = nearbyRadius || config.nearbyRadius;
  const finalShowCurrentLocation = showCurrentLocation ?? config.showCurrentLocation;
  const finalShowNearbyPlaces = showNearbyPlaces ?? config.showNearbyPlaces;

  // État local
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<LocationSearchResult[]>([]);
  const [recentLocations, setRecentLocations] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Hook de géolocalisation
  const {
    location: currentLocation,
    loading: gettingLocation,
    searchLocation,
    getCurrentPosition,
    getNearbyPlaces,
    formatDistance,
    calculateDistance
  } = useMasterLocation();

  // ============ EFFETS ============

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    // Charger les emplacements récents
    try {
      const saved = localStorage.getItem('recent_locations');
      if (saved) {
        setRecentLocations(JSON.parse(saved).slice(0, 3));
      }
    } catch (error) {
      console.warn('Error loading recent locations:', error);
    }
  }, []);

  useEffect(() => {
    // Fermer lors du clic à l'extérieur
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    // Recherche avec debounce
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.trim().length >= 2) {
      setIsSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await searchLocation(query);
          setSearchResults(results.slice(0, finalMaxResults));
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [query, searchLocation, finalMaxResults]);

  // ============ GESTIONNAIRES ============

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleLocationSelect = (location: LocationData | LocationSearchResult) => {
    const selectedLocation: LocationData = {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      type: location.type,
      placeId: location.placeId,
      accuracy: location.accuracy
    };

    // Mettre à jour l'affichage
    setQuery(location.address);
    setIsOpen(false);

    // Sauvegarder dans les récents
    saveToRecent(selectedLocation);

    // Callback
    onLocationSelect(selectedLocation);
  };

  const handleCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000
      });
      handleLocationSelect(position);
    } catch (error) {
      console.error('Current location error:', error);
    }
  };

  const handleFocus = async () => {
    setIsOpen(true);
    
    // Charger les lieux à proximité si disponible
    if (finalShowNearbyPlaces && currentLocation && nearbyPlaces.length === 0) {
      try {
        const places = await getNearbyPlaces(finalNearbyRadius);
        setNearbyPlaces(places);
      } catch (error) {
        console.error('Nearby places error:', error);
      }
    }
  };

  const saveToRecent = (location: LocationData) => {
    try {
      const recent = [...recentLocations.filter(l => 
        calculateDistance({lat: l.lat, lng: l.lng}, {lat: location.lat, lng: location.lng}) > 100
      ), location].slice(0, 5);
      
      setRecentLocations(recent);
      localStorage.setItem('recent_locations', JSON.stringify(recent));
    } catch (error) {
      console.warn('Error saving recent location:', error);
    }
  };

  // ============ UTILITAIRES ============

  const getLocationIcon = (type?: string) => {
    switch (type) {
      case 'current': return <LocateFixed className="h-4 w-4 text-primary" />;
      case 'database': 
      case 'popular': return <Star className="h-4 w-4 text-amber-500" />;
      case 'recent': return <Clock className="h-4 w-4 text-muted-foreground" />;
      default: return <MapPin className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLocationBadge = (type?: string, isPopular?: boolean) => {
    if (type === 'current') return <Badge variant="default" className="text-xs">Actuel</Badge>;
    if (type === 'database' || isPopular) return <Badge variant="secondary" className="text-xs">Populaire</Badge>;
    if (type === 'recent') return <Badge variant="outline" className="text-xs">Récent</Badge>;
    return null;
  };

  const formatLocationDistance = (location: LocationData | LocationSearchResult) => {
    if (!currentLocation) return null;
    
    const distance = calculateDistance(
      { lat: currentLocation.lat, lng: currentLocation.lng },
      { lat: location.lat, lng: location.lng }
    );
    
    if (distance < 10000) { // Moins de 10km
      return formatDistance(distance);
    }
    
    return null;
  };

  // ============ RENDU ============

  const isCompact = variant === 'compact';
  const isInline = variant === 'inline';

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Champ de saisie */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value?.address || query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={finalPlaceholder}
          disabled={disabled}
          className={cn(
            "pl-10 pr-12",
            isCompact && "h-9 text-sm",
            isInline && "border-0 shadow-none"
          )}
        />
        
        {/* Bouton position actuelle */}
        {finalShowCurrentLocation && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
            onClick={handleCurrentLocation}
            disabled={disabled || gettingLocation}
          >
            {gettingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {/* Indicateur dropdown */}
        {isOpen && (
          <ChevronDown className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>

      {/* Dropdown de résultats */}
      {isOpen && (
        <Card className={cn(
          "absolute top-full z-50 mt-1 w-full max-h-96 overflow-y-auto shadow-lg",
          isInline && "border-0 shadow-xl"
        )}>
          <div className="p-2">
            {/* Position actuelle */}
            {finalShowCurrentLocation && currentLocation && (
              <>
                <div
                  onClick={() => handleLocationSelect(currentLocation)}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                >
                  {getLocationIcon('current')}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">Position actuelle</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {currentLocation.address}
                    </div>
                  </div>
                  {getLocationBadge('current')}
                </div>
                <Separator className="my-2" />
              </>
            )}

            {/* Résultats de recherche */}
            {query.trim() && (
              <>
                <div className="px-2 py-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Search className="h-3 w-3" />
                    Résultats de recherche
                    {isSearching && <Loader2 className="h-3 w-3 animate-spin" />}
                  </div>
                </div>
                
                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <div
                      key={result.id || index}
                      onClick={() => handleLocationSelect(result)}
                      className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                    >
                      {getLocationIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{result.title}</div>
                        {result.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {formatLocationDistance(result) && (
                          <span className="text-xs text-muted-foreground">
                            {formatLocationDistance(result)}
                          </span>
                        )}
                        {getLocationBadge(result.type, result.isPopular)}
                      </div>
                    </div>
                  ))
                ) : !isSearching && query.trim().length >= 2 ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    Aucun résultat trouvé pour "{query}"
                  </div>
                ) : null}
                
                {(searchResults.length > 0 || isSearching) && <Separator className="my-2" />}
              </>
            )}

            {/* Lieux à proximité */}
            {!query.trim() && finalShowNearbyPlaces && nearbyPlaces.length > 0 && (
              <>
                <div className="px-2 py-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    À proximité
                  </div>
                </div>
                {nearbyPlaces.slice(0, 4).map((place, index) => (
                  <div
                    key={place.id || index}
                    onClick={() => handleLocationSelect(place)}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                  >
                    {getLocationIcon(place.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{place.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {place.subtitle}
                      </div>
                    </div>
                    {getLocationBadge(place.type, place.isPopular)}
                  </div>
                ))}
                <Separator className="my-2" />
              </>
            )}

            {/* Emplacements récents */}
            {!query.trim() && showRecentLocations && recentLocations.length > 0 && (
              <>
                <div className="px-2 py-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Récents
                  </div>
                </div>
                {recentLocations.map((recent, index) => (
                  <div
                    key={index}
                    onClick={() => handleLocationSelect(recent)}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                  >
                    {getLocationIcon('recent')}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{recent.address}</div>
                      <div className="text-xs text-muted-foreground">
                        Utilisé récemment
                      </div>
                    </div>
                    {getLocationBadge('recent')}
                  </div>
                ))}
              </>
            )}

            {/* État vide */}
            {!query.trim() && 
             (!currentLocation || !finalShowCurrentLocation) && 
             nearbyPlaces.length === 0 && 
             recentLocations.length === 0 && (
              <div className="p-6 text-center">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm font-medium mb-1">Rechercher une adresse</div>
                <div className="text-xs text-muted-foreground">
                  Tapez pour commencer votre recherche
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default UniversalLocationPicker;