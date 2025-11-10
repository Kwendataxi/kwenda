import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import CompactDestinationSearch from './CompactDestinationSearch';
import VehicleCarousel from './VehicleCarousel';
import BookingOptionsAccordion from './BookingOptionsAccordion';
import TripSummaryCard from './TripSummaryCard';
import { LocationData } from '@/types/location';

interface UnifiedTaxiSheetProps {
  pickup: LocationData | null;
  destination: LocationData | null;
  selectedVehicle: string;
  onVehicleSelect: (id: string) => void;
  onDestinationSelect: () => void;
  onBook: () => void;
  isSearching: boolean;
  distance: number;
  duration: number;
  calculatedPrice: number;
  city: string;
  
  // Options de réservation
  biddingEnabled: boolean;
  onToggleBidding: (enabled: boolean) => void;
  onClientProposedPrice?: (price: number) => void;
  
  isForSomeoneElse: boolean;
  onToggleBeneficiary: (enabled: boolean) => void;
  selectedBeneficiary: any;
  onSelectBeneficiary: (beneficiary: any) => void;
}

export default function UnifiedTaxiSheet({
  pickup,
  destination,
  selectedVehicle,
  onVehicleSelect,
  onDestinationSelect,
  onBook,
  isSearching,
  distance,
  duration,
  calculatedPrice,
  city,
  biddingEnabled,
  onToggleBidding,
  onClientProposedPrice,
  isForSomeoneElse,
  onToggleBeneficiary,
  selectedBeneficiary,
  onSelectBeneficiary
}: UnifiedTaxiSheetProps) {
  const [sheetHeight, setSheetHeight] = useState(420);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Générer les options de véhicules dynamiquement
  const vehicleOptions = [
    {
      id: 'taxi-bus',
      name: 'Taxi-Bus',
      icon: 'Users',
      time: '2-5 min',
      price: distance > 0 ? Math.round(2000 + distance * 300) : 2000,
      pricePerKm: '300 CDF',
      available: true,
      recommended: city === 'Kinshasa'
    },
    {
      id: 'moto',
      name: 'Moto-Taxi',
      icon: 'Bike',
      time: '1-3 min',
      price: distance > 0 ? Math.round(1500 + distance * 250) : 1500,
      pricePerKm: '250 CDF',
      available: true
    },
    {
      id: 'vtc',
      name: 'VTC Privé',
      icon: 'Car',
      time: '3-7 min',
      price: distance > 0 ? Math.round(3000 + distance * 500) : 3000,
      pricePerKm: '500 CDF',
      available: true,
      recommended: distance > 5
    },
  ];

  const canBook = !!destination && !!selectedVehicle && !isSearching;
  const estimatedSavings = biddingEnabled ? Math.floor(calculatedPrice * 0.3) : 0;

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
      snapPoints={[0.35, 0.85, 0.95]}
      activeSnapPoint={0.85}
      fadeFromIndex={2}
      handleOnly={false}
    >
      <DrawerContent className="max-h-[85vh] border-t-4 border-muted/20">
        {/* Handle bar */}
        <div className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gradient-to-r from-muted/40 via-muted to-muted/40 rounded-full shadow-sm" />
        </div>

        {/* Contenu scrollable */}
        <ScrollArea 
          className="px-4 font-montserrat"
          style={{ maxHeight: 'calc(85vh - 120px)' }}
        >
          <div className="space-y-4 pb-6">
            {/* Section 1 : Destination (sticky) */}
            <CompactDestinationSearch
              destination={destination?.address || null}
              onOpenSearch={onDestinationSelect}
            />

            {/* Section 2 : Carousel de véhicules */}
            <VehicleCarousel
              vehicles={vehicleOptions}
              selectedVehicleId={selectedVehicle}
              onVehicleSelect={onVehicleSelect}
            />

            {/* Section 3 : Résumé du trajet (si destination sélectionnée) */}
            <AnimatePresence>
              {destination && distance > 0 && (
                <TripSummaryCard
                  pickup={pickup!}
                  destination={destination}
                  distance={distance}
                  duration={duration}
                  price={calculatedPrice}
                  biddingEnabled={biddingEnabled}
                  estimatedSavings={estimatedSavings}
                />
              )}
            </AnimatePresence>

            {/* Section 4 : Options expandables (uniquement si destination) */}
            <AnimatePresence>
              {destination && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <BookingOptionsAccordion
                    biddingEnabled={biddingEnabled}
                    onToggleBidding={onToggleBidding}
                    onClientProposedPrice={onClientProposedPrice}
                    calculatedPrice={calculatedPrice}
                    isForSomeoneElse={isForSomeoneElse}
                    onToggleBeneficiary={onToggleBeneficiary}
                    selectedBeneficiary={selectedBeneficiary}
                    onSelectBeneficiary={onSelectBeneficiary}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* CTA Sticky en bas */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent border-t border-border/50">
          <motion.button
            whileHover={{ scale: canBook ? 1.02 : 1 }}
            whileTap={{ scale: canBook ? 0.98 : 1 }}
            onClick={handleBookClick}
            disabled={!canBook}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 relative overflow-hidden",
              canBook
                ? "bg-gradient-to-r from-congo-red to-congo-red-electric shadow-glow-red text-white"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isSearching ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Recherche en cours...</span>
              </div>
            ) : !destination ? (
              <div className="flex items-center justify-center gap-2">
                <span>📍</span>
                <span>Sélectionnez une destination</span>
              </div>
            ) : !selectedVehicle ? (
              <div className="flex items-center justify-center gap-2">
                <span>🚗</span>
                <span>Choisissez un véhicule</span>
              </div>
            ) : (
              <motion.div
                animate={canBook ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                <span>Commander maintenant</span>
              </motion.div>
            )}

            {/* Effet de pulse si prêt */}
            {canBook && (
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-2xl"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </motion.button>

          {/* Helper text */}
          {!canBook && !isSearching && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-center text-muted-foreground mt-2"
            >
              {!destination && "Indiquez où vous souhaitez aller"}
              {destination && !selectedVehicle && "Choisissez votre type de véhicule"}
            </motion.p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
