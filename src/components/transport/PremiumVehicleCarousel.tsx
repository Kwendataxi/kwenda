import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Bike, Users, Crown, Check, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDriversCountByVehicle } from '@/hooks/useDriversCountByVehicle';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { getVehicleConfig } from '@/utils/vehicleMapper';

interface VehicleOption {
  id: string;
  name: string;
  icon: any;
  time: string;
  price: number;
  pricePerKm: string;
  available: boolean;
  recommended?: boolean;
}

interface PremiumVehicleCarouselProps {
  vehicles: VehicleOption[];
  selectedVehicleId: string;
  onVehicleSelect: (id: string) => void;
  city: string;
}

const ICON_MAP: Record<string, any> = {
  'Users': Users,
  'Bike': Bike,
  'Car': Car,
  'Crown': Crown
};

export default function PremiumVehicleCarousel({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  city
}: PremiumVehicleCarouselProps) {
  const { counts, loading } = useDriversCountByVehicle(city);
  const { triggerHaptic } = useHapticFeedback();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      setCanScrollLeft(container.scrollLeft > 10);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    container.addEventListener('scroll', checkScroll);
    checkScroll();
    
    return () => container.removeEventListener('scroll', checkScroll);
  }, [vehicles]);

  const handleVehicleSelect = (id: string) => {
    onVehicleSelect(id);
    triggerHaptic('medium');
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = direction === 'left' ? -200 : 200;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    triggerHaptic('light');
  };

  return (
    <div className="relative -mx-4 px-4">
      {/* Gradient fades */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none z-10" />

      {/* Navigation buttons */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex items-center justify-center shadow-lg border border-border/50 hover:scale-110 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex items-center justify-center shadow-lg border border-border/50 hover:scale-110 transition-transform"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-3 pt-1"
        style={{
          overscrollBehaviorX: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {vehicles.map((vehicle, index) => {
          const Icon = ICON_MAP[vehicle.icon] || Car;
          const isSelected = selectedVehicleId === vehicle.id;
          const driverCount = counts[vehicle.id] || 0;
          const config = getVehicleConfig(vehicle.id);

          return (
            <motion.button
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1,
                y: 0,
                scale: isSelected ? 1.03 : 1
              }}
              transition={{ 
                delay: index * 0.05,
                duration: 0.4,
                scale: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileHover={{ scale: isSelected ? 1.03 : 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleVehicleSelect(vehicle.id)}
              className={cn(
                "relative flex-shrink-0 w-[10.5rem] h-[13rem] snap-start",
                "p-5 rounded-[1.75rem] transition-all duration-300",
                "flex flex-col items-center justify-between",
                "border-2 backdrop-blur-sm",
                isSelected
                  ? cn(
                      "bg-white/95 dark:bg-gray-900/95",
                      "border-primary shadow-xl shadow-primary/20",
                      "ring-4 ring-primary/10"
                    )
                  : cn(
                      "bg-white/80 dark:bg-gray-900/80",
                      "border-transparent hover:border-border/60",
                      "hover:shadow-lg hover:bg-white/90 dark:hover:bg-gray-900/90"
                    )
              )}
            >
              {/* Badge Populaire animé */}
              <AnimatePresence>
                {vehicle.recommended && (
                  <motion.div 
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-2 -left-2 z-10"
                  >
                    <Badge className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-[10px] px-2.5 py-1 shadow-lg font-bold flex items-center gap-1 border-0 animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      Top
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Checkmark sélectionné */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg z-20"
                  >
                    <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icône principale avec glow */}
              <div className={cn(
                "relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                isSelected 
                  ? cn(config.iconBgSelected, "shadow-lg") 
                  : config.iconBg
              )}>
                {isSelected && (
                  <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl" />
                )}
                <Icon className={cn(
                  "w-8 h-8 transition-all duration-300 relative z-10",
                  isSelected ? config.textColor : "text-foreground/70"
                )} strokeWidth={1.5} />
              </div>

              {/* Nom du véhicule */}
              <h3 className={cn(
                "font-bold text-[15px] leading-tight text-center transition-colors duration-300",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {vehicle.name}
              </h3>

              {/* Temps estimé */}
              <p className="text-[11px] text-muted-foreground font-medium">
                ⏱️ {vehicle.time}
              </p>

              {/* Prix principal avec effet */}
              <motion.div 
                className="text-center"
                animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <p className={cn(
                  "text-2xl font-black leading-none transition-all duration-300",
                  isSelected 
                    ? "text-primary" 
                    : "text-foreground"
                )}>
                  {vehicle.price.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {vehicle.pricePerKm}/km
                </p>
              </motion.div>

              {/* Badge chauffeurs disponibles */}
              {!loading && driverCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] px-2 py-0.5 font-semibold",
                      driverCount > 5 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-700"
                        : driverCount > 2
                        ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-700"
                        : "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-700"
                    )}
                  >
                    {driverCount} chauffeur{driverCount > 1 ? 's' : ''} 🚗
                  </Badge>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
