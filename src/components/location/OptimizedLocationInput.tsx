/**
 * Composant de saisie de localisation optimisé pour la livraison
 * Interface stabilisée, performante et focalisée sur l'UX mobile
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Search, MapPin, Loader2, Navigation2, X, Clock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIntelligentAddressSearch } from '@/hooks/useIntelligentAddressSearch';
import { useUnifiedLocation } from '@/hooks/useUnifiedLocation';
import { cn } from '@/lib/utils';
import type { IntelligentSearchResult } from '@/services/IntelligentAddressSearch';

interface OptimizedLocationInputProps {
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  showCurrentLocation?: boolean;
  context?: 'pickup' | 'delivery' | 'general';
  autoFocus?: boolean;
  className?: string;
}

export const OptimizedLocationInput: React.FC<OptimizedLocationInputProps> = ({
  placeholder = "Rechercher une adresse...",
  value = '',
  onLocationSelect,
  showCurrentLocation = true,
  context = 'general',
  autoFocus = false,
  className
}) => {
  // États optimisés avec useCallback pour éviter les re-renders
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Refs stables
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Hooks optimisés
  const {
    location: currentLocation,
    getCurrentPosition,
    loading: locationLoading
  } = useUnifiedLocation();

  const {
    results,
    isSearching,
    popularPlaces,
    recentSearches,
    search
  } = useIntelligentAddressSearch({
    city: 'Kinshasa',
    maxResults: 6,
    autoSearchOnMount: true
  });

  // Configuration contextuelle stabilisée
  const contextConfig = useMemo(() => ({
    pickup: { 
      placeholder: "Adresse de collecte",
      icon: MapPin,
      priority: 'precision'
    },
    delivery: { 
      placeholder: "Adresse de livraison", 
      icon: Navigation2,
      priority: 'popular'
    },
    general: { 
      placeholder: "Rechercher une adresse", 
      icon: Search,
      priority: 'balanced'
    }
  }), []);

  const config = contextConfig[context];
  const effectivePlaceholder = placeholder || config.placeholder;

  // Effet pour auto-focus stabilisé
  useEffect(() => {
    if (autoFocus && inputRef.current && !isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, isOpen]);

  // Synchronisation de la valeur externe
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Gestionnaire de recherche avec debounce optimisé
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        search(searchQuery);
      }, 400); // Debounce plus long pour réduire les requêtes
    } else if (searchQuery.trim().length === 0) {
      // Afficher les lieux populaires par défaut
      search('');
    }
  }, [search]);

  // Gestion de la sélection avec useCallback
  const handleLocationSelect = useCallback((result: IntelligentSearchResult | 'current') => {
    if (result === 'current') {
      // Position actuelle
      getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      }).then(position => {
        setQuery('Position actuelle');
        onLocationSelect({
          address: position.address || 'Position actuelle',
          lat: position.lat,
          lng: position.lng
        });
        setIsOpen(false);
      }).catch(console.error);
      return;
    }

    // Lieu sélectionné
    setQuery(result.name);
    onLocationSelect({
      address: result.name,
      lat: result.lat,
      lng: result.lng
    });
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [getCurrentPosition, onLocationSelect]);

  // Navigation au clavier optimisée
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const allItems = [
      ...(showCurrentLocation && currentLocation ? ['current'] : []),
      ...results,
      ...popularPlaces.slice(0, 3)
    ];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          handleLocationSelect(allItems[selectedIndex] as any);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, results, popularPlaces, selectedIndex, showCurrentLocation, currentLocation, handleLocationSelect]);

  // Fermeture sur clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Icône de catégorie
  const getCategoryIcon = useCallback((category: string) => {
    const icons: Record<string, string> = {
      transport: '🚌',
      commercial: '🏪', 
      education: '🎓',
      health: '🏥',
      government: '🏛️',
      general: '📍'
    };
    return icons[category] || '📍';
  }, []);

  // Affichage des suggestions optimisé
  const renderSuggestions = useMemo(() => {
    if (!isOpen) return null;

    const suggestions = [];
    let currentIndex = 0;

    // Position actuelle
    if (showCurrentLocation && currentLocation) {
      suggestions.push(
        <div
          key="current"
          onClick={() => handleLocationSelect('current')}
          className={cn(
            "flex items-center gap-3 p-3 cursor-pointer transition-colors",
            selectedIndex === currentIndex ? "bg-primary/10" : "hover:bg-gray-50"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Navigation2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Position actuelle</p>
            <p className="text-sm text-gray-600">GPS • Précision optimale</p>
          </div>
          <Badge variant="default" className="text-xs">GPS</Badge>
        </div>
      );
      currentIndex++;
    }

    // Résultats de recherche
    if (results.length > 0) {
      results.forEach((result) => {
        suggestions.push(
          <div
            key={result.id}
            onClick={() => handleLocationSelect(result)}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer transition-colors",
              selectedIndex === currentIndex ? "bg-primary/10" : "hover:bg-gray-50"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
              {getCategoryIcon(result.category)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{result.name}</p>
              {result.subtitle && (
                <p className="text-sm text-gray-600 truncate">{result.subtitle}</p>
              )}
            </div>
            {result.badge && (
              <Badge variant="secondary" className="text-xs">{result.badge}</Badge>
            )}
            {result.popularity_score > 70 && (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            )}
          </div>
        );
        currentIndex++;
      });
    }

    // Lieux populaires si pas de recherche
    else if (query.trim().length === 0 && popularPlaces.length > 0) {
      popularPlaces.slice(0, 3).forEach((place) => {
        suggestions.push(
          <div
            key={place.id}
            onClick={() => handleLocationSelect(place)}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer transition-colors",
              selectedIndex === currentIndex ? "bg-primary/10" : "hover:bg-gray-50"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-sm">
              <Star className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{place.name}</p>
              <p className="text-sm text-gray-600 truncate">Lieu populaire</p>
            </div>
            <Badge variant="outline" className="text-xs">Populaire</Badge>
          </div>
        );
        currentIndex++;
      });
    }

    return suggestions;
  }, [
    isOpen, 
    showCurrentLocation, 
    currentLocation, 
    results, 
    query, 
    popularPlaces, 
    selectedIndex, 
    handleLocationSelect, 
    getCategoryIcon
  ]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Champ de saisie */}
      <Card className="border-2 border-gray-200 focus-within:border-primary/50 transition-colors">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="p-3">
              <config.icon className="w-5 h-5 text-gray-400" />
            </div>
            
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={effectivePlaceholder}
              className="border-0 focus-visible:ring-0 text-base bg-transparent"
            />
            
            {/* Actions de droite */}
            <div className="flex items-center gap-1 p-2">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    handleSearch('');
                    inputRef.current?.focus();
                  }}
                  className="w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              
              {(isSearching || locationLoading) && (
                <div className="w-8 h-8 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dropdown de suggestions */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-hidden border-2 border-gray-200 shadow-lg">
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-gray-600">Recherche en cours...</p>
              </div>
            ) : renderSuggestions && renderSuggestions.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {renderSuggestions}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Aucun résultat pour "{query}"
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Essayez un quartier ou lieu connu
                </p>
              </div>
            ) : (
              <div className="p-4 text-center">
                <Search className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Commencez à taper pour rechercher
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OptimizedLocationInput;