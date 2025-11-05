import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Clock, Star, Loader2 } from 'lucide-react';
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
                  className="p-6 space-y-8"
                >
                  {/* Animation de localisation avec pin et ondes radar */}
                  <div className="relative w-full max-w-sm mx-auto">
                    <div className="relative h-32 flex items-center justify-center">
                      {/* Pin central moderne avec animation */}
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, 3, -3, 0]
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                        className="relative z-10"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-full flex items-center justify-center shadow-2xl shadow-primary/30">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                      </motion.div>
                      
                      {/* Ondes radar autour du pin */}
                      {[0, 1].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-2 border-primary/20 rounded-full"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ 
                            scale: [0.8, 1.5, 2],
                            opacity: [0.5, 0.2, 0]
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            delay: i * 1.2,
                            ease: 'easeOut'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Message principal engageant contextualisé */}
                  <div className="text-center space-y-2">
                    <motion.h3 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-lg font-bold text-foreground"
                    >
                      Découvrez {currentCity} 🌍
                    </motion.h3>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="hidden sm:block text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed"
                    >
                      {currentCity === 'Kinshasa' && "Recherchez parmi des milliers de destinations dans la capitale"}
                      {currentCity === 'Lubumbashi' && "Explorez la capitale du cuivre avec Kwenda"}
                      {currentCity === 'Kolwezi' && "Découvrez les destinations de la ville minière"}
                      {currentCity === 'Abidjan' && "Naviguez facilement dans la perle des lagunes"}
                      {!['Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'].includes(currentCity || '') && 
                        "Recherchez une destination ou sélectionnez un lieu populaire ci-dessous"}
                    </motion.p>
                  </div>

                  {/* Lieux populaires avec icônes contextuelles */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Lieux populaires
                      </h4>
                      <span className="text-[10px] text-primary font-medium">
                        {currentCity} 📍
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      {popularPlaces.map((place, index) => (
                        <motion.button
                          key={place.name}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.08 }}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectPopularPlace(place)}
                          className="group relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-muted/90 to-muted/40 hover:from-primary/15 hover:to-primary/5 border border-border/50 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent group-hover:from-primary/30 group-hover:via-primary/20 flex items-center justify-center transition-all duration-300 shadow-inner">
                              <MapPin className="w-4.5 h-4.5 text-primary" />
                            </div>
                            
                            <div className="text-left flex-1 min-w-0 space-y-0.5">
                              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                                {place.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-primary/60" />
                                {place.district}
                              </p>
                            </div>
                          </div>
                          
                          {/* Shimmer effect ultra-subtil */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.8, ease: 'easeInOut' }}
                          />
                          
                          {/* Border glow au hover */}
                          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
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
                  <div className="space-y-1">
                    {predictions.map((prediction, index) => (
                      <motion.button
                        key={prediction.placeId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectPrediction(prediction.placeId, prediction.description)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-all text-left group"
                      >
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <MapPin className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {prediction.structuredFormatting.mainText}
                          </p>
                          {prediction.structuredFormatting.secondaryText && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {prediction.structuredFormatting.secondaryText}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* État vide - Animation de recherche moderne */}
              {!showHistory && !showPredictions && !autocompleteLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-64 text-center px-6 space-y-6"
                >
                  {/* Animation de recherche avec loupe */}
                  <div className="relative">
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="w-20 h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full flex items-center justify-center"
                    >
                      <Search className="w-10 h-10 text-primary" />
                    </motion.div>
                    
                    {/* Points animés autour */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                      className="absolute -bottom-2 -left-2 w-3 h-3 bg-primary rounded-full"
                    />
                  </div>

                  {/* Message avec typing effect */}
                  <div className="space-y-2">
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-base font-semibold text-foreground"
                    >
                      {searchQuery ? 'Aucun résultat trouvé 🤔' : 'Où souhaitez-vous aller ?'}
                    </motion.p>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-muted-foreground max-w-xs mx-auto"
                    >
                      {searchQuery 
                        ? 'Essayez de rechercher un autre lieu ou quartier' 
                        : 'Tapez une adresse, un lieu ou un quartier'
                      }
                    </motion.p>
                  </div>

                  {/* Suggestions de recherche rapide */}
                  {!searchQuery && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-wrap gap-2 justify-center max-w-md"
                    >
                      {['Gombe', 'Njili', 'Lemba', 'Bandalungwa'].map((quarter, index) => (
                        <motion.button
                          key={quarter}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSearchQuery(quarter)}
                          className="px-4 py-2 rounded-full bg-muted hover:bg-muted/80 border border-border/50 hover:border-primary/30 text-sm font-medium text-foreground transition-all"
                        >
                          {quarter}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
