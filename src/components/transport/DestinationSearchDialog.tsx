import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Clock, Star, Loader2, ChevronRight, Navigation, Building2, Plane, ShoppingBag, Home, Building } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { useUserTripHistory } from '@/hooks/useUserTripHistory';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Coordonnées par défaut par ville pour fallback
const CITY_DEFAULTS: Record<string, { lat: number; lng: number }> = {
  Kinshasa: { lat: -4.3217, lng: 15.3069 },
  Lubumbashi: { lat: -11.6792, lng: 27.4716 },
  Kolwezi: { lat: -10.7147, lng: 25.4665 },
  Abidjan: { lat: 5.3497, lng: -3.9923 }
};

// Structure complète des lieux populaires par ville
const POPULAR_PLACES_BY_CITY = {
  Kinshasa: [
    { name: 'Aéroport N\'Djili', district: 'Njili', lat: -4.3858, lng: 15.4446, category: 'transport' },
    { name: 'Centre-ville', district: 'Gombe', lat: -4.3276, lng: 15.3136, category: 'business' },
    { name: 'Hôtel Memling', district: 'Gombe', lat: -4.3201, lng: 15.3078, category: 'hotel' },
    { name: 'Marché Central', district: 'Kinshasa', lat: -4.3190, lng: 15.3092, category: 'shopping' },
    { name: 'Matonge', district: 'Kalamu', lat: -4.3310, lng: 15.3210, category: 'culture' },
    { name: 'Stade des Martyrs', district: 'Lingwala', lat: -4.3290, lng: 15.2980, category: 'sport' }
  ],
  Lubumbashi: [
    { name: 'Aéroport La Luano', district: 'Luano', lat: -11.5913, lng: 27.5309, category: 'transport' },
    { name: 'Centre-ville', district: 'Lubumbashi', lat: -11.6792, lng: 27.4716, category: 'business' },
    { name: 'Galerie Uganda', district: 'Lubumbashi', lat: -11.6750, lng: 27.4800, category: 'shopping' },
    { name: 'Stade TP Mazembe', district: 'Kamalondo', lat: -11.6400, lng: 27.4500, category: 'sport' },
    { name: 'Hôtel Karavia', district: 'Lubumbashi', lat: -11.6700, lng: 27.4650, category: 'hotel' },
    { name: 'Marché Kenya', district: 'Kenya', lat: -11.6500, lng: 27.4400, category: 'shopping' }
  ],
  Kolwezi: [
    { name: 'Aéroport de Kolwezi', district: 'Centre', lat: -10.7658, lng: 25.5056, category: 'transport' },
    { name: 'Centre-ville', district: 'Kolwezi', lat: -10.7147, lng: 25.4665, category: 'business' },
    { name: 'Marché Central', district: 'Dilala', lat: -10.7100, lng: 25.4700, category: 'shopping' },
    { name: 'Hôtel Kolwezi', district: 'Centre', lat: -10.7200, lng: 25.4600, category: 'hotel' }
  ],
  Abidjan: [
    { name: 'Aéroport FHB', district: 'Port-Bouët', lat: 5.2539, lng: -3.9263, category: 'transport' },
    { name: 'Plateau', district: 'Centre d\'affaires', lat: 5.3200, lng: -4.0100, category: 'business' },
    { name: 'Cocody', district: 'Cocody', lat: 5.3599, lng: -3.9810, category: 'residential' },
    { name: 'Marché Treichville', district: 'Treichville', lat: 5.2900, lng: -4.0050, category: 'shopping' },
    { name: 'Yopougon', district: 'Yopougon', lat: 5.3400, lng: -4.0850, category: 'residential' },
    { name: 'Hotel Ivoire', district: 'Cocody', lat: 5.3450, lng: -3.9900, category: 'hotel' }
  ]
};

