import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { VehicleType } from '@/types/vehicle';
import { getYangoTheme } from '@/utils/yangoVehicleThemes';
import { ArrowRight, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface YangoVehicleSelectorProps {
  distance: number;
  selectedVehicleId: string | null;
  onVehicleSelect: (vehicle: VehicleType) => void;
  city?: string;
  calculatingRoute?: boolean;
  onContinue?: () => void;
}

export default function YangoVehicleSelector({
  distance,
  selectedVehicleId,
  onVehicleSelect,
  city = 'Kinshasa',
  calculatingRoute = false,
  onContinue
}: YangoVehicleSelectorProps) {
  const { vehicles, isLoading } = useVehicleTypes({ distance, city });
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    containScroll: 'trimSnaps',
    skipSnaps: false,
    startIndex: 1,
    dragFree: false,
    inViewThreshold: 0.7,
    duration: 25,
    watchDrag: true
  });
  const [selectedIndex, setSelectedIndex] = useState(1);

  // Sync selection with embla
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    if (vehicles[index]) {
      onVehicleSelect(vehicles[index]);
    }
  }, [emblaApi, vehicles, onVehicleSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-select first vehicle when data loads
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId && vehicles[1]) {
      onVehicleSelect(vehicles[1]);
    }
  }, [vehicles, selectedVehicleId, onVehicleSelect]);

  // Keyboard navigation
  useEffect(() => {
    if (!emblaApi) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') emblaApi.scrollPrev();
      if (e.key === 'ArrowRight') emblaApi.scrollNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emblaApi]);

  if (isLoading && vehicles.length === 0) {
    return (
      <div className="py-8 px-4">
        <div className="flex items-center justify-center gap-6 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20" />
              <div className="w-24 h-4 bg-muted rounded-full" />
              <div className="w-16 h-3 bg-muted/50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-muted-foreground text-sm">Aucun véhicule disponible pour le moment</p>
        <p className="text-xs text-muted-foreground/70">Vérifiez votre connexion ou réessayez</p>
      </div>
    );
  }

  const selectedVehicle = vehicles[selectedIndex];

  return (
    <div className="py-3">
      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {vehicles.map((vehicle, index) => {
            const theme = getYangoTheme(vehicle.id);
            const isSelected = index === selectedIndex;

            return (
              <div
                key={vehicle.id}
                className="flex-[0_0_35%] min-w-0 px-2"
              >
                <motion.button
                  onClick={() => {
                    emblaApi?.scrollTo(index);
                    if ('vibrate' in navigator) {
                      navigator.vibrate(12);
                    }
                  }}
                  animate={{
                    scale: isSelected ? 1 : 0.88,
                    opacity: isSelected ? 1 : 0.6
                  }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ 
                    type: "spring",
                    damping: 20,
                    stiffness: 200
                  }}
                  className="flex flex-col items-center gap-3 relative w-full"
                  role="button"
                  aria-label={`Sélectionner ${vehicle.name}`}
                  aria-selected={isSelected}
                >
                  {/* Badge Populaire */}
                  {vehicle.isPopular && (
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-1 -right-1 z-10 bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-900 text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-md"
                    >
                      Populaire
                    </motion.div>
                  )}

                  {/* Circle with Icon */}
                  <motion.div
                    className={`relative w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                      isSelected ? 'ring-4 ring-opacity-25' : ''
                    }`}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      background: theme.gradient,
                      boxShadow: isSelected 
                        ? `0 0 35px ${theme.glowColor}, 0 15px 40px rgba(0, 0, 0, 0.1), inset 0 1px 15px rgba(255, 255, 255, 0.15)`
                        : `0 6px 16px rgba(0, 0, 0, 0.05)`,
                      ['--tw-ring-color' as string]: isSelected ? theme.solidColor : 'transparent'
                    }}
                  >
                    {/* Illustration SVG 2.5D */}
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={vehicle.id}
                        src={theme.svgIcon}
                        alt={vehicle.name}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        whileHover={{ scale: 1.08, y: -2 }}
                        transition={{ duration: 0.3 }}
                        className="w-14 h-8 md:w-16 md:h-10 object-contain"
                        style={{
                          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
                        }}
                      />
                    </AnimatePresence>
                  </motion.div>

                  {/* Vehicle Name */}
                  <div className="text-center">
                    <motion.h3 
                      className={`font-bold text-base transition-colors duration-300 ${isSelected ? theme.labelColor : 'text-muted-foreground'}`}
                      animate={{ scale: isSelected ? 1.05 : 1 }}
                    >
                      {vehicle.name}
                    </motion.h3>
                    
                    {/* ETA uniquement */}
                    {vehicle.eta > 0 && (
                      <motion.p
                        className={`text-xs mt-1 flex items-center gap-1 justify-center ${isSelected ? 'text-foreground/80' : 'text-muted-foreground/60'}`}
                      >
                        <Clock className="w-3 h-3" />
                        {vehicle.eta} min
                      </motion.p>
                    )}
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots - Style Yango Pro */}
      <div className="flex justify-center gap-2 mt-6">
        {vehicles.map((vehicle, index) => {
          const theme = getYangoTheme(vehicle.id);
          return (
            <motion.button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              whileTap={{ scale: 0.9 }}
              className={`rounded-full transition-all duration-400`}
              style={{
                width: index === selectedIndex ? '20px' : '6px',
                height: '6px',
                background: index === selectedIndex ? theme.solidColor : 'hsl(var(--muted-foreground) / 0.25)'
              }}
              aria-label={`Sélectionner ${vehicle.name}`}
            />
          );
        })}
      </div>

      {/* Bouton "Continuer" - Apparaît uniquement quand un véhicule est sélectionné */}
      <AnimatePresence>
        {selectedVehicleId && onContinue && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 200
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              // Haptic feedback
              if ('vibrate' in navigator) {
                navigator.vibrate(15);
              }
              onContinue();
            }}
            className="w-full mt-4 py-3.5 rounded-2xl text-white font-semibold text-lg shadow-xl relative overflow-hidden"
            style={{
              background: getYangoTheme(selectedVehicleId).gradient,
              boxShadow: `0 10px 35px ${getYangoTheme(selectedVehicleId).glowColor}, 0 4px 12px rgba(0,0,0,0.12)`
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Continuer
              <ArrowRight className="w-5 h-5" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
