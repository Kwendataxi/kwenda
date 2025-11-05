import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Bike, Bus, Truck, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap = {
  Car,
  Bike,
  Bus,
  Truck,
};

interface ModernVehicleCarouselProps {
  selected: string;
  onSelect: (id: string) => void;
  city?: string;
  distance?: number;
}

export default function ModernVehicleCarousel({
  selected,
  onSelect,
  city = 'Kinshasa',
  distance = 0
}: ModernVehicleCarouselProps) {
  const { vehicles, isLoading } = useVehicleTypes({ distance, city });
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: false,
    skipSnaps: false,
    dragFree: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSlideChange = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    setCanScrollNext(emblaApi.canScrollNext());
    
    // Auto-sélectionner le véhicule au centre
    if (vehicles[index]) {
      onSelect(vehicles[index].id);
    }
  }, [emblaApi, vehicles, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    onSlideChange();
    emblaApi.on('select', onSlideChange);
    emblaApi.on('reInit', onSlideChange);
    
    return () => {
      emblaApi.off('select', onSlideChange);
      emblaApi.off('reInit', onSlideChange);
    };
  }, [emblaApi, onSlideChange]);

  // Navigation vers le véhicule suivant
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Support clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') scrollNext();
      if (e.key === 'ArrowLeft') emblaApi?.scrollPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emblaApi, scrollNext]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-8">
          <h1 className="text-3xl font-bold text-white">
            Choisissez votre type de véhicule
          </h1>
          <Skeleton className="w-[200px] h-[200px] rounded-full mx-auto bg-white/10" />
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white text-lg">Aucun véhicule disponible</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Titre en haut */}
      <div className="absolute top-12 left-0 right-0 text-center z-10">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-white"
        >
          Choisissez votre type de véhicule
        </motion.h1>
      </div>

      {/* Carrousel centré */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={emblaRef} className="overflow-hidden w-full max-w-md">
          <div className="flex">
            {vehicles.map((vehicle, index) => {
              const IconComponent = iconMap[vehicle.icon as keyof typeof iconMap] || Car;
              const isSelected = selected === vehicle.id;
              const isCentered = index === selectedIndex;

              return (
                <div 
                  key={vehicle.id} 
                  className="flex-[0_0_100%] flex flex-col items-center justify-center px-8"
                >
                  {/* Cercle de véhicule */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: isCentered ? 1 : 0.4,
                      scale: isCentered ? 1 : 0.8,
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="relative"
                  >
                    <motion.div
                      animate={isSelected && isCentered ? {
                        scale: [1, 1.03, 1],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className={`
                        relative w-[200px] h-[200px] rounded-full 
                        flex items-center justify-center
                        transition-all duration-300
                      `}
                      style={{
                        background: `linear-gradient(135deg, ${vehicle.gradient.split(' ')[0].replace('from-', '')}, ${vehicle.gradient.split(' ')[2].replace('to-', '')})`,
                        boxShadow: isSelected && isCentered
                          ? '0 0 0 5px #EF4444, 0 20px 60px rgba(239, 68, 68, 0.4)'
                          : '0 10px 40px rgba(0,0,0,0.5)'
                      }}
                    >
                      <IconComponent className="w-20 h-20 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Label */}
                  <AnimatePresence mode="wait">
                    {isCentered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.1 }}
                        className="text-center mt-8 space-y-2"
                      >
                        <p className="text-2xl font-semibold text-white">
                          {vehicle.name}
                        </p>
                        
                        {vehicle.calculatedPrice > 0 && (
                          <p className="text-lg text-gray-400">
                            {formatCurrency(vehicle.calculatedPrice)}
                          </p>
                        )}
                        
                        {vehicle.description && (
                          <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            {vehicle.description}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Flèche de navigation circulaire */}
      {canScrollNext && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={scrollNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/80 rounded-full flex items-center justify-center border border-white/20 hover:bg-black hover:border-white/40 transition-all z-20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Points indicateurs animés */}
      {vehicles.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {vehicles.map((_, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{
                width: index === selectedIndex ? 32 : 8,
                backgroundColor: index === selectedIndex ? '#EF4444' : '#6B7280'
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-2 rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
}
