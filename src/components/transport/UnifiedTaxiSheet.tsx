import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, ChevronUp } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import CompactDestinationSearch from './CompactDestinationSearch';
import PremiumVehicleCarousel from './PremiumVehicleCarousel';
import ModernBiddingInterface from './ModernBiddingInterface';
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
  biddingMode?: boolean;
  onBiddingModeChange?: (enabled: boolean) => void;
  clientProposedPrice?: number | null;
  onClientProposedPriceChange?: (price: number | null) => void;
  onMinimize?: () => void;
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
  onClientProposedPriceChange,
  onMinimize
}: UnifiedTaxiSheetProps) {
  const { vehicles, isLoading: vehiclesLoading } = useVehicleTypes({ distance, city });
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

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

  const selectedVehiclePrice = vehicles.find(v => v.id === selectedVehicle)?.calculatedPrice || 0;
  const displayPrice = biddingMode && clientProposedPrice ? clientProposedPrice : selectedVehiclePrice;
  const canBook = !!destination && !!selectedVehicle && !isSearching;

  const handleBookClick = () => {
    if (!canBook) return;
    if ('vibrate' in navigator) navigator.vibrate(20);
    onBook();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsExpanded(false);
      onMinimize?.();
    }
  };

  return (
    <Drawer 
      open={true} 
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <DrawerContent 
        className={cn(
          "flex flex-col border-t-2 border-gray-200 dark:border-slate-700",
          "bg-white dark:bg-slate-900",
          "shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.15)]",
          "rounded-t-[1.5rem]",
          "transition-all duration-200 ease-out"
        )}
        style={{ 
          maxHeight: '50vh',
          paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 12px), 16px)' 
        }}
      >
        {/* Handle bar - Plus visible et tactile */}
        <div className="flex-shrink-0 flex items-center justify-center pt-2 pb-1.5 cursor-grab active:cursor-grabbing">
          <motion.div 
            className="w-12 h-1 bg-muted-foreground/25 rounded-full"
            whileHover={{ scale: 1.1, backgroundColor: 'hsl(var(--muted-foreground) / 0.4)' }}
            whileTap={{ scale: 0.95 }}
          />
        </div>

        {/* Contenu scrollable - plus compact */}
        <motion.div 
          className="flex-1 overflow-y-auto overscroll-contain px-4 space-y-3 pb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Destination */}
          <CompactDestinationSearch
            destination={destination?.address || null}
            onOpenSearch={onDestinationSelect}
            onSelectQuick={onQuickDestinationSelect}
            city={city}
          />

          {/* Véhicules - Animation douce */}
          <AnimatePresence mode="wait">
            {vehiclesLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 overflow-x-hidden"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-shrink-0 w-[5.5rem] h-[7.5rem] bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="vehicles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <PremiumVehicleCarousel
                  vehicles={vehicleOptions}
                  selectedVehicleId={selectedVehicle}
                  onVehicleSelect={onVehicleSelect}
                  city={city}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bidding - Soft transition */}
          <AnimatePresence>
            {destination && selectedVehicle && selectedVehiclePrice > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              >
                <ModernBiddingInterface
                  enabled={biddingMode}
                  onEnabledChange={(checked) => {
                    onBiddingModeChange?.(checked);
                    if (checked && !clientProposedPrice) {
                      onClientProposedPriceChange?.(selectedVehiclePrice);
                    }
                  }}
                  basePrice={selectedVehiclePrice}
                  proposedPrice={clientProposedPrice ?? null}
                  onProposedPriceChange={(price) => onClientProposedPriceChange?.(price)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* CTA Button - Design visible */}
        <div className="flex-shrink-0 bg-white dark:bg-slate-900 pt-2 pb-1 px-4 border-t border-gray-100 dark:border-slate-800">
          <motion.button
            whileHover={canBook ? { scale: 1.01 } : {}}
            whileTap={canBook ? { scale: 0.98 } : {}}
            onClick={handleBookClick}
            disabled={!canBook}
            className={cn(
              "w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200",
              canBook
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 cursor-not-allowed"
            )}
          >
            {isSearching ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recherche...</span>
              </div>
            ) : !destination ? (
              <span className="text-muted-foreground">📍 Où allez-vous ?</span>
            ) : !selectedVehicle ? (
              <span>🚗 Sélectionnez un véhicule</span>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Continuer</span>
                {displayPrice > 0 && (
                  <span className="ml-1 px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {displayPrice.toLocaleString()} CDF
                  </span>
                )}
              </div>
            )}
          </motion.button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
