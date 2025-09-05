import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedLocation } from '@/hooks/useUnifiedLocation';
import { intelligentAddressSearch, type IntelligentSearchResult } from '@/services/IntelligentAddressSearch';
import { intelligentToUnified, type UnifiedLocation, type LocationSelectCallback } from '@/types/locationAdapter';

// Interface des props du composant
export interface ImprovedLocationPickerProps {
  onLocationSelect: LocationSelectCallback;
  placeholder?: string;
  showCurrentLocation?: boolean;
  className?: string;
  autoFocus?: boolean;
  type?: 'pickup' | 'destination';
  value?: string;
}

export const ImprovedLocationPicker: React.FC<ImprovedLocationPickerProps> = ({
  onLocationSelect,
  placeholder = "Rechercher une adresse...",
  showCurrentLocation = true,
  className = "",
  autoFocus = false,
  type = 'pickup',
  value = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<IntelligentSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UnifiedLocation | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { getCurrentPosition } = useUnifiedLocation();

  // Initialisation des suggestions populaires au montage
  useEffect(() => {
    const loadPopularPlaces = async () => {
      try {
        const popularPlaces = await intelligentAddressSearch.getPopularPlaces({ city: 'Kinshasa', max_results: 8 });
        setSuggestions(popularPlaces);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erreur chargement lieux populaires:', error);
        setSuggestions(getLocalSuggestions(''));
        setShowSuggestions(true);
      }
    };
    
    loadPopularPlaces();
  }, []);

  // Autofocus conditionnel
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Gestion du clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gestion de la géolocalisation
  const handleCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        fallbackToDefault: true
      });

      const unifiedLocation: UnifiedLocation = {
        address: position.address,
        lat: position.lat,
        lng: position.lng,
        type: position.type,
        placeId: position.placeId,
        name: position.address,
        coordinates: { lat: position.lat, lng: position.lng }
      };

      setSelectedLocation(unifiedLocation);
      setQuery(position.address);
      onLocationSelect(unifiedLocation);
      setShowSuggestions(false);

      toast({
        title: "Position détectée",
        description: "📍 " + position.address,
      });
    } catch (error) {
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible de détecter votre position",
        variant: "destructive"
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Recherche avec debounce
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setShowSuggestions(true);
    
    if (!searchQuery.trim()) {
      try {
        const popularPlaces = await intelligentAddressSearch.getPopularPlaces({ city: 'Kinshasa', max_results: 8 });
        setSuggestions(popularPlaces);
      } catch (error) {
        setSuggestions(getLocalSuggestions(''));
      }
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await intelligentAddressSearch.search(searchQuery, {
          city: 'Kinshasa',
          max_results: 6,
          include_google_fallback: false
        });
        
        // Si pas de résultats de la base, ajouter suggestions locales
        if (results.length === 0) {
          const localSuggestions = getLocalSuggestions(searchQuery);
          setSuggestions(localSuggestions);
        } else {
          setSuggestions(results);
        }
      } catch (error) {
        console.error('Erreur recherche:', error);
        setSuggestions(getLocalSuggestions(searchQuery));
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Suggestions locales de fallback enrichies
  const getLocalSuggestions = (query: string): IntelligentSearchResult[] => {
    const localPlaces = [
      { name: 'Aéroport International Ndjili', lat: -4.3851, lng: 15.4446, commune: 'Ndjili', category: 'transport' },
      { name: 'Centre-ville Gombe', lat: -4.3167, lng: 15.3167, commune: 'Gombe', category: 'center' },
      { name: 'Marché Central', lat: -4.3217, lng: 15.3069, commune: 'Kinshasa', category: 'shopping' },
      { name: 'Université de Kinshasa (UNIKIN)', lat: -4.4333, lng: 15.3000, commune: 'Lemba', category: 'education' },
      { name: 'Stade des Martyrs', lat: -4.3333, lng: 15.3167, commune: 'Lingwala', category: 'sports' },
      { name: 'Grand Marché de Kinshasa', lat: -4.3250, lng: 15.3100, commune: 'Kinshasa', category: 'shopping' },
      { name: 'Hôpital Général de Kinshasa', lat: -4.3200, lng: 15.3150, commune: 'Gombe', category: 'hospital' },
      { name: 'Bandalungwa', lat: -4.3833, lng: 15.3000, commune: 'Bandalungwa', category: 'residential' },
      { name: 'Matete', lat: -4.3833, lng: 15.3333, commune: 'Matete', category: 'residential' },
      { name: 'Ngaliema', lat: -4.3667, lng: 15.2667, commune: 'Ngaliema', category: 'residential' },
      { name: 'Lemba', lat: -4.3833, lng: 15.2833, commune: 'Lemba', category: 'residential' },
      { name: 'Kintambo', lat: -4.3000, lng: 15.2833, commune: 'Kintambo', category: 'residential' },
      { name: 'Kalamu', lat: -4.3500, lng: 15.3000, commune: 'Kalamu', category: 'residential' },
      { name: 'Kasa-Vubu', lat: -4.3600, lng: 15.3100, commune: 'Kasa-Vubu', category: 'residential' }
    ];

    // Si pas de query, retourner les lieux populaires
    if (!query.trim()) {
      return localPlaces.slice(0, 8).map((place, index) => ({
        id: `popular_${index}`,
        name: place.name,
        category: place.category || 'location',
        city: 'Kinshasa',
        commune: place.commune,
        lat: place.lat,
        lng: place.lng,
        hierarchy_level: 3,
        popularity_score: 90 - index * 5,
        relevance_score: 90 - index * 5,
        type: 'popular' as const,
        badge: 'Populaire',
        subtitle: `${place.commune}, Kinshasa`
      }));
    }

    return localPlaces
      .filter(place => 
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        place.commune.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 6)
      .map((place, index) => ({
        id: `local_${index}`,
        name: place.name,
        category: place.category || 'location',
        city: 'Kinshasa',
        commune: place.commune,
        lat: place.lat,
        lng: place.lng,
        hierarchy_level: 2,
        popularity_score: 75 - index * 5,
        relevance_score: 85 - index * 5,
        type: 'popular' as const,
        badge: 'Local',
        subtitle: `${place.commune}, Kinshasa`
      }));
  };

  // Sélection d'un lieu
  const handleLocationSelect = (suggestion: IntelligentSearchResult) => {
    const unifiedLocation = intelligentToUnified(suggestion);
    setSelectedLocation(unifiedLocation);
    setQuery(suggestion.name);
    onLocationSelect(unifiedLocation);
    setShowSuggestions(false);

    toast({
      title: `${type === 'pickup' ? 'Point de collecte' : 'Destination'} sélectionné`,
      description: "📍 " + suggestion.name,
    });
  };

  // Nettoyer la sélection
  const clearSelection = () => {
    setQuery('');
    setSelectedLocation(null);
    setShowSuggestions(true);
    setSuggestions(getLocalSuggestions(''));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input de recherche */}
      <div className="space-y-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value || query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full h-12 pl-10 pr-10 rounded-xl border border-border/20 bg-card/50 backdrop-blur-sm
                      placeholder:text-muted-foreground/60 text-foreground
                      hover:border-primary/30 focus:border-primary/50 focus:outline-none 
                      transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
          />
          
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary/60" />
          
          {(query || value) && (
            <button
              onClick={clearSelection}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-muted/20 
                        rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground/60" />
            </button>
          )}
        </div>

        {/* Bouton position actuelle */}
        {showCurrentLocation && (
          <button
            onClick={handleCurrentLocation}
            disabled={isDetectingLocation}
            className="w-full h-10 flex items-center justify-center gap-2 
                      border border-border/20 rounded-lg bg-card/30 backdrop-blur-sm
                      hover:border-primary/30 hover:bg-primary/5 transition-all duration-300
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDetectingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Navigation className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm text-foreground">
              {isDetectingLocation ? 'Détection...' : 'Ma position actuelle'}
            </span>
          </button>
        )}
      </div>

      {/* Dropdown des suggestions */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md 
                        border border-border/20 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          
          {/* Header avec indicateur de recherche */}
          <div className="p-3 border-b border-border/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isSearching ? 'Recherche...' : suggestions.length === 0 ? 'Aucun résultat' : `${suggestions.length} résultat${suggestions.length > 1 ? 's' : ''}`}
              </span>
            </div>
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>

          {/* Liste des suggestions */}
          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleLocationSelect(suggestion)}
                className="w-full p-3 text-left hover:bg-primary/5 transition-colors
                          border-b border-border/5 last:border-b-0 flex items-start gap-3"
              >
                <MapPin className="h-4 w-4 text-primary/60 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">{suggestion.name}</span>
                    {suggestion.badge && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                        {suggestion.badge}
                      </span>
                    )}
                  </div>
                  {suggestion.subtitle && (
                    <span className="text-sm text-muted-foreground">{suggestion.subtitle}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation de sélection */}
      {selectedLocation && !showSuggestions && (
        <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{selectedLocation.name}</span>
              {selectedLocation.subtitle && (
                <span className="text-xs text-muted-foreground block">{selectedLocation.subtitle}</span>
              )}
            </div>
            <button
              onClick={clearSelection}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};