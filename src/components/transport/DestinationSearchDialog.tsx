import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Clock, Star, Loader2, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { useUserTripHistory } from '@/hooks/useUserTripHistory';
import { cn } from '@/lib/utils';

// Structure complète des lieux populaires par ville
const POPULAR_PLACES_BY_CITY = {
  Kinshasa: [
    { name: 'Aéroport N\'Djili', district: 'Njili', lat: -4.3858, lng: 15.4446, icon: '✈️', category: 'transport' },
    { name: 'Centre-ville', district: 'Gombe', lat: -4.3276, lng: 15.3136, icon: '🏙️', category: 'business' },
    { name: 'Hôtel Memling', district: 'Gombe', lat: -4.3201, lng: 15.3078, icon: '🏨', category: 'hotel' },
    { name: 'Marché Central', district: 'Kinshasa', lat: -4.3190, lng: 15.3092, icon: '🛒', category: 'shopping' },
    { name: 'Matonge', district: 'Kalamu', lat: -4.3310, lng: 15.3210, icon: '🎭', category: 'culture' },
    { name: 'Stade des Martyrs', district: 'Lingwala', lat: -4.3290, lng: 15.2980, icon: '⚽', category: 'sport' }
  ],
  Lubumbashi: [
    { name: 'Aéroport La Luano', district: 'Luano', lat: -11.5913, lng: 27.5309, icon: '✈️', category: 'transport' },
    { name: 'Centre-ville', district: 'Lubumbashi', lat: -11.6792, lng: 27.4716, icon: '🏙️', category: 'business' },
    { name: 'Galerie Uganda', district: 'Lubumbashi', lat: -11.6750, lng: 27.4800, icon: '🛍️', category: 'shopping' },
    { name: 'Stade TP Mazembe', district: 'Kamalondo', lat: -11.6400, lng: 27.4500, icon: '⚽', category: 'sport' },
    { name: 'Hôtel Karavia', district: 'Lubumbashi', lat: -11.6700, lng: 27.4650, icon: '🏨', category: 'hotel' },
    { name: 'Marché Kenya', district: 'Kenya', lat: -11.6500, lng: 27.4400, icon: '🛒', category: 'shopping' }
  ],
  Kolwezi: [
    { name: 'Aéroport de Kolwezi', district: 'Centre', lat: -10.7658, lng: 25.5056, icon: '✈️', category: 'transport' },
    { name: 'Centre-ville', district: 'Kolwezi', lat: -10.7147, lng: 25.4665, icon: '🏙️', category: 'business' },
    { name: 'Marché Central', district: 'Dilala', lat: -10.7100, lng: 25.4700, icon: '🛒', category: 'shopping' },
    { name: 'Hôtel Kolwezi', district: 'Centre', lat: -10.7200, lng: 25.4600, icon: '🏨', category: 'hotel' }
  ],
  Abidjan: [
    { name: 'Aéroport Félix Houphouët-Boigny', district: 'Port-Bouët', lat: 5.2539, lng: -3.9263, icon: '✈️', category: 'transport' },
    { name: 'Plateau (Centre d\'affaires)', district: 'Plateau', lat: 5.3200, lng: -4.0100, icon: '🏙️', category: 'business' },
    { name: 'Cocody', district: 'Cocody', lat: 5.3599, lng: -3.9810, icon: '🏘️', category: 'residential' },
    { name: 'Marché de Treichville', district: 'Treichville', lat: 5.2900, lng: -4.0050, icon: '🛒', category: 'shopping' },
    { name: 'Yopougon', district: 'Yopougon', lat: 5.3400, lng: -4.0850, icon: '🏘️', category: 'residential' },
    { name: 'Hotel Ivoire', district: 'Cocody', lat: 5.3450, lng: -3.9900, icon: '🏨', category: 'hotel' }
  ]
};

// Helper pour obtenir les lieux de la ville actuelle
const getPopularPlacesForCity = (cityName?: string): typeof POPULAR_PLACES_BY_CITY['Kinshasa'] => {
  if (!cityName) return POPULAR_PLACES_BY_CITY.Kinshasa;
  const city = cityName as keyof typeof POPULAR_PLACES_BY_CITY;
  return POPULAR_PLACES_BY_CITY[city] || POPULAR_PLACES_BY_CITY.Kinshasa;
};

interface DestinationSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDestination: (destination: {
    address: string;
    lat: number;
    lng: number;
    name?: string;
  }) => void;
  currentLocation?: { lat: number; lng: number } | null;
  currentCity?: string;
}

