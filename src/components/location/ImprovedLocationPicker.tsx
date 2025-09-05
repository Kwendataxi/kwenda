import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Navigation, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedLocation } from '@/hooks/useUnifiedLocation';
import { intelligentAddressSearch, type IntelligentSearchResult } from '@/services/IntelligentAddressSearch';
import type { UnifiedLocation, LocationSelectCallback } from '@/types/locationAdapter';

interface ImprovedLocationPickerProps {
  placeholder?: string;
  onLocationSelect: LocationSelectCallback;
  showCurrentLocation?: boolean;
  className?: string;
  autoFocus?: boolean;
  type?: 'pickup' | 'destination';
  value?: string;
}

export const ImprovedLocationPicker: React.FC<ImprovedLocationPickerProps> = ({
  placeholder = "Rechercher une adresse...",
  onLocationSelect,
  showCurrentLocation = true,
  className = "",
  autoFocus = false,
  type = 'pickup',
  value = ""
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<IntelligentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UnifiedLocation | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const { getCurrentPosition } = useUnifiedLocation();

  // Configuration selon le type
  const config = {
    pickup: {
      icon: <MapPin className="w-4 h-4 text-primary" />,
      placeholder: "Point de collecte",
      currentLocationText: "Ma position actuelle",
      detectingText: "Détection..."
    },
    destination: {
      icon: <Navigation className="w-4 h-4 text-destructive" />,
      placeholder: "Point de livraison", 
      currentLocationText: "Livrer ici",
      detectingText: "Localisation..."
    }
  };

  // Auto-focus si demandé
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Fermer les suggestions en cliquant dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Géolocalisation actuelle
  const handleCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const location = await getCurrentPosition();
      if (location) {
        const unifiedLocation: UnifiedLocation = {
          address: location.address,
          lat: location.lat,
          lng: location.lng,
          type: 'current',
          name: 'Ma position actuelle',
          coordinates: { lat: location.lat, lng: location.lng }
        };
        
        setSelectedLocation(unifiedLocation);
        setQuery(location.address);
        setShowSuggestions(false);
        onLocationSelect(unifiedLocation);
        
        toast({
          title: "Position détectée",
          description: `📍 ${location.address}`,
        });
      }
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
    
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setShowSuggestions(true);
    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        // Recherche intelligente
        const results = await intelligentAddressSearch.search(searchQuery, {
          city: 'Kinshasa',
          max_results: 6,
          include_google_fallback: true
        });

        // Ajouter quelques suggestions codées localement si peu de résultats
        const localSuggestions = getLocalSuggestions(searchQuery);
        const allSuggestions = [...results, ...localSuggestions].slice(0, 6);
        
        setSuggestions(allSuggestions);
      } catch (error) {
        console.error('Erreur recherche:', error);
        setSuggestions(getLocalSuggestions(searchQuery));
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  // Suggestions locales de fallback
  const getLocalSuggestions = (query: string): IntelligentSearchResult[] => {
    const localPlaces = [
      { name: 'Gombe, Kinshasa', lat: -4.3167, lng: 15.3167, commune: 'Gombe' },
      { name: 'Lemba, Kinshasa', lat: -4.3833, lng: 15.2833, commune: 'Lemba' },
      { name: 'Matete, Kinshasa', lat: -4.3833, lng: 15.3333, commune: 'Matete' },
      { name: 'Ngaliema, Kinshasa', lat: -4.3667, lng: 15.2667, commune: 'Ngaliema' },
      { name: 'Bandalungwa, Kinshasa', lat: -4.3833, lng: 15.3000, commune: 'Bandalungwa' }
    ];

    return localPlaces
      .filter(place => place.name.toLowerCase().includes(query.toLowerCase()))
      .map((place, index) => ({
        id: `local_${index}`,
        name: place.name,
        category: 'location',
        city: 'Kinshasa',
        commune: place.commune,
        lat: place.lat,
        lng: place.lng,
        hierarchy_level: 2,
        popularity_score: 50,
        relevance_score: 60,
        type: 'popular' as const,
        badge: 'Local',
        subtitle: `${place.commune}, Kinshasa`
      }));
  };

  // Sélection d'une suggestion
  const handleLocationSelect = (suggestion: IntelligentSearchResult) => {
    const unifiedLocation: UnifiedLocation = {
      address: suggestion.name,
      lat: suggestion.lat,
      lng: suggestion.lng,
      type: suggestion.type === 'database' ? 'database' : 'geocoded',
      name: suggestion.name,
      subtitle: suggestion.subtitle,
      coordinates: { lat: suggestion.lat, lng: suggestion.lng }
    };

    setSelectedLocation(unifiedLocation);
    setQuery(suggestion.name);
    setShowSuggestions(false);
    onLocationSelect(unifiedLocation);
  };

  // Effacer la sélection
  const clearSelection = () => {
    setQuery('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input de recherche */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {config[type].icon}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder || config[type].placeholder}
          className="w-full pl-10 pr-10 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        
        {query && (
          <button
            onClick={clearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bouton géolocalisation */}
      {showCurrentLocation && (
        <button
          onClick={handleCurrentLocation}
          disabled={isDetectingLocation}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all disabled:opacity-50"
        >
          <Navigation className={`w-4 h-4 ${isDetectingLocation ? 'animate-pulse' : ''}`} />
          {isDetectingLocation ? config[type].detectingText : config[type].currentLocationText}
        </button>
      )}

      {/* Suggestions */}
      {showSuggestions && (suggestions.length > 0 || isSearching) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isSearching && (
            <div className="p-4 text-center text-muted-foreground">
              <div className="animate-pulse">Recherche en cours...</div>
            </div>
          )}
          
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleLocationSelect(suggestion)}
              className="w-full p-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0 flex items-start gap-3"
            >
              <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {suggestion.name}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {suggestion.subtitle}
                </div>
                {suggestion.badge && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                    {suggestion.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
          
          {!isSearching && suggestions.length === 0 && query && (
            <div className="p-4 text-center text-muted-foreground">
              Aucun résultat trouvé pour "{query}"
            </div>
          )}
        </div>
      )}

      {/* Confirmation de sélection */}
      {selectedLocation && (
        <div className="mt-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="w-4 h-4" />
            <span className="font-medium text-sm">
              {type === 'pickup' ? 'Point de collecte:' : 'Point de livraison:'}
            </span>
          </div>
          <div className="text-sm text-foreground mt-1 truncate">
            {selectedLocation.address}
          </div>
        </div>
      )}
    </div>
  );
};