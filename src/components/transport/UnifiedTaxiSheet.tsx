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
      snapPoints={[0.5, 0.85]}
      activeSnapPoint={0.85}
      fadeFromIndex={1}
      handleOnly={false}
    >
      <DrawerContent className="max-h-[85vh] border-t-4 border-primary/10 shadow-2xl">
        {/* Handle bar */}
        <div className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gradient-to-r from-muted/40 via-muted to-muted/40 rounded-full shadow-sm" />
        </div>

        {/* Contenu scrollable */}
        <ScrollArea 
          className="px-5 font-montserrat"
          style={{ maxHeight: 'calc(85vh - 120px)' }}
        >
          <div className="space-y-4 pb-6">
            {/* Section 1 : Destination (sticky) */}
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

        {/* CTA Sticky en bas */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent border-t border-border/20 shadow-lg">
          <motion.button
            whileHover={{ scale: canBook ? 1.02 : 1 }}
            whileTap={{ scale: canBook ? 0.98 : 1 }}
            onClick={handleBookClick}
            disabled={!canBook}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 relative overflow-hidden shadow-xl",
              canBook
                ? "bg-gradient-to-r from-congo-red to-congo-red-electric shadow-glow-red text-white hover:shadow-2xl"
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
              <motion.div
                animate={canBook ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Continuer</span>
              </motion.div>
            )}
          </motion.button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
