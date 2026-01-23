import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Navigation, Clock } from 'lucide-react';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { LocationData } from '@/types/location';
import { motion, AnimatePresence } from 'framer-motion';

interface PickupLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: LocationData | null;
  onSelectLocation: (location: LocationData) => void;
  onUseCurrentPosition: () => void;
}

export default function PickupLocationDialog({
  open,
  onOpenChange,
  currentLocation,
  onSelectLocation,
  onUseCurrentPosition
}: PickupLocationDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<LocationData[]>([]);
  
  const { 
    predictions, 
    isLoading, 
    search, 
    getPlaceDetails, 
    clearPredictions 
  } = useGooglePlacesAutocomplete({
    location: currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined,
    radius: 5000,
    debounceMs: 300
  });

  // Charger les recherches récentes au montage
  useEffect(() => {
    const stored = localStorage.getItem('kwenda_recent_pickups');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch (e) {
        console.error('Error loading recent pickups:', e);
      }
    }
  }, []);

  // Recherche automatique - Sans dépendances functions pour éviter la boucle infinie
  useEffect(() => {
    if (searchQuery.length >= 3) {
      search(searchQuery);
    } else {
      clearPredictions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSelectPrediction = async (prediction: any) => {
    try {
      const details = await getPlaceDetails(prediction.placeId);
      
      if (details) {
        const location: LocationData = {
          address: details.address,
          lat: details.coordinates.lat,
          lng: details.coordinates.lng,
          type: 'manual',
          name: prediction.structuredFormatting.mainText,
          placeId: prediction.placeId
        };

        // Sauvegarder dans les recherches récentes
        const updated = [location, ...recentSearches.filter(r => r.placeId !== prediction.placeId)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('kwenda_recent_pickups', JSON.stringify(updated));

        onSelectLocation(location);
        onOpenChange(false);
      }
    } catch (err) {
      console.error('Error getting place details:', err);
    }
  };

  const handleUseCurrentPosition = () => {
    onUseCurrentPosition();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">Modifier le point de prise en charge</DialogTitle>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="px-6 pt-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une adresse..."
              className="pl-10 pr-10 h-12 text-base"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
            )}
          </div>
        </div>

        {/* Bouton Position Actuelle */}
        <div className="px-6 pt-3">
          <Button
            onClick={handleUseCurrentPosition}
            variant="outline"
            className="w-full h-14 justify-start gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Ma position actuelle</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {currentLocation?.address || 'Utiliser le GPS'}
              </p>
            </div>
          </Button>
        </div>

        {/* Résultats de recherche ou Recherches récentes */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <AnimatePresence mode="wait">
            {searchQuery.length >= 3 && predictions.length > 0 ? (
              <motion.div
                key="predictions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 mt-4"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Résultats
                </p>
                {predictions.map((prediction) => (
                  <motion.button
                    key={prediction.placeId}
                    onClick={() => handleSelectPrediction(prediction)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {prediction.structuredFormatting.mainText}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {prediction.structuredFormatting.secondaryText}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : recentSearches.length > 0 && searchQuery.length < 3 ? (
              <motion.div
                key="recent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2 mt-4"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Récents
                </p>
                {recentSearches.map((recent, index) => (
                  <motion.button
                    key={`${recent.placeId}-${index}`}
                    onClick={() => {
                      onSelectLocation(recent);
                      onOpenChange(false);
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {recent.name || 'Position'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {recent.address}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : searchQuery.length >= 3 && !isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun résultat trouvé</p>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
