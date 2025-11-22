import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, Users, Crown, Check } from 'lucide-react';
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
  const [scrollPosition, setScrollPosition] = useState(0);

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

  // Tracking scroll position pour parallax
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPosition(container.scrollLeft);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleVehicleSelect = (id: string) => {
    onVehicleSelect(id);
    triggerHaptic('medium');

    // Confetti sur première sélection
    if (isFirstSelection) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#10b981', '#22c55e', '#86efac']
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

          // Effet parallax subtil basé sur scroll position
          const cardOffset = index * 168; // 160px width + 8px gap
          const distanceFromCenter = Math.abs(scrollPosition - cardOffset);
          const parallaxOpacity = Math.max(0.6, 1 - distanceFromCenter / 500);

          return (
            <motion.button
              key={vehicle.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ 
                opacity: parallaxOpacity, 
                x: 0,
                scale: isSelected ? 1.05 : 1
              }}
              transition={{ 
                delay: index * 0.08,
                scale: { type: "spring", stiffness: 300, damping: 25 }
              }}
              whileHover={{ 
                scale: isSelected ? 1.05 : 1.02,
                backdropFilter: 'blur(8px)'
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVehicleSelect(vehicle.id)}
              className={cn(
                "relative flex-shrink-0 w-40 h-36 p-3 rounded-2xl border-2 transition-all duration-300 snap-start",
                isSelected
                  ? "bg-primary/10 border-primary shadow-glow-green"
                  : "bg-card/50 border-border/50 hover:border-primary/30 hover:shadow-md"
              )}
            >
              {/* Badge recommandé animé */}
              {vehicle.recommended && !isSelected && (
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [-5, 5, -5]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-2 -right-2 z-10"
                >
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] px-1.5 py-0.5 shadow-lg">
                    ⭐ Top
                  </Badge>
                </motion.div>
              )}

              {/* Badge sélectionné */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute -top-2 -right-2 bg-primary text-primary-foreground p-1 rounded-full shadow-lg z-10"
                >
                  <Check className="w-3 h-3" />
                </motion.div>
              )}

              {/* Icône véhicule */}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors mx-auto",
                isSelected 
                  ? "bg-primary/20" 
                  : "bg-muted/30"
              )}>
                <Icon className={cn(
                  "w-5 h-5",
                  isSelected ? "text-primary" : "text-foreground/70"
                )} />
              </div>

              {/* Nom + Temps */}
              <div className="mb-2 text-center">
                <h3 className={cn(
                  "font-bold text-xs mb-0.5 truncate",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {vehicle.name}
                </h3>
                <p className="text-[9px] text-muted-foreground">
                  {vehicle.time}
                </p>
              </div>

              {/* Prix */}
              <div className="flex flex-col items-center">
                <p className={cn(
                  "text-base font-extrabold",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {vehicle.price.toLocaleString()}
                </p>
                <p className="text-[8px] text-muted-foreground mb-1">{vehicle.pricePerKm}/km</p>

                {/* Compteur chauffeurs */}
                {!loading && driverCount > 0 && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[8px] px-1 py-0",
                      driverCount > 5 
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}
                  >
                    {driverCount} 🚗
                  </Badge>
                )}
              </div>

              {/* Animation pulse si sélectionné */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none"
                  animate={{ 
                    scale: [1, 1.03, 1], 
                    opacity: [0.5, 0, 0.5],
                    borderWidth: [2, 3, 2]
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
