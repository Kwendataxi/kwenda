/**
 * Composant de recherche de localisation amélioré avec géolocalisation robuste
 * Intègre les lieux populaires de la base de données intelligent_places
 * Géocodage Google Places API + fallback base de données
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { supabase } from '@/integrations/supabase/client';
import { LocationData } from '@/types/location';
import { 
  Search, 
  MapPin, 
  Navigation2, 
  Clock, 
  Star, 
  Building2,
  Loader2,
  Target,
  Zap
} from 'lucide-react';

interface ImprovedLocationSearchProps {
  placeholder?: string;
  onLocationSelect: (location: LocationData) => void;
  city?: string;
  showCurrentLocation?: boolean;
  className?: string;
}

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'popular' | 'geocoded' | 'current' | 'recent';
  subtitle?: string;
  category?: string;
  popularity_score?: number;
}

const ImprovedLocationSearch = ({ 
  placeholder = "Rechercher une adresse...", 
  onLocationSelect,
  city = 'Kinshasa',
  showCurrentLocation = true,
  className = ""
}: ImprovedLocationSearchProps) => {
  const { toast } = useToast();
  const { getCurrentPosition, loading: locationLoading } = useMasterLocation();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popularPlaces, setPopularPlaces] = useState<PlaceResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<PlaceResult[]>([]);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Charger les lieux populaires au montage
  useEffect(() => {
    loadPopularPlaces();
    loadRecentSearches();
  }, [city]);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query.trim());
      }, 300);
    } else {
      setResults([]);
      if (!isOpen) setIsOpen(true);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Charger les lieux populaires depuis intelligent_places
  const loadPopularPlaces = async () => {
    try {
      const { data, error } = await supabase
        .rpc('intelligent_places_search', {
          search_query: '',
          search_city: city,
          max_results: 6
        });

      if (error) throw error;

      const places: PlaceResult[] = data?.map((place: any) => ({
        id: place.id,
        name: place.name || place.formatted_address,
        address: place.formatted_address || place.name,
        lat: place.latitude,
        lng: place.longitude,
        type: 'popular' as const,
        subtitle: place.subtitle,
        category: place.category,
        popularity_score: place.popularity_score
      })) || [];

      setPopularPlaces(places);
    } catch (error) {
      console.error('Erreur chargement lieux populaires:', error);
      // Fallback avec lieux statiques
      setPopularPlaces([
        {
          id: '1',
          name: 'Centre-ville',
          address: 'Centre-ville, ' + city,
          lat: city === 'Kinshasa' ? -4.3217 : city === 'Lubumbashi' ? -11.6708 : city === 'Kolwezi' ? -10.7158 : 5.3600,
          lng: city === 'Kinshasa' ? 15.3069 : city === 'Lubumbashi' ? 27.4794 : city === 'Kolwezi' ? 25.4664 : -4.0083,
          type: 'popular',
          category: 'Centre'
        }
      ]);
    }
  };

  // Charger les recherches récentes
  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem(`recent_searches_${city}`);
      if (stored) {
        const recent = JSON.parse(stored).slice(0, 3);
        setRecentSearches(recent);
      }
    } catch (error) {
      console.error('Erreur chargement recherches récentes:', error);
    }
  };

  // Sauvegarder une recherche récente
  const saveRecentSearch = (place: PlaceResult) => {
    try {
      const key = `recent_searches_${city}`;
      const stored = localStorage.getItem(key);
      let recent: PlaceResult[] = stored ? JSON.parse(stored) : [];
      
      // Éviter les doublons
      recent = recent.filter(r => r.id !== place.id);
      recent.unshift({ ...place, type: 'recent' });
      recent = recent.slice(0, 5); // Garder seulement 5 éléments
      
      localStorage.setItem(key, JSON.stringify(recent));
      setRecentSearches(recent.slice(0, 3));
    } catch (error) {
      console.error('Erreur sauvegarde recherche récente:', error);
    }
  };

  // Recherche intelligente avec fallbacks
  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    
    try {
      // 1. Recherche dans intelligent_places
      const { data: placesData, error: placesError } = await supabase
        .rpc('intelligent_places_search', {
          search_query: searchQuery,
          search_city: city,
          max_results: 8
        });

      if (!placesError && placesData && placesData.length > 0) {
        const places: PlaceResult[] = placesData.map((place: any) => ({
          id: place.id,
          name: place.name || place.formatted_address,
          address: place.formatted_address || `${place.name}, ${place.commune || city}`,
          lat: place.latitude,
          lng: place.longitude,
          type: 'geocoded' as const,
          subtitle: place.subtitle || place.commune,
          category: place.category,
          popularity_score: place.popularity_score
        }));
        
        setResults(places);
        setIsOpen(true);
        return;
      }

      // 2. Fallback: Géocodage via Edge Function
      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-proxy', {
        body: { 
          query: `${searchQuery}, ${city}`,
          city,
          country: city === 'Abidjan' ? 'Côte d\'Ivoire' : 'République Démocratique du Congo'
        }
      });

      if (!geocodeError && geocodeData?.results?.length > 0) {
        const places: PlaceResult[] = geocodeData.results.slice(0, 5).map((result: any, index: number) => ({
          id: `geocode_${index}`,
          name: result.formatted_address?.split(',')[0] || 'Adresse trouvée',
          address: result.formatted_address || `${searchQuery}, ${city}`,
          lat: result.geometry?.location?.lat || 0,
          lng: result.geometry?.location?.lng || 0,
          type: 'geocoded' as const,
          subtitle: `Google Maps - ${city}`
        }));
        
        setResults(places);
        setIsOpen(true);
        return;
      }

      // 3. Fallback final: Recherche approximative
      setResults([{
        id: 'fallback_1',
        name: searchQuery,
        address: `${searchQuery}, ${city}`,
        lat: city === 'Kinshasa' ? -4.3217 : city === 'Lubumbashi' ? -11.6708 : city === 'Kolwezi' ? -10.7158 : 5.3600,
        lng: city === 'Kinshasa' ? 15.3069 : city === 'Lubumbashi' ? 27.4794 : city === 'Kolwezi' ? 25.4664 : -4.0083,
        type: 'geocoded',
        subtitle: 'Position approximative'
      }]);
      setIsOpen(true);

    } catch (error) {
      console.error('Erreur recherche:', error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher des adresses pour le moment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Géolocalisation actuelle
  const handleCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });

      if (position) {
        const currentPlace: PlaceResult = {
          id: 'current_location',
          name: 'Ma position actuelle',
          address: position.address,
          lat: position.lat,
          lng: position.lng,
          type: 'current'
        };

        handleLocationSelect(currentPlace);
      }
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      toast({
        title: "Géolocalisation indisponible",
        description: "Impossible d'obtenir votre position actuelle",
        variant: "destructive"
      });
    }
  };

  // Sélection d'une localisation
  const handleLocationSelect = (place: PlaceResult) => {
    const locationData: LocationData = {
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      type: place.type,
      placeId: place.id,
      name: place.name,
      subtitle: place.subtitle
    };

    onLocationSelect(locationData);
    setQuery(place.name);
    setIsOpen(false);
    
    // Sauvegarder si ce n'est pas une position actuelle
    if (place.type !== 'current') {
      saveRecentSearch(place);
    }
  };

  // Icône selon le type
  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'popular': return <Star className="h-4 w-4 text-yellow-500" />;
      case 'current': return <Navigation2 className="h-4 w-4 text-blue-500" />;
      case 'recent': return <Clock className="h-4 w-4 text-gray-500" />;
      default: return <MapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  // Badge selon le type
  const getLocationBadge = (type: string) => {
    switch (type) {
      case 'popular': return { text: 'Populaire', className: 'text-yellow-700 bg-yellow-100' };
      case 'current': return { text: 'Ma position', className: 'text-blue-700 bg-blue-100' };
      case 'recent': return { text: 'Récent', className: 'text-gray-700 bg-gray-100' };
      default: return { text: 'Trouvé', className: 'text-green-700 bg-green-100' };
    }
  };

  // Affichage des résultats ou suggestions
  const displayResults = query.trim() ? results : [...popularPlaces, ...recentSearches];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Bouton position actuelle */}
      {showCurrentLocation && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
          disabled={locationLoading}
          className="mt-2 w-full"
        >
          {locationLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Navigation2 className="h-4 w-4 mr-2" />
          )}
          Utiliser ma position actuelle
        </Button>
      )}

      {/* Résultats */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {displayResults.length > 0 ? (
              <div className="space-y-1">
                {!query.trim() && popularPlaces.length > 0 && (
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
                    Lieux populaires à {city}
                  </div>
                )}
                
                {displayResults.map((place) => {
                  const badge = getLocationBadge(place.type);
                  
                  return (
                    <div
                      key={place.id}
                      onClick={() => handleLocationSelect(place)}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="mt-1">
                        {getLocationIcon(place.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{place.name}</p>
                          <Badge variant="secondary" className={`text-xs ${badge.className}`}>
                            {badge.text}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {place.address}
                        </p>
                        {place.category && (
                          <p className="text-xs text-muted-foreground">
                            {place.category}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {!query.trim() && recentSearches.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-t border-b mt-2">
                      Recherches récentes
                    </div>
                    {recentSearches.map((place) => {
                      const badge = getLocationBadge(place.type);
                      
                      return (
                        <div
                          key={place.id}
                          onClick={() => handleLocationSelect(place)}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        >
                          <div className="mt-1">
                            {getLocationIcon(place.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium truncate">{place.name}</p>
                              <Badge variant="secondary" className={`text-xs ${badge.className}`}>
                                {badge.text}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {place.address}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Recherche en cours...</span>
                  </div>
                ) : query.trim() ? (
                  <p className="text-sm">Aucun résultat trouvé pour "{query}"</p>
                ) : (
                  <p className="text-sm">Tapez pour rechercher une adresse</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImprovedLocationSearch;