import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import CompactDestinationSearch from './CompactDestinationSearch';
import SimpleVehicleGrid from './SimpleVehicleGrid';
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
  city
}: UnifiedTaxiSheetProps) {
  // Charger les véhicules avec prix réels depuis la DB
  const { vehicles, isLoading: vehiclesLoading } = useVehicleTypes({ 
    distance, 
    city 
  });

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
        className="h-[90vh] flex flex-col border-t-4 border-primary/10 shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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

            {/* Section 2 : Grid de véhicules 2x2 */}
            {vehiclesLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-muted/20 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
            <SimpleVehicleGrid
              vehicles={vehicleOptions}
              selectedVehicleId={selectedVehicle}
              onVehicleSelect={onVehicleSelect}
              city={city}
            />
            )}
          </div>
        </ScrollArea>

        {/* CTA Button - Always visible */}
        <div className="flex-shrink-0 bg-gradient-to-t from-background via-background/98 to-transparent pt-3 pb-4 px-4 border-t border-border/10">
          <motion.button
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
