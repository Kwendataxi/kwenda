import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2, Gavel, ChevronDown, ChevronUp } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import CompactDestinationSearch from './CompactDestinationSearch';
import HorizontalVehicleCarousel from './HorizontalVehicleCarousel';
import { LocationData } from '@/types/location';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';

interface UnifiedTaxiSheetProps {
  pickup: LocationData | null;
  destination: LocationData | null;
  selectedVehicle: string;
  onVehicleSelect: (id: string) => void;
  onDestinationSelect: () => void;
  onQuickDestinationSelect: (location: { address: string; lat: number; lng: number; name: string }) => void;
  onBook: () => void;
  isSearching: boolean;
  distance: number;
  city: string;
  // Nouveaux props pour le bidding
  biddingMode?: boolean;
  onBiddingModeChange?: (enabled: boolean) => void;
  clientProposedPrice?: number | null;
  onClientProposedPriceChange?: (price: number | null) => void;
}

export default function UnifiedTaxiSheet({
  pickup,
  destination,
  selectedVehicle,
  onVehicleSelect,
  onDestinationSelect,
  onQuickDestinationSelect,
  onBook,
  isSearching,
  distance,
  city,
  biddingMode = false,
  onBiddingModeChange,
  clientProposedPrice,
  onClientProposedPriceChange
}: UnifiedTaxiSheetProps) {
  // Charger les véhicules avec prix réels depuis la DB
  const { vehicles, isLoading: vehiclesLoading } = useVehicleTypes({ 
    distance, 
    city 
  });
  
  // État local pour l'expansion de la section bidding
  const [biddingExpanded, setBiddingExpanded] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Mapper les véhicules au format SimpleVehicleGrid
  const vehicleOptions = vehicles.map(v => ({
    id: v.id,
    name: v.name,
    icon: v.icon,
    time: `${v.eta} min`,
    price: v.calculatedPrice,
    pricePerKm: `${v.pricePerKm} CDF`,
    available: v.available,
    recommended: v.isPopular
  }));

  // Trouver le prix du véhicule sélectionné pour l'afficher dans le CTA
  const selectedVehiclePrice = vehicles.find(v => v.id === selectedVehicle)?.calculatedPrice || 0;

  const canBook = !!destination && !!selectedVehicle && !isSearching;

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 50 };
      navigator.vibrate(patterns[type]);
    }
  };

  const handleBookClick = () => {
    if (!canBook) return;
    
    triggerHaptic('heavy');
    onBook();
  };

  return (
    <Drawer 
      open={true} 
      dismissible={false}
      modal={false}
      snapPoints={[0.6, 0.95]}
      activeSnapPoint={0.95}
      fadeFromIndex={1}
      handleOnly={false}
    >
      <DrawerContent 
        className="h-[85vh] max-h-[85vh] flex flex-col border-t-4 border-primary/10 shadow-2xl"
        style={{ 
          paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 16px), 24px)',
          height: 'clamp(75vh, 85vh, 90vh)'
        }}
      >
        {/* Handle bar - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-center py-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gradient-to-r from-muted/40 via-muted to-muted/40 rounded-full shadow-sm" />
        </div>

        {/* Contenu scrollable - Takes remaining space */}
        <ScrollArea className="flex-1 overflow-y-auto px-5 font-montserrat">
          <div className="space-y-4 pb-6">
            {/* Section 1 : Destination */}
            <CompactDestinationSearch
              destination={destination?.address || null}
              onOpenSearch={onDestinationSelect}
              onSelectQuick={onQuickDestinationSelect}
              city={city}
            />

            {/* Section 2 : Carousel de véhicules horizontal */}
            {vehiclesLoading ? (
              <div className="flex gap-3 pb-2 overflow-x-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex-shrink-0 w-40 h-36 bg-muted/20 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
            <HorizontalVehicleCarousel
              vehicles={vehicleOptions}
              selectedVehicleId={selectedVehicle}
              onVehicleSelect={onVehicleSelect}
              city={city}
            />
            )}

            {/* Section 3 : Mode Enchères (Bidding) */}
            {destination && selectedVehicle && selectedVehiclePrice > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 overflow-hidden"
              >
                {/* Header cliquable */}
                <button
                  onClick={() => setBiddingExpanded(!biddingExpanded)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Gavel className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">Mode Enchères</p>
                      <p className="text-xs text-muted-foreground">
                        {biddingMode ? 'Activé - Les chauffeurs peuvent proposer leurs prix' : 'Négociez le prix avec les chauffeurs'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={biddingMode}
                      onCheckedChange={(checked) => {
                        onBiddingModeChange?.(checked);
                        if (checked && !clientProposedPrice) {
                          onClientProposedPriceChange?.(selectedVehiclePrice);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="data-[state=checked]:bg-amber-500"
                    />
                    {biddingExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Contenu expandable */}
                {biddingExpanded && biddingMode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 space-y-4"
                  >
                    <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Votre offre</span>
                        <span className="font-bold text-lg text-amber-600">
                          {(clientProposedPrice || selectedVehiclePrice).toLocaleString()} CDF
                        </span>
                      </div>
                      
                      <Slider
                        value={[clientProposedPrice || selectedVehiclePrice]}
                        onValueChange={([value]) => onClientProposedPriceChange?.(value)}
                        min={Math.round(selectedVehiclePrice * 0.5)}
                        max={Math.round(selectedVehiclePrice * 1.5)}
                        step={500}
                        className="[&_[role=slider]]:bg-amber-500"
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Min: {Math.round(selectedVehiclePrice * 0.5).toLocaleString()} CDF</span>
                        <span className="text-amber-600 font-medium">
                          Kwenda: {selectedVehiclePrice.toLocaleString()} CDF
                        </span>
                        <span>Max: {Math.round(selectedVehiclePrice * 1.5).toLocaleString()} CDF</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      💡 Les chauffeurs à proximité recevront votre demande et pourront proposer leurs prix
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* CTA Button - Always visible */}
        <div className="flex-shrink-0 bg-gradient-to-t from-background via-background/98 to-transparent pt-5 pb-6 px-4 border-t border-border/20 shadow-[0_-8px_16px_rgba(0,0,0,0.08)]">
          <motion.button
            style={{ minHeight: '56px' }}
            whileHover={{ scale: canBook ? 1.02 : 1 }}
            whileTap={{ scale: canBook ? 0.98 : 1 }}
            animate={canBook ? { 
              boxShadow: [
                "0 0 0 0 rgba(220, 38, 38, 0)",
                "0 0 0 8px rgba(220, 38, 38, 0.1)",
                "0 0 0 0 rgba(220, 38, 38, 0)"
              ]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            onClick={handleBookClick}
            disabled={!canBook}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 relative overflow-hidden",
              canBook
                ? "bg-gradient-to-r from-congo-red to-congo-red-electric text-white hover:shadow-2xl"
                : "bg-muted/50 text-muted-foreground cursor-not-allowed"
            )}
          >
            {isSearching ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recherche...</span>
              </div>
            ) : !destination ? (
              <span>📍 Choisissez une destination</span>
            ) : !selectedVehicle ? (
              <span>🚗 Sélectionnez un véhicule</span>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Zap className="w-5 h-5" />
                <span>Continuer</span>
                {selectedVehiclePrice > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-1 px-3 py-1 bg-white/20 rounded-full text-sm font-extrabold"
                  >
                    {selectedVehiclePrice.toLocaleString()} CDF
                  </motion.span>
                )}
              </div>
            )}
          </motion.button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
