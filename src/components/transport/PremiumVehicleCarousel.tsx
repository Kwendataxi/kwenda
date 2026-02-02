import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Bike, Users, Crown, Check, Sparkles } from 'lucide-react';
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
  currency?: string; // ✅ ÉTAPE C: Devise dynamique
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

  const handleVehicleSelect = (id: string) => {
    onVehicleSelect(id);
    triggerHaptic('light');
  };

  return (
    <div className="relative -mx-4 px-4">
      {/* Scroll container - Design compact et soft */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-2 pt-1"
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.15 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleVehicleSelect(vehicle.id)}
              className={cn(
                "relative flex-shrink-0 w-[5.5rem] h-[7.5rem] snap-start",
                "p-2.5 rounded-xl transition-all duration-200",
                "flex flex-col items-center justify-between",
                "border shadow-sm",
                isSelected
                  ? "bg-primary/10 dark:bg-primary/20 border-primary shadow-md shadow-primary/20"
                  : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750"
              )}
            >
              {/* Badge Populaire - Discret */}
              {vehicle.recommended && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-emerald-500/90 text-white text-[8px] px-1.5 py-0 font-medium border-0">
                    <Sparkles className="w-2 h-2 mr-0.5" />
                    Top
                  </Badge>
                </div>
              )}

              {/* Checkmark sélectionné */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow z-20"
                  >
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icône - Plus compact */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-primary/15 dark:bg-primary/25" 
                  : "bg-gray-100 dark:bg-slate-700"
              )}>
                <Icon className={cn(
                  "w-4 h-4 transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} strokeWidth={1.5} />
              </div>

              {/* Nom */}
              <p className={cn(
                "font-medium text-[11px] text-center leading-tight transition-colors line-clamp-1",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {vehicle.name}
              </p>

              {/* Temps */}
              <p className="text-[9px] text-muted-foreground">
                {vehicle.time}
              </p>

              {/* Prix avec devise dynamique */}
              <p className={cn(
                "text-sm font-bold leading-none transition-colors",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {vehicle.price.toLocaleString()}
                <span className="text-[8px] font-normal ml-0.5">{vehicle.currency || 'CDF'}</span>
              </p>

              {/* Badge chauffeurs - Minimaliste */}
              {!loading && driverCount > 0 && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-[8px] px-1.5 py-0 font-medium",
                    driverCount > 3 
                      ? "text-emerald-600 border-emerald-200 bg-emerald-50/50"
                      : "text-amber-600 border-amber-200 bg-amber-50/50"
                  )}
                >
                  {driverCount} dispo
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