export default function DestinationSearchDialog({
  open,
  onOpenChange,
  onSelectDestination,
  currentLocation,
  currentCity = 'Kinshasa'
}: DestinationSearchDialogProps) {
  const popularPlaces = getPopularPlacesForCity(currentCity);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { destinations, isLoading: historyLoading } = useUserTripHistory();
  const { predictions, isLoading: autocompleteLoading, search, getPlaceDetails, clearPredictions } = 
    useGooglePlacesAutocomplete({
      location: currentLocation || undefined,
      types: ['establishment', 'geocode'],
      debounceMs: 300
    });

  // Focus input quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      clearPredictions();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recherche autocomplete
  useEffect(() => {
    if (searchQuery.trim()) {
      search(searchQuery);
    } else {
      clearPredictions();
    }
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectHistory = (destination: any) => {
    onSelectDestination({
      address: destination.destination,
      lat: destination.destination_coordinates.lat,
      lng: destination.destination_coordinates.lng,
      name: destination.destination
    });
    onOpenChange(false);
  };

  const handleSelectPrediction = async (placeId: string, description: string) => {
    const details = await getPlaceDetails(placeId);
    if (details) {
      onSelectDestination({
        address: details.address,
        lat: details.coordinates.lat,
        lng: details.coordinates.lng,
        name: details.name
      });
      onOpenChange(false);
    }
  };

  const handleSelectPopularPlace = (place: typeof POPULAR_PLACES_BY_CITY['Kinshasa'][0]) => {
    onSelectDestination({
      address: place.name,
      lat: place.lat,
      lng: place.lng,
      name: place.name
    });
    onOpenChange(false);
  };

  const showHistory = !searchQuery.trim() && destinations.length > 0;
  const showPredictions = searchQuery.trim() && predictions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[95vw] sm:max-w-full h-screen border-0 rounded-none sm:rounded-lg">
        <div className="flex flex-col h-full bg-background">
          {/* Header avec recherche - Design moderne Kwenda */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-gradient-to-br from-primary/5 via-background to-background backdrop-blur-sm">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenChange(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/80 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Rechercher à ${currentCity}...`}
                className="pl-11 pr-20 h-11 text-sm sm:text-base bg-muted/50 border-border rounded-xl focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              
              {/* Badge ville actuelle */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {currentCity}
              </div>
              
              {autocompleteLoading && (
                <Loader2 className="absolute right-20 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary animate-spin" />
              )}
              {searchQuery && !autocompleteLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 left-2 text-xs text-muted-foreground flex items-center gap-1"
                >
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                  Recherche en cours...
                </motion.div>
              )}
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Destinations récentes */}
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="p-4"
                >
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2.5 px-1">
                    Destinations récentes
                  </h3>
                  <div className="space-y-1">
                    {destinations.map((dest, index) => (
                      <motion.button
                        key={dest.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectHistory(dest)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-all text-left group"
                      >
                        <motion.div 
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                            dest.frequency >= 3 ? "bg-amber-500/10" : "bg-blue-500/10"
                          )}
                          animate={dest.frequency >= 3 ? { scale: [1, 1.05, 1] } : {}}
                          transition={dest.frequency >= 3 ? { repeat: Infinity, duration: 2 } : {}}
                        >
                          {dest.frequency >= 3 ? (
                            <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
                          ) : (
                            <Clock className="w-4.5 h-4.5 text-blue-500" />
                          )}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                              {dest.destination}
                            </p>
                            {dest.frequency === 1 && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                Nouveau
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {dest.frequency > 1 ? `${dest.frequency} trajets` : 'Récent'}
                          </p>
                        </div>
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message aucun historique - Design moderne avec lieux populaires */}
              {!showHistory && !searchQuery.trim() && !historyLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className="p-4 space-y-4"
                >
                  {/* Animation minimaliste */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-6"
                  >
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                      <MapPin className="w-7 h-7 text-primary" />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-base font-semibold text-foreground">
                        Découvrez {currentCity} 🌍
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recherchez un lieu ou choisissez ci-dessous
                      </p>
                    </div>
                  </motion.div>

                  {/* Liste compacte moderne */}
                  <div className="space-y-1">
                    <div className="px-3 py-1.5 flex items-center justify-between">
                      <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Lieux populaires
                      </h4>
                      <span className="text-[9px] text-primary">{currentCity}</span>
                    </div>
                    
                    <div className="space-y-0.5">
                      {popularPlaces.map((place, index) => (
                        <motion.button
                          key={place.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleSelectPopularPlace(place)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/70 rounded-lg transition-colors text-left group"
                        >
                          {/* Icône minimaliste */}
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                          </div>
                          
                          {/* Texte compact */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {place.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {place.district}
                            </p>
                          </div>
                          
                          {/* Chevron subtil */}
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggestions autocomplete */}
              {showPredictions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="p-4"
                >
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2.5 px-1">
                    Suggestions
                  </h3>
                  <div className="space-y-0.5">
                    {predictions.map((prediction, index) => (
                      <motion.button
                        key={prediction.placeId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSelectPrediction(prediction.placeId, prediction.description)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/70 rounded-lg transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Search className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {prediction.structuredFormatting.mainText}
                          </p>
                          {prediction.structuredFormatting.secondaryText && (
                            <p className="text-xs text-muted-foreground truncate">
                              {prediction.structuredFormatting.secondaryText}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* État vide - Message simple */}
              {!showHistory && !showPredictions && !autocompleteLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-48 px-6 text-center"
                >
                  <Search className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    {searchQuery ? 'Aucun résultat' : 'Recherchez un lieu'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery 
                      ? 'Essayez un autre terme' 
                      : 'Tapez une adresse ou un quartier'
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
