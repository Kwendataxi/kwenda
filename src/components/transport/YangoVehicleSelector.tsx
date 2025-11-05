import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { VehicleType } from '@/types/vehicle';
import { getYangoTheme } from '@/utils/yangoVehicleThemes';
import { Clock, ArrowRight } from 'lucide-react';
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
    startIndex: 1
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
    <div className="py-6">
      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {vehicles.map((vehicle, index) => {
            const theme = getYangoTheme(vehicle.id);
            const Icon = theme.icon;
            const isSelected = index === selectedIndex;

            return (
              <div
                key={vehicle.id}
                className="flex-[0_0_40%] min-w-0 px-3"
              >
                <motion.div
                  animate={{
                    scale: isSelected ? 1 : 0.88,
                    opacity: isSelected ? 1 : 0.6
                  }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  className="flex flex-col items-center gap-3 relative"
                >
                  {/* Badge Populaire */}
                  {vehicle.isPopular && (
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-900 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg"
                    >
                      ⭐ Populaire
                    </motion.div>
                  )}

                  {/* Circle with Icon */}
                  <motion.div
                    className="relative w-36 h-36 md:w-40 md:h-40 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      background: theme.gradient,
                      boxShadow: isSelected 
                        ? `0 20px 60px ${theme.glowColor}, 0 0 0 3px rgba(255, 255, 255, 0.15), inset 0 2px 20px rgba(255, 255, 255, 0.1)`
                        : `0 8px 24px rgba(0, 0, 0, 0.08)`,
                      backdropFilter: isSelected ? 'blur(8px)' : 'none'
                    }}
                  >
                    {/* Disponibilité indicator */}
                    <motion.div 
                      className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Illustration SVG 2D/3D */}
                    <motion.div
                      className="flex items-center justify-center"
                      whileHover={{ scale: 1.08, y: -2 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={vehicle.id}
                          src={theme.svgIcon}
                          alt={vehicle.name}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.3 }}
                          className="w-20 h-12 md:w-24 md:h-14 object-contain"
                          style={{
                            filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.18))'
                          }}
                        />
                      </AnimatePresence>
                    </motion.div>
                    
                    {/* ETA Badge */}
                    {vehicle.eta && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: isSelected ? 1 : 0.9 }}
                        transition={{ delay: 0.2 }}
                        className="absolute -bottom-2 px-3 py-1.5 bg-background/95 backdrop-blur-sm rounded-full shadow-xl border border-border"
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2} />
                          <span className="text-xs font-semibold">{vehicle.eta} min</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Vehicle Name */}
                  <div className="text-center">
                    <motion.h3 
                      className={`font-bold text-base transition-colors duration-300 ${isSelected ? theme.labelColor : 'text-muted-foreground'}`}
                      animate={{ scale: isSelected ? 1.05 : 1 }}
                    >
                      {vehicle.name}
                    </motion.h3>
                    
                    {/* Price */}
                    {distance > 0 && vehicle.calculatedPrice > 0 ? (
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={vehicle.calculatedPrice}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.3 }}
                          className={`text-sm font-extrabold mt-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                          {vehicle.calculatedPrice.toLocaleString()} CDF
                        </motion.p>
                      </AnimatePresence>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 mt-1 italic">
                        Sélectionnez une destination
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots - Style Yango Pro */}
      <div className="flex justify-center gap-2 mt-8">
        {vehicles.map((vehicle, index) => {
          const theme = getYangoTheme(vehicle.id);
          return (
            <motion.button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              whileTap={{ scale: 0.9 }}
              className={`rounded-full transition-all duration-400`}
              style={{
                width: index === selectedIndex ? '24px' : '8px',
                height: '8px',
                background: index === selectedIndex ? theme.solidColor : 'hsl(var(--muted-foreground) / 0.25)'
              }}
              aria-label={`Sélectionner ${vehicle.name}`}
            />
          );
        })}
      </div>

      {/* Selected Vehicle Info */}
      <AnimatePresence mode="wait">
        {selectedVehicle && distance > 0 && (
          <motion.div
            key={selectedVehicle.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 px-4"
          >
            <div className="bg-muted/30 rounded-2xl p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Prix de base</p>
                  <p className="font-semibold">{selectedVehicle.basePrice.toLocaleString()} CDF</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prix/km</p>
                  <p className="font-semibold">{selectedVehicle.pricePerKm.toLocaleString()} CDF</p>
                </div>
              </div>
              
              {selectedVehicle.description && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {selectedVehicle.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="w-full mt-6 py-4 rounded-2xl text-white font-semibold text-lg shadow-2xl relative overflow-hidden"
            style={{
              background: getYangoTheme(selectedVehicleId).gradient,
              boxShadow: `0 10px 40px ${getYangoTheme(selectedVehicleId).glowColor}, 0 4px 12px rgba(0,0,0,0.15)`
            }}
          >
            {/* Effet de brillance animé */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeInOut"
              }}
            />
            
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