// Helper pour les couleurs par catégorie
const getCategoryStyle = (category: string): string => {
  const styles: Record<string, string> = {
    transport: 'bg-blue-500/10 text-blue-500',
    business: 'bg-violet-500/10 text-violet-500',
    hotel: 'bg-amber-500/10 text-amber-500',
    shopping: 'bg-orange-500/10 text-orange-500',
    culture: 'bg-pink-500/10 text-pink-500',
    sport: 'bg-green-500/10 text-green-500',
    residential: 'bg-slate-500/10 text-slate-500'
  };
  return styles[category] || 'bg-primary/10 text-primary';
};

// Icône selon catégorie
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'transport': return Plane;
    case 'business': return Building2;
    case 'shopping': return ShoppingBag;
    default: return MapPin;
  }
};

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
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [geocodingAddress, setGeocodingAddress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Hook GPS réel
  const { getCurrentPosition } = useSmartGeolocation();
  
  const { destinations, isLoading: historyLoading } = useUserTripHistory();
  const { addresses: savedAddresses } = useSavedAddresses();
  const { predictions, isLoading: autocompleteLoading, search, getPlaceDetails, clearPredictions } = 
    useGooglePlacesAutocomplete({
      location: currentLocation || undefined,
      types: ['establishment', 'geocode'],
      debounceMs: 300
    });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
      clearPredictions();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Géocoder une adresse texte via l'API
  const geocodeAddress = async (addressText: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { query: addressText, region: 'CD' }
      });
      
      if (error || !data?.results?.length) return null;
      
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      };
    } catch {
      return null;
    }
  };

  const handleSelectSavedAddress = async (address: any) => {
    // Vérifier si coordonnées valides existent
    const hasValidCoords = address.coordinates && 
      typeof address.coordinates.lat === 'number' && 
      typeof address.coordinates.lng === 'number' &&
      !isNaN(address.coordinates.lat) && 
      !isNaN(address.coordinates.lng) &&
      address.coordinates.lat !== 0 &&
      address.coordinates.lng !== 0;
    
    if (hasValidCoords) {
      onSelectDestination({
        address: address.address_line,
        lat: address.coordinates.lat,
        lng: address.coordinates.lng,
        name: address.label
      });
      onOpenChange(false);
      return;
    }
    
    // Si pas de coordonnées valides : géocoder l'adresse
    setGeocodingAddress(address.id);
    try {
      const coords = await geocodeAddress(address.address_line);
      if (coords) {
        onSelectDestination({
          address: address.address_line,
          lat: coords.lat,
          lng: coords.lng,
          name: address.label
        });
        onOpenChange(false);
        return;
      }
    } catch (error) {
      console.error('Géocodage échoué:', error);
    } finally {
      setGeocodingAddress(null);
    }
    
    // Fallback : utiliser coordonnées par défaut de la ville
    const cityDefault = CITY_DEFAULTS[address.city || currentCity] || CITY_DEFAULTS.Kinshasa;
    onSelectDestination({
      address: address.address_line,
      lat: cityDefault.lat,
      lng: cityDefault.lng,
      name: address.label
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

  const handleUseCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      // Obtenir la vraie position GPS
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
        fallbackToIP: true
      });
      
      onSelectDestination({
        address: position.address || 'Ma position actuelle',
        lat: position.lat,
        lng: position.lng,
        name: 'Ma position'
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur GPS:', error);
      // Fallback si GPS échoue : utiliser les props existants
      if (currentLocation) {
        onSelectDestination({
          address: 'Ma position actuelle',
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          name: 'Ma position'
        });
        onOpenChange(false);
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  const showHistory = !searchQuery.trim() && destinations.length > 0;
  const showSavedAddresses = !searchQuery.trim() && savedAddresses.length > 0;
  const showPredictions = searchQuery.trim() && predictions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg h-[85vh] max-h-[700px] rounded-t-3xl sm:rounded-3xl overflow-hidden bg-background border-0 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header moderne épuré */}
          <div className="flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/20">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onOpenChange(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <ArrowLeft className="w-[18px] h-[18px] text-foreground/80" />
            </motion.button>
            
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Rechercher à ${currentCity}...`}
                className="pl-10 pr-24 h-10 text-sm bg-muted/30 border-0 rounded-full focus:bg-muted/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/50"
              />
              
              {/* Badge ville minimaliste */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {currentCity}
              </div>
              
              {autocompleteLoading && (
                <Loader2 className="absolute right-24 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary animate-spin" />
              )}
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* Bouton position actuelle - toujours visible */}
              {!searchQuery.trim() && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 active:bg-muted/50 transition-colors border-b border-border/10 disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    {detectingLocation ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">
                      {detectingLocation ? 'Détection en cours...' : 'Ma position actuelle'}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      {detectingLocation ? 'Veuillez patienter' : 'Utiliser la position GPS'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                </motion.button>
              )}

              {/* Mes adresses sauvegardées */}
              {showSavedAddresses && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-4 pt-4"
                >
                  <h4 className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide mb-2 px-1">
                    Mes adresses
                  </h4>
                  <div className="space-y-1">
                    {savedAddresses.slice(0, 3).map((address, index) => (
                      <motion.button
                        key={address.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSelectSavedAddress(address)}
                        disabled={geocodingAddress === address.id}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-all group disabled:opacity-60"
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center",
                          address.address_type === 'business' ? "bg-violet-500/10 text-violet-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                          {geocodingAddress === address.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : address.address_type === 'business' ? (
                            <Building className="w-4 h-4" />
                          ) : (
                            <Home className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {address.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70 truncate">
                            {geocodingAddress === address.id ? 'Localisation...' : address.address_line}
                          </p>
                        </div>
                        {address.is_default && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Destinations récentes */}
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-4 pt-4"
                >
                  <h4 className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide mb-2 px-1">
                    Récents
                  </h4>
                  <div className="space-y-1">
                    {destinations.slice(0, 4).map((dest, index) => (
                      <motion.button
                        key={dest.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSelectHistory(dest)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-all group"
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center",
                          dest.frequency >= 3 ? "bg-amber-500/10 text-amber-500" : "bg-slate-500/10 text-slate-500"
                        )}>
                          {dest.frequency >= 3 ? <Star className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {dest.destination}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70">
                            {dest.frequency > 1 ? `${dest.frequency} trajets` : 'Récent'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Section découverte - Sans historique et sans recherche */}
              {!showHistory && !searchQuery.trim() && !historyLoading && (
                <motion.div
                  key="browse"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Section découverte compacte */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center gap-2 py-5"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-semibold text-foreground flex items-center justify-center gap-1.5">
                        Découvrez {currentCity}
                        <span className="text-base">🌍</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Recherchez ou choisissez ci-dessous
                      </p>
                    </div>
                  </motion.div>

                  {/* Lieux populaires */}
                  <div className="px-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <h4 className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide">
                        Lieux populaires
                      </h4>
                    </div>
                    
                    <div className="space-y-1">
                      {popularPlaces.map((place, index) => {
                        const Icon = getCategoryIcon(place.category);
                        return (
                          <motion.button
                            key={place.name}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + index * 0.03, duration: 0.2 }}
                            onClick={() => handleSelectPopularPlace(place)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-all group"
                          >
                            <div className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                              getCategoryStyle(place.category)
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {place.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground/70 truncate">
                                {place.district}
                              </p>
                            </div>
                            
                            <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggestions autocomplete */}
              {showPredictions && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="px-4 pt-3"
                >
                  <h4 className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide mb-2 px-1">
                    Suggestions
                  </h4>
                  <div className="space-y-1">
                    {predictions.map((prediction, index) => (
                      <motion.button
                        key={prediction.placeId}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSelectPrediction(prediction.placeId, prediction.description)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-all group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Search className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {prediction.structuredFormatting.mainText}
                          </p>
                          {prediction.structuredFormatting.secondaryText && (
                            <p className="text-[11px] text-muted-foreground/70 truncate">
                              {prediction.structuredFormatting.secondaryText}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* État recherche sans résultats */}
              {searchQuery.trim() && !showPredictions && !autocompleteLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-6"
                >
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Search className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground/70 text-center">
                    Aucun résultat pour "{searchQuery}"
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