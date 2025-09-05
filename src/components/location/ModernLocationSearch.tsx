/**
 * Interface de recherche d'adresse ultra-moderne pour Congo
 * Design fluide, navigation clavier parfaite, performance optimisée
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Search, 
  Navigation, 
  X, 
  Loader2, 
  Star,
  Clock,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useIntelligentAddressSearch } from '@/hooks/useIntelligentAddressSearch';
import { intelligentToUnified, type UnifiedLocation } from '@/types/locationAdapter';
import { cn } from '@/lib/utils';

interface ModernLocationSearchProps {
  placeholder?: string;
  onLocationSelect: (location: UnifiedLocation) => void;
  value?: string;
  className?: string;
  autoFocus?: boolean;
  showCurrentLocation?: boolean;
  variant?: 'default' | 'compact' | 'elegant' | 'premium';
}

export const ModernLocationSearch: React.FC<ModernLocationSearchProps> = ({
  placeholder = "🔍 Où voulez-vous envoyer votre colis ?",
  onLocationSelect,
  value = '',
  className,
  autoFocus = false,
  showCurrentLocation = true,
  variant = 'premium'
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    results,
    isSearching,
    error,
    recentSearches,
    popularPlaces,
    search,
    addToHistory,
    clearResults
  } = useIntelligentAddressSearch({
    city: 'Kinshasa', // Par défaut, pourrait être dynamique selon le contexte
    maxResults: 6,
    debounceMs: 150,
    autoSearchOnMount: true
  });

  // Icônes contextuelles Congo
  const getLocationIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      'transport': <span className="text-blue-500">🚌</span>,
      'commerce': <span className="text-green-500">🏪</span>,
      'éducation': <span className="text-purple-500">🎓</span>,
      'santé': <span className="text-red-500">🏥</span>,
      'quartier': <span className="text-orange-500">🏘️</span>,
      'current': <Navigation className="h-4 w-4 text-primary" />
    };
    return iconMap[type] || <MapPin className="h-4 w-4 text-muted-foreground" />;
  };

  // Recherche intelligente avec debounce
  const handleSearch = useCallback((query: string) => {
    setInputValue(query);
    
    if (query.trim().length > 0) {
      search(query, { 
        city: 'Kinshasa',
        include_google_fallback: query.length > 2 
      });
      setIsOpen(true);
    } else {
      clearResults();
      setIsOpen(true); // Afficher suggestions populaires
    }
    setSelectedIndex(-1);
  }, [search, clearResults]);

  // Sélection ultra-sécurisée
  const handleLocationSelect = useCallback((result: any) => {
    try {
      if (!result) return;
      
      const unified = intelligentToUnified(result);
      setInputValue(unified.address);
      setIsOpen(false);
      setSelectedIndex(-1);
      setIsInputFocused(false);
      
      addToHistory(result);
      onLocationSelect(unified);
      
      // Animation de feedback
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } catch (error) {
      console.error('Erreur sélection moderne:', error);
    }
  }, [onLocationSelect, addToHistory]);

  // Navigation clavier simplifiée et robuste
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || !allResults.length) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < allResults.length - 1 ? prev + 1 : 0;
          scrollToItem(newIndex);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : allResults.length - 1;
          scrollToItem(newIndex);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          if (selectedIndex === 0 && showCurrentLocation) {
            // Position actuelle
            handleCurrentLocation();
          } else {
            const resultIndex = showCurrentLocation ? selectedIndex - 1 : selectedIndex;
            if (results[resultIndex]) {
              handleLocationSelect(results[resultIndex]);
            }
          }
        } else if (results.length > 0) {
          handleLocationSelect(results[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        if (inputRef.current) inputRef.current.blur();
        break;
    }
  }, [results, selectedIndex, handleLocationSelect, isOpen]);

  // Scroll vers l'élément sélectionné
  const scrollToItem = useCallback((index: number) => {
    if (listRef.current) {
      const item = listRef.current.children[index] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, []);

  // Position actuelle
  const handleCurrentLocation = useCallback(() => {
    // TODO: Implémenter géolocalisation réelle
    const currentLoc = {
      id: 'current-location',
      name: 'Position actuelle',
      lat: -4.3217,
      lng: 15.3069,
      city: 'Kinshasa',
      type: 'current' as const
    };
    handleLocationSelect(currentLoc);
  }, [handleLocationSelect]);

  // Clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsInputFocused(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Sync valeur externe
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue]);

  const allResults = [
    ...(showCurrentLocation ? [{ 
      id: 'current', 
      name: 'Ma position actuelle', 
      type: 'current',
      category: 'current'
    }] : []),
    ...results
  ];

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Input principal */}
      <div className="relative">
        <Card className={cn(
          "overflow-hidden transition-all duration-300 border-2",
          isInputFocused ? "ring-2 ring-primary ring-offset-2 shadow-xl border-primary" : "shadow-md border-border",
          variant === 'premium' && "bg-gradient-to-r from-primary/5 to-accent/5 min-h-[60px]",
          variant === 'elegant' && "bg-gradient-to-r from-background to-muted/30"
        )}>
          <div className="flex items-center space-x-3 p-4">
            <div className="relative flex-1">
              <Search className={cn(
                "absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors",
                isInputFocused ? "text-primary" : "text-muted-foreground"
              )} />
              
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setIsInputFocused(true);
                  setIsOpen(true);
                }}
                onBlur={() => setIsInputFocused(false)}
                placeholder={placeholder}
                className={cn(
                  "pl-12 pr-12 border-0 bg-transparent text-lg py-3 placeholder:text-muted-foreground/70",
                  variant === 'premium' && "text-lg font-medium min-h-[48px]",
                  variant === 'elegant' && "text-base font-medium"
                )}
              />
              
              {/* Indicateurs à droite */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {isSearching && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
                {inputValue && !isSearching && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInputValue('');
                      clearResults();
                      setIsOpen(false);
                    }}
                    className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Bouton position actuelle */}
            {showCurrentLocation && variant !== 'compact' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCurrentLocation}
                className="shrink-0 gap-2"
              >
                <Navigation className="h-4 w-4" />
                {variant === 'elegant' && "Ma position"}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Dropdown résultats avec animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="overflow-hidden shadow-xl border-primary/10">
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 text-sm text-destructive bg-destructive/5 border-b"
                >
                  {error}
                </motion.div>
              )}

              <div ref={listRef} className="max-h-80 overflow-auto">
                {allResults.length > 0 ? (
                  <div className="py-1">
                    {allResults.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => {
                          if (result.type === 'current') {
                            handleCurrentLocation();
                          } else {
                            handleLocationSelect(result);
                          }
                        }}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all duration-150",
                          "hover:bg-accent hover:shadow-sm",
                          selectedIndex === index && "bg-primary/10 border-r-2 border-primary"
                        )}
                      >
                        <div className="flex-shrink-0">
                          {getLocationIcon(result.category || result.type || 'default')}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-sm truncate">
                              {result.name}
                            </p>
                            
                            {/* Badges de qualité */}
                            {result.type === 'current' && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                <Zap className="h-3 w-3 mr-1" />
                                Rapide
                              </Badge>
                            )}
                            
                            {'is_verified' in result && result.is_verified && (
                              <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Vérifié
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {result.type === 'current' 
                              ? "Détecter votre position GPS"
                              : `${'commune' in result ? result.commune + ', ' : ''}${'city' in result ? result.city : 'Kinshasa'}`
                            }
                          </p>
                        </div>

                        {/* Indicateur de popularité */}
                        {'popularity_score' in result && typeof result.popularity_score === 'number' && result.popularity_score > 80 && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : inputValue && !isSearching ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 text-center text-muted-foreground"
                  >
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Aucune adresse trouvée</p>
                    <p className="text-xs mt-1">Essayez un autre terme de recherche</p>
                  </motion.div>
                ) : popularPlaces.length > 0 && !inputValue ? (
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                      Lieux populaires à Kinshasa
                    </div>
                    {popularPlaces.slice(0, 4).map((place, index) => (
                      <motion.div
                        key={place.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleLocationSelect(place)}
                        className="flex items-center space-x-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors"
                      >
                        <span className="text-lg">📍</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{place.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {place.commune}, {place.city}
                          </p>
                        </div>
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      </motion.div>
                    ))}
                  </div>
                ) : null}

                {/* Recherches récentes */}
                {recentSearches.length > 0 && !inputValue && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t bg-muted/10"
                  >
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Récemment recherché</span>
                    </div>
                    {recentSearches.slice(0, 2).map((search, index) => (
                      <div
                        key={`recent-${search.id}`}
                        onClick={() => handleLocationSelect(search)}
                        className="flex items-center space-x-3 px-4 py-2 cursor-pointer hover:bg-accent transition-colors"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{search.name}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};