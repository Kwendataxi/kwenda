import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, Users, Crown, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDriversCountByVehicle } from '@/hooks/useDriversCountByVehicle';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import confetti from 'canvas-confetti';

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

interface HorizontalVehicleCarouselProps {
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

export default function HorizontalVehicleCarousel({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  city
}: HorizontalVehicleCarouselProps) {
  const { counts, loading } = useDriversCountByVehicle(city);
  const { triggerHaptic } = useHapticFeedback();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isFirstSelection, setIsFirstSelection] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Tracking scroll indicators
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

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!scrollContainerRef.current) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({ left: 168, behavior: 'smooth' });
        triggerHaptic('light');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({ left: -168, behavior: 'smooth' });
        triggerHaptic('light');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerHaptic]);

  const handleVehicleSelect = (id: string) => {
    onVehicleSelect(id);
    triggerHaptic('medium');

    // Confetti subtil sur première sélection
    if (isFirstSelection) {
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#10b981', '#22c55e'],
        scalar: 0.8,
        gravity: 1.2
      });
      setIsFirstSelection(false);
    }
  };

  return (
    <div className="relative -mx-4 px-4">
      {/* Gradient fade left */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      
      {/* Gradient fade right */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />

      {/* Scroll indicators */}
      {canScrollLeft && (
        <motion.div 
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20"
          animate={{ x: [-5, 0, -5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <ChevronLeft className="w-5 h-5 text-primary" />
          </div>
        </motion.div>
      )}

      {canScrollRight && (
        <motion.div 
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20"
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <ChevronRight className="w-5 h-5 text-primary" />
          </div>
        </motion.div>
      )}

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-2"
        style={{
          overscrollBehaviorX: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {vehicles.map((vehicle, index) => {
          const Icon = ICON_MAP[vehicle.icon] || Car;
          const isSelected = selectedVehicleId === vehicle.id;
          const driverCount = counts[vehicle.id] || 0;

          return (
            <motion.button
              key={vehicle.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ 
                opacity: 1,
                x: 0,
                scale: isSelected ? 1.05 : 1
              }}
              transition={{ 
                delay: index * 0.08,
                scale: { type: "spring", stiffness: 400, damping: 30 }
              }}
              whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleVehicleSelect(vehicle.id)}
              className={cn(
                "relative flex-shrink-0 w-40 h-40 snap-start",
                "p-4 rounded-2xl border-2 transition-all duration-300",
                "flex flex-col",
                isSelected
                  ? "bg-gradient-to-br from-primary/15 to-primary/5 border-primary shadow-2xl shadow-primary/30 ring-2 ring-primary/50 z-10"
                  : "bg-gradient-to-br from-card to-card/95 border-border/40 hover:border-primary/50 hover:shadow-md hover:backdrop-blur-sm"
              )}
            >
              {/* Badge recommandé */}
              {vehicle.recommended && !isSelected && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-2 py-0.5 shadow-md">
                    ⭐ Top
                  </Badge>
                </div>
              )}

              {/* Badge sélectionné */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-2 right-2 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg z-20"
                >
                  <Check className="w-3 h-3" />
                </motion.div>
              )}

              {/* Contenu de la carte */}
              <div className="flex flex-col h-full justify-between">
                {/* Top section: Icône + Nom + ETA */}
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    isSelected 
                      ? "bg-primary/20" 
                      : "bg-muted/30"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      isSelected ? "text-primary" : "text-foreground/70"
                    )} />
                  </div>

                  <div className="space-y-1 text-center">
                    <h3 className={cn(
                      "font-bold text-sm leading-tight",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {vehicle.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {vehicle.time}
                    </p>
                  </div>
                </div>

                {/* Bottom section: Prix + Badge */}
                <div className="flex flex-col items-center gap-1">
                  <div className="space-y-1 text-center">
                    <p className={cn(
                      "text-xl font-extrabold leading-none",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {vehicle.price.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{vehicle.pricePerKm}/km</p>
                  </div>

                  {!loading && driverCount > 0 && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] px-1.5 py-0.5",
                        driverCount > 5 
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}
                    >
                      {driverCount} 🚗
                    </Badge>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
