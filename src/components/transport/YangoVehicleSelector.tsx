import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { VehicleType } from '@/types/vehicle';
import { getYangoTheme } from '@/utils/yangoVehicleThemes';
import { Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface YangoVehicleSelectorProps {
  distance: number;
  selectedVehicleId: string | null;
  onVehicleSelect: (vehicle: VehicleType) => void;
  city?: string;
  calculatingRoute?: boolean;
}

export default function YangoVehicleSelector({
  distance,
  selectedVehicleId,
  onVehicleSelect,
  city = 'Kinshasa',
  calculatingRoute = false
}: YangoVehicleSelectorProps) {
  const { vehicles, isLoading } = useVehicleTypes({ distance, city });

  // 🔍 Logs de debug
  console.log('🚗 [YangoVehicleSelector] Rendu:', {
    distance,
    city,
    vehiclesCount: vehicles.length,
    isLoading,
    calculatingRoute,
    selectedVehicleId
  });
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

  if (isLoading || calculatingRoute) {
    return (
      <div className="py-8 px-4">
        <div className="flex items-center justify-center gap-6 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Skeleton className="w-32 h-32 rounded-full" />
              <Skeleton className="w-20 h-4 rounded" />
              <Skeleton className="w-16 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Aucun véhicule disponible</p>
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
                    scale: isSelected ? 1 : 0.85,
                    opacity: isSelected ? 1 : 0.5
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Circle with Icon */}
                  <motion.div
                    className={`relative w-32 h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center ${theme.bgColor} shadow-lg`}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: theme.gradient
                    }}
                  >
                    <Icon className="w-14 h-14 md:w-16 md:h-16 text-white" strokeWidth={1.5} />
                    
                    {/* ETA Badge */}
                    {vehicle.eta && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: isSelected ? 1 : 0.9 }}
                        className="absolute -bottom-2 px-3 py-1 bg-background rounded-full shadow-md border border-border"
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{vehicle.eta} min</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Vehicle Name */}
                  <div className="text-center">
                    <h3 className={`font-semibold text-base ${isSelected ? theme.labelColor : 'text-muted-foreground'}`}>
                      {vehicle.name}
                    </h3>
                    
                    {/* Price */}
                    {distance > 0 && vehicle.calculatedPrice > 0 && (
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={vehicle.calculatedPrice}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className={`text-sm font-bold mt-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                          {vehicle.calculatedPrice.toLocaleString()} CDF
                        </motion.p>
                      </AnimatePresence>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        {vehicles.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === selectedIndex
                ? 'w-6 bg-primary'
                : 'w-1.5 bg-muted-foreground/30'
            }`}
            aria-label={`Go to vehicle ${index + 1}`}
          />
        ))}
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
    </div>
  );
}
