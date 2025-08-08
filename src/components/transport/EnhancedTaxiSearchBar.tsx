import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CountryService } from '@/services/countryConfig';
import { Search, MapPin, Clock, Navigation, Zap, Mic, QrCode, Home, Building2, Plane } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GeocodingService, GeocodeResult } from '@/services/geocoding';
import { usePlaces } from '@/hooks/usePlaces';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/useGeolocation';

interface EnhancedTaxiSearchBarProps {
  onSearch: (query: string, coordinates?: { lat: number; lng: number }) => void;
  onTransportSelect: () => void;
  placeholder?: string;
}

interface SearchShortcut {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  address?: string;
  coordinates?: { lat: number; lng: number };
  action?: () => void;
}

export const EnhancedTaxiSearchBar = ({ 
  onSearch, 
  onTransportSelect, 
  placeholder = "Où allez-vous ?" 
}: EnhancedTaxiSearchBarProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { searchAndSave, recentPlaces, homePlace, workPlace } = usePlaces();
  const { getCurrentPosition } = useGeolocation();
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smart shortcuts based on time and user patterns
  const getSmartShortcuts = (): SearchShortcut[] => {
    const hour = new Date().getHours();
    const baseShortcuts: SearchShortcut[] = [];

    // Home shortcut
    if (homePlace) {
      baseShortcuts.push({
        id: 'home',
        label: 'Domicile',
        icon: Home,
        address: homePlace.address,
        coordinates: homePlace.coordinates,
        action: () => handleShortcutSelect(homePlace.address, homePlace.coordinates)
      });
    }

    // Work shortcut
    if (workPlace) {
      baseShortcuts.push({
        id: 'work',
        label: 'Travail',
        icon: Building2,
        address: workPlace.address,
        coordinates: workPlace.coordinates,
        action: () => handleShortcutSelect(workPlace.address, workPlace.coordinates)
      });
    }

    // Time-based suggestions
    if (hour >= 6 && hour <= 9) {
      // Morning commute
      if (workPlace) {
        baseShortcuts.unshift({
          id: 'morning-work',
          label: 'Aller au travail',
          icon: Building2,
          address: workPlace.address,
          coordinates: workPlace.coordinates,
          action: () => handleShortcutSelect(workPlace.address, workPlace.coordinates)
        });
      }
    } else if (hour >= 17 && hour <= 20) {
      // Evening commute
      if (homePlace) {
        baseShortcuts.unshift({
          id: 'evening-home',
          label: 'Rentrer à la maison',
          icon: Home,
          address: homePlace.address,
          coordinates: homePlace.coordinates,
          action: () => handleShortcutSelect(homePlace.address, homePlace.coordinates)
        });
      }
    }

    // Common destinations dynamiques par pays
    const country = CountryService.getCurrentCountry();
    const mainCity = country.majorCities?.[0];
    if (mainCity) {
      baseShortcuts.push({
        id: 'city-center',
        label: `Centre-ville de ${mainCity.name}`,
        icon: MapPin,
        address: `${mainCity.name}, ${country.name}`,
        coordinates: { lat: mainCity.coordinates.lat, lng: mainCity.coordinates.lng },
        action: () => handleShortcutSelect(`${mainCity.name}, ${country.name}`, { lat: mainCity.coordinates.lat, lng: mainCity.coordinates.lng })
      });
    }

    return baseShortcuts.slice(0, 4); // Limit to 4 shortcuts
  };

  const shortcuts = getSmartShortcuts();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        // Auto-search after voice input
        setTimeout(() => {
          handleSubmit({ preventDefault: () => {} } as React.FormEvent);
        }, 500);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Debounced search with intelligent predictions
  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await GeocodingService.searchPlaces(searchQuery);
      
      // Enhanced results with local context
      const enhancedResults = results.map(result => ({
        ...result,
        relevanceScore: calculateRelevanceScore(result, searchQuery)
      })).sort((a, b) => b.relevanceScore - a.relevanceScore);

      setSuggestions(enhancedResults);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateRelevanceScore = (result: GeocodeResult, query: string): number => {
    let score = 0;
    
    // Boost résultats dans les grandes villes du pays courant
    const country = CountryService.getCurrentCountry();
    const majorCityNames = (country.majorCities || []).map(c => c.name.toLowerCase());
    if (majorCityNames.some(name => result.place_name.toLowerCase().includes(name))) score += 10;
    
    // Boost exact/partial matches
    if (result.place_name.toLowerCase().includes(query.toLowerCase())) score += 5;
    
    return score;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && showSuggestions) {
        searchPlaces(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showSuggestions, searchPlaces]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await handlePlaceSelect(query);
    }
  };

  const handleShortcutSelect = async (placeName: string, coordinates?: { lat: number; lng: number }) => {
    try {
      if (user) {
        await searchAndSave(placeName, coordinates);
      }
      onSearch(placeName, coordinates);
      onTransportSelect();
      setQuery('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Erreur lors de la sélection du raccourci:', error);
      // Continue anyway
      onSearch(placeName, coordinates);
      onTransportSelect();
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const handlePlaceSelect = async (placeName: string, coordinates?: { lat: number; lng: number }) => {
    try {
      if (user) {
        await searchAndSave(placeName, coordinates);
      }
      onSearch(placeName, coordinates);
      onTransportSelect();
      setQuery('');
      setShowSuggestions(false);
    } catch (error) {
      console.error('Erreur lors de la sélection du lieu:', error);
      // Continue anyway
      onSearch(placeName, coordinates);
      onTransportSelect();
      setQuery('');
      setShowSuggestions(false);
    }
  };

  const startVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleCurrentLocation = async () => {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const address = `Ma position actuelle`;
      const coordinates = { lat: position.coords.latitude, lng: position.coords.longitude };
      await handleShortcutSelect(address, coordinates);
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    // Delay hiding to allow clicks on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="space-y-4">
      {/* Search Shortcuts */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {shortcuts.map((shortcut) => (
          <Button
            key={shortcut.id}
            variant="outline"
            size="sm"
            onClick={shortcut.action}
            className="flex items-center gap-2 whitespace-nowrap shrink-0 h-10 px-4 bg-white hover:bg-primary/5 transition-all duration-200"
          >
            <shortcut.icon className="h-4 w-4" />
            {shortcut.label}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
          disabled={loading}
          className="flex items-center gap-2 whitespace-nowrap shrink-0 h-10 px-4 bg-white hover:bg-primary/5"
        >
          <Navigation className="h-4 w-4" />
          Ma position
        </Button>
      </div>

      {/* Enhanced Search Bar */}
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Search className={`h-5 w-5 transition-all duration-200 ${
              focused ? 'text-primary scale-110' : 'text-muted-foreground'
            }`} />
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`pl-12 pr-24 h-14 bg-white border-0 rounded-2xl text-base placeholder:text-muted-foreground 
              transition-all duration-200 ${
                focused 
                  ? 'ring-2 ring-primary/30 shadow-lg' 
                  : 'ring-1 ring-border shadow-sm'
              }`}
          />

          {/* Action Buttons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {/* Voice Search */}
            {recognitionRef.current && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={startVoiceSearch}
                disabled={isListening}
                className={`h-8 w-8 p-0 rounded-full hover:bg-primary/10 ${
                  isListening ? 'bg-primary text-primary-foreground animate-pulse' : ''
                }`}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Shine Effect */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent 
            transition-opacity duration-300 pointer-events-none ${
              focused ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
            }`} />
        </form>

        {/* Enhanced Suggestions Dropdown */}
        {showSuggestions && (query.length > 0 || recentPlaces.length > 0) && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden bg-white shadow-xl border-0">
            <div className="max-h-96 overflow-y-auto">
              {/* Voice Search Status */}
              {isListening && (
                <div className="p-4 bg-primary/5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-primary">
                      Parlez maintenant...
                    </span>
                  </div>
                </div>
              )}

              {/* Recent Places */}
              {query.length === 0 && recentPlaces.length > 0 && (
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Trajets récents
                  </h3>
                  <div className="space-y-1">
                    {recentPlaces.slice(0, 4).map((place) => (
                      <button
                        key={place.id}
                        onClick={() => handlePlaceSelect(place.name, place.coordinates)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{place.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {place.usage_count}x
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Suggestions */}
              {query.length > 0 && (
                <div className="p-4">
                  {loading && (
                    <div className="flex items-center justify-center p-6">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {!loading && suggestions.length > 0 && (
                    <>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Destinations suggérées
                      </h3>
                      <div className="space-y-1">
                        {suggestions.slice(0, 6).map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handlePlaceSelect(suggestion.place_name, {
                              lat: suggestion.center[1],
                              lng: suggestion.center[0]
                            })}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                              <MapPin className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{suggestion.place_name}</p>
                              {suggestion.properties?.category && (
                                <p className="text-sm text-muted-foreground">
                                  {suggestion.properties.category}
                                </p>
                              )}
                            </div>
                            <Zap className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {!loading && suggestions.length === 0 && query.length > 0 && (
                    <div className="text-center p-6">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Aucune destination trouvée</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Essayez avec un autre nom ou quartier
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};