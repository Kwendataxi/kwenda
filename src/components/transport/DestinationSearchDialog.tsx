import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, MapPin, Clock, Star, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { useUserTripHistory } from '@/hooks/useUserTripHistory';
import { cn } from '@/lib/utils';

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
}

export default function DestinationSearchDialog({
  open,
  onOpenChange,
  onSelectDestination,
  currentLocation
}: DestinationSearchDialogProps) {
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
  }, [open, clearPredictions]);

  // Recherche autocomplete
  useEffect(() => {
    if (searchQuery.trim()) {
      search(searchQuery);
    } else {
      clearPredictions();
    }
  }, [searchQuery, search, clearPredictions]);

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

  const showHistory = !searchQuery.trim() && destinations.length > 0;
  const showPredictions = searchQuery.trim() && predictions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-full h-screen sm:h-screen sm:max-w-full border-0 rounded-none">
        <div className="flex flex-col h-full bg-background">
          {/* Header avec recherche */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50 backdrop-blur-sm">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenChange(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Où allez-vous ?"
                className="pl-12 h-12 text-base bg-muted/50 border-border rounded-xl focus:bg-background"
              />
              {autocompleteLoading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
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
                  className="p-4"
                >
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
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
                        className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 rounded-xl transition-colors text-left"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          dest.frequency >= 3 ? "bg-amber-500/10" : "bg-muted"
                        )}>
                          {dest.frequency >= 3 ? (
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {dest.destination}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dest.frequency > 1 ? `${dest.frequency}x` : 'Récent'}
                          </p>
                        </div>
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Suggestions autocomplete */}
              {showPredictions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4"
                >
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
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
                        className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 rounded-xl transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {prediction.structuredFormatting.mainText}
                          </p>
                          {prediction.structuredFormatting.secondaryText && (
                            <p className="text-xs text-muted-foreground truncate">
                              {prediction.structuredFormatting.secondaryText}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* État vide */}
              {!showHistory && !showPredictions && !autocompleteLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-64 text-center px-4"
                >
                  <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Aucun résultat trouvé' : 'Commencez à taper pour rechercher'}
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
