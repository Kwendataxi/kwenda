/**
 * 🎯 SÉLECTEUR DE LOCALISATION MODERNE ET INTELLIGENT
 * 
 * Interface optimisée pour sélection rapide d'adresses
 * Design glassmorphism avec animations fluides
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSmartGeolocation, LocationData, LocationSearchResult } from '@/hooks/useSmartGeolocation';
import { 
  MapPin, 
  Search, 
  Loader2, 
  Navigation, 
  Star, 
  Clock, 
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartLocationPickerProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  label?: string;
  context?: 'pickup' | 'delivery' | 'general';
  showAccuracy?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SmartLocationPicker: React.FC<SmartLocationPickerProps> = ({
  value,
  onChange,
  placeholder = "🔍 Rechercher une adresse...",
  label,
  context = 'general',
  showAccuracy = false,
  disabled = false,
  className
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const { 
    getCurrentPosition,
    searchLocations,
    getPopularPlaces,
    loading,
    searchLoading,
    error,
    source,
    clearError
  } = useSmartGeolocation();

  // Synchroniser query avec value
  useEffect(() => {
    if (!value) {
      setQuery('');
    } else if (!isInputFocused) {
      setQuery(value.address);
    }
  }, [value, isInputFocused]);

  // Gestion de la recherche avec debouncing automatique
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim()) {
      const results = await searchLocations(searchQuery);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions(getPopularPlaces());
      setShowSuggestions(true);
    }
  };

  // Sélection d'un lieu
  const handleLocationSelect = (location: LocationData | LocationSearchResult) => {
    const locationData: LocationData = {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      type: location.type,
      placeId: location.placeId,
      name: location.name,
      subtitle: (location as LocationSearchResult).subtitle,
      accuracy: location.accuracy,
      confidence: location.confidence
    };
    
    onChange(locationData);
    setQuery(location.address);
    setShowSuggestions(false);
    setIsInputFocused(false);
    clearError();
  };

  // Géolocalisation GPS
  const handleGetCurrentLocation = async () => {
    try {
      setQuery('🎯 Détection de votre position...');
      
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        fallbackToIP: true,
        fallbackToDefault: true
      });
      
      if (position) {
        handleLocationSelect(position);
      }
    } catch (error) {
      console.error('❌ Erreur géolocalisation:', error);
      setQuery('');
    }
  };

  // Affichage focus avec suggestions populaires
  const handleFocus = async () => {
    setIsInputFocused(true);
    if (!showSuggestions) {
      setSuggestions(getPopularPlaces());
      setShowSuggestions(true);
    }
  };

  // Icône contextuelle selon le type de lieu
  const getLocationIcon = (suggestion: LocationSearchResult) => {
    if (suggestion.isPopular) {
      return <Star className="h-4 w-4 text-amber-500 fill-amber-500" />;
    }
    if (suggestion.type === 'recent') {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    if (suggestion.type === 'gps') {
      return <Navigation className="h-4 w-4 text-green-500" />;
    }
    return <MapPin className="h-4 w-4 text-primary" />;
  };

  // Badge de contexte
  const getContextColor = () => {
    switch (context) {
      case 'pickup': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'delivery': return 'border-blue-200 bg-blue-50 text-blue-700';
      default: return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const displayValue = value?.address || query;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Label avec indicateur de source */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground/80">
            {label}
          </label>
          {source && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {source}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        {/* Input principal avec design glassmorphism */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className={cn(
              "relative rounded-lg border-2 transition-all duration-200",
              isInputFocused ? "border-primary shadow-lg shadow-primary/20" : "border-border/50",
              disabled && "opacity-60"
            )}>
              <Input
                value={displayValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder}
                onFocus={handleFocus}
                onBlur={() => setIsInputFocused(false)}
                className={cn(
                  "pl-12 pr-12 border-0 bg-background/80 backdrop-blur-sm",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  getContextColor()
                )}
                disabled={disabled || (loading && query.includes('Détection'))}
              />
              
              {/* Icône de recherche */}
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              
              {/* Indicateur de recherche */}
              {searchLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              
              {/* Badge de précision */}
              {value?.accuracy && showAccuracy && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    ±{Math.round(value.accuracy)}m
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Bouton géolocalisation */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetCurrentLocation}
            disabled={disabled || loading}
            className={cn(
              "shrink-0 border-2 hover:border-primary transition-all duration-200",
              loading && "animate-pulse"
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Message d'erreur stylisé */}
        {error && (
          <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="text-sm text-destructive">
              {error}
            </div>
          </div>
        )}

        {/* Suggestions intelligentes avec z-index élevé et fond opaque */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[99999] w-full mt-2 bg-white dark:bg-gray-900 border-2 border-border rounded-xl shadow-2xl max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id || index}
                type="button"
                className="w-full px-4 py-4 text-left hover:bg-accent transition-all duration-150 border-b border-border/30 last:border-b-0 flex items-start gap-3 first:rounded-t-xl last:rounded-b-xl group"
                onClick={() => handleLocationSelect(suggestion)}
              >
                <div className="mt-1 shrink-0">
                  {getLocationIcon(suggestion)}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Nom principal lisible avec troncature */}
                  <div className="font-semibold text-base text-foreground line-clamp-1 flex items-center gap-2 mb-1">
                    {suggestion.name || suggestion.title || 'Sans nom'}
                    {suggestion.isPopular && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-medium">
                        Populaire
                      </span>
                    )}
                  </div>
                  
                  {/* Adresse complète en subtitle avec troncature */}
                  <div className="text-sm text-muted-foreground line-clamp-2 mb-1">
                    {suggestion.address}
                  </div>
                  
                  {/* Ville/Pays uniquement */}
                  {suggestion.subtitle && (
                    <div className="text-xs text-muted-foreground/70">
                      📍 {suggestion.subtitle}
                    </div>
                  )}
                  
                  {/* Indicateur de confiance simplifié */}
                  {suggestion.confidence && suggestion.confidence > 0.7 && (
                    <div className="text-xs text-primary/70 mt-1.5 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Adresse vérifiée
                    </div>
                  )}
                </div>
              </button>
            ))}
            
            {/* Footer informatif */}
            <div className="px-4 py-3 text-xs text-muted-foreground bg-muted/50 border-t border-border/30 rounded-b-xl flex items-center gap-2">
              <Navigation className="h-3 w-3" />
              Sélectionnez une adresse ci-dessus ou utilisez la géolocalisation
            </div>
          </div>
        )}
      </div>

      {/* Overlay pour fermer les suggestions avec z-index approprié */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-[99998]" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};