/**
 * Composant de recherche d'adresse simplifié et optimisé
 * Corrige les problèmes de surcharge visuelle et intègre le multi-ville
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Navigation2, 
  Loader2,
  ChevronRight,
  Clock,
  Building
} from 'lucide-react';
import { useEnhancedIntelligentAddressSearch } from '@/hooks/useEnhancedIntelligentAddressSearch';
import { useToast } from '@/hooks/use-toast';
import type { LocationData } from '@/types/location';

interface SimplifiedLocationSearchProps {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  placeholder?: string;
  city: string; // VILLE DYNAMIQUE
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const SimplifiedLocationSearch = ({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  city,
  label = "Adresse",
  icon = <MapPin className="w-5 h-5" />,
  className = ""
}: SimplifiedLocationSearchProps) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  
  // Hook intelligent avec ville dynamique
  const {
    results,
    recentSearches,
    popularPlaces,
    isSearching,
    currentCity,
    search,
    addToHistory,
    setCity
  } = useEnhancedIntelligentAddressSearch({
    city,
    maxResults: 8,
    debounceMs: 300,
    autoDetectCity: false,
    realtimeSearch: true
  });

  // Synchroniser la ville quand elle change
  useEffect(() => {
    if (city !== currentCity) {
      setCity(city);
    }
  }, [city, currentCity, setCity]);

  // Recherche en temps réel
  useEffect(() => {
    search(query);
  }, [query, search]);

  const handleLocationSelect = (result: any) => {
    console.log('🎯 Location selected in SimplifiedLocationSearch:', result);
    
    try {
      // Validation ultra-stricte pour éviter l'erreur "address required"
      const address = result.address || result.name || result.title || result.subtitle || '';
      const lat = typeof result.lat === 'number' ? result.lat : parseFloat(result.lat || '0');
      const lng = typeof result.lng === 'number' ? result.lng : parseFloat(result.lng || '0');
      
      // Validation de l'adresse
      if (!address || !address.trim()) {
        console.error('❌ Address validation failed:', result);
        toast({
          title: "Adresse manquante",
          description: "Cette location n'a pas d'adresse valide",
          variant: "destructive"
        });
        return;
      }
      
      // Validation des coordonnées
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0 || 
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('❌ Coordinates validation failed:', { lat, lng, result });
        toast({
          title: "Coordonnées invalides",
          description: "Cette location n'a pas de coordonnées géographiques valides",
          variant: "destructive"
        });
        return;
      }
      
      // Création d'un objet LocationData strictement valide
      const locationData: LocationData = {
        address: address.trim(),
        lat,
        lng,
        type: result.type || 'geocoded',
        placeId: result.placeId,
        name: result.name,
        subtitle: result.subtitle
      };
      
      console.log('✅ Valid location data created:', locationData);
      
      // Mise à jour de l'état
      setQuery(locationData.address);
      setShowDropdown(false);
      
      // Appel onChange avec validation
      onChange(locationData);
      addToHistory(result);
      
      // Blur de l'input
      inputRef.current?.blur();
      
      toast({
        title: "📍 Adresse sélectionnée",
        description: locationData.address,
        variant: "default"
      });
      
    } catch (error) {
      console.error('❌ Error in handleLocationSelect:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sélectionner cette adresse",
        variant: "destructive"
      });
    }
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });
      
      const locationData: LocationData = {
        address: 'Ma position actuelle',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        type: 'current'
      };
      
      handleLocationSelect(locationData);
    } catch (error) {
      toast({
        title: "Erreur de géolocalisation",
        description: "Impossible d'obtenir votre position",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'current': return <Navigation2 className="w-4 h-4 text-blue-500" />;
      case 'recent': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'popular': return <Building className="w-4 h-4 text-purple-500" />;
      default: return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* En-tête simple */}
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold text-foreground">
          {label}
        </h3>
        {city && (
          <Badge variant="outline" className="text-xs">
            {city}
          </Badge>
        )}
      </div>

      {/* Bouton position actuelle */}
      <Button
        onClick={handleCurrentLocation}
        disabled={isGettingLocation}
        className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white"
        variant="default"
      >
        {isGettingLocation ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Navigation2 className="w-5 h-5 mr-2" />
        )}
        Utiliser ma position actuelle
      </Button>

      {/* Champ de recherche simplifié */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            className="pl-10 pr-4 h-12 text-base border border-input bg-background rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {/* Dropdown simplifié */}
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <Card className="absolute top-full left-0 right-0 mt-2 bg-background border shadow-lg rounded-lg z-50 max-h-80 overflow-auto">
              <div className="p-4 space-y-2">
                
                {/* Résultats de recherche */}
                {results.length > 0 && (
                  <div className="space-y-1">
                    {results.slice(0, 6).map((result, index) => (
                      <button
                        key={result.id || index}
                        onClick={() => handleLocationSelect(result)}
                        className="w-full p-3 text-left hover:bg-accent rounded-md transition-colors flex items-center gap-3 group"
                      >
                        {getResultIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{result.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {result.subtitle || `${result.commune || ''}, ${result.city || city}`}
                          </div>
                        </div>
                        {result.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {result.badge}
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Recherches récentes */}
                {recentSearches.length > 0 && query.length < 2 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Récent</h4>
                    <div className="space-y-1">
                      {recentSearches.slice(0, 3).map((result, index) => (
                        <button
                          key={result.id || index}
                          onClick={() => handleLocationSelect(result)}
                          className="w-full p-3 text-left hover:bg-accent rounded-md transition-colors flex items-center gap-3"
                        >
                          <Clock className="w-4 h-4 text-orange-500" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{result.name}</div>
                            <div className="text-xs text-muted-foreground">Récent</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aucun résultat */}
                {results.length === 0 && query.length >= 2 && !isSearching && (
                  <div className="p-4 text-center text-muted-foreground">
                    <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun résultat pour "{query}"</p>
                    <p className="text-xs">dans {city}</p>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Adresse sélectionnée */}
      {value && (
        <Card className="p-4 bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-green-800">Adresse confirmée</div>
              <div className="text-sm text-green-700">{value.address}</div>
            </div>
            <Badge className="bg-green-500 text-white">✓</Badge>
          </div>
        </Card>
      )}
    </div>
  );
};