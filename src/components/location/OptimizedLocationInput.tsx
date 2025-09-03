/**
 * Composant de saisie de localisation simplifié et optimisé
 * Résout les problèmes de fluidité et de performance
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Navigation, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useIntelligentAddressSearch } from '@/hooks/useIntelligentAddressSearch';
import { intelligentToUnified, type UnifiedLocation } from '@/types/locationAdapter';
import { isValidLocation, secureLocation } from '@/utils/locationValidation';
import { cn } from '@/lib/utils';

interface OptimizedLocationInputProps {
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: UnifiedLocation) => void;
  className?: string;
  showCurrentLocation?: boolean;
  autoFocus?: boolean;
  error?: string;
}

export const OptimizedLocationInput: React.FC<OptimizedLocationInputProps> = ({
  placeholder = "Rechercher une adresse...",
  value = '',
  onLocationSelect,
  className,
  showCurrentLocation = true,
  autoFocus = false,
  error
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UnifiedLocation | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    results,
    isSearching,
    search,
    clearResults
  } = useIntelligentAddressSearch({
    city: 'Kinshasa'
  });

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (query.trim().length >= 2) {
        search(query);
        setIsOpen(true);
      } else {
        clearResults();
        setIsOpen(false);
      }
    }, 300);
  }, [search, clearResults]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedLocation(null);
    debouncedSearch(newValue);
  }, [debouncedSearch]);

  // Handle location selection
  const handleLocationSelect = useCallback((result: any) => {
    const unified = intelligentToUnified(result);
    const secured = secureLocation(unified);
    
    setSelectedLocation(secured);
    setInputValue(secured.address);
    setIsOpen(false);
    clearResults();
    
    onLocationSelect(secured);
  }, [onLocationSelect, clearResults]);

  // Get current location
  const handleGetCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Mock reverse geocoding - in real app, call geocoding service
            const currentLocation: UnifiedLocation = {
              address: `Position actuelle (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              lat: latitude,
              lng: longitude,
              type: 'current',
              name: 'Position actuelle',
              coordinates: { lat: latitude, lng: longitude }
            };
            
            handleLocationSelect(currentLocation);
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Fallback to Kinshasa center
            const fallbackLocation: UnifiedLocation = {
              address: 'Kinshasa, République Démocratique du Congo',
              lat: -4.3217,
              lng: 15.3069,
              type: 'fallback',
              name: 'Kinshasa (position par défaut)',
              coordinates: { lat: -4.3217, lng: 15.3069 }
            };
            
            handleLocationSelect(fallbackLocation);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      }
    } catch (error) {
      console.error('Location access error:', error);
    } finally {
      setIsGettingLocation(false);
    }
  }, [handleLocationSelect]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Sync with external value
  useEffect(() => {
    if (value !== inputValue && !selectedLocation) {
      setInputValue(value);
    }
  }, [value, inputValue, selectedLocation]);

  const hasValidSelection = selectedLocation && isValidLocation(selectedLocation);

  return (
    <div className={cn("relative w-full", className)}>
      <Card className={cn(
        "overflow-hidden transition-colors",
        error && "border-destructive",
        hasValidSelection && "border-green-500"
      )}>
        <CardContent className="p-3">
          <div className="flex gap-2">
            {/* Input field */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => {
                  if (results.length > 0) setIsOpen(true);
                }}
                placeholder={placeholder}
                className={cn(
                  "pl-10 pr-4",
                  hasValidSelection && "text-green-700 bg-green-50",
                  error && "border-destructive focus:border-destructive"
                )}
              />
              
              {/* Status indicators */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {isSearching && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {hasValidSelection && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
                {error && !hasValidSelection && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>

            {/* Current location button */}
            {showCurrentLocation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="shrink-0"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-2 text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {error}
            </div>
          )}

          {/* Valid selection indicator */}
          {hasValidSelection && (
            <div className="mt-2 text-sm text-green-700 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Adresse valide sélectionnée
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-auto border shadow-lg">
          <div className="py-1">
            {results.slice(0, 5).map((result, index) => (
              <div
                key={result.id}
                onClick={() => handleLocationSelect(result)}
                className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
              >
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{result.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {result.commune}, {result.city}
                  </p>
                </div>

                {result.category && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {result.category}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};