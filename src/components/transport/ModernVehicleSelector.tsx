import { motion } from 'framer-motion';
import { Car, Bike, Bus, Truck, Clock, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VehicleType } from '@/types/vehicle';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { Skeleton } from '@/components/ui/skeleton';

interface ModernVehicleSelectorProps {
  distance: number;
  onVehicleSelect: (vehicle: VehicleType) => void;
  selectedVehicleId?: string;
  city?: string;
}

const getIconComponent = (iconName: string) => {
  const icons = { Car, Bike, Bus, Truck };
  return icons[iconName as keyof typeof icons] || Car;
};

export const ModernVehicleSelector = ({
  distance,
  onVehicleSelect,
  selectedVehicleId,
  city = 'Kinshasa'
}: ModernVehicleSelectorProps) => {
  const { vehicles, isLoading } = useVehicleTypes({ distance, city });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="flex-shrink-0 w-32 h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!vehicles.length) {
    return (
      <div className="p-8 text-center bg-muted/30 rounded-2xl">
        <p className="text-sm text-muted-foreground">
          Aucun véhicule disponible pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-foreground">
          Choisir votre véhicule
        </h3>
        {distance > 0 && (
          <span className="text-sm text-muted-foreground">
            {distance.toFixed(1)} km
          </span>
        )}
      </div>

      {/* Horizontal Scroll Cards */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-3 px-1">
            {vehicles.map((vehicle) => {
              const isSelected = selectedVehicleId === vehicle.id;
              const Icon = getIconComponent(vehicle.icon);

              return (
                <motion.div
                  key={vehicle.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onVehicleSelect(vehicle)}
                  className={cn(
                    "relative flex-shrink-0 w-32 p-4 rounded-2xl cursor-pointer",
                    "transition-all duration-300 border-2",
                    "bg-gradient-to-br shadow-lg hover:shadow-xl",
                    isSelected
                      ? `border-primary ${vehicle.gradient} shadow-primary/20`
                      : `border-border/50 from-card via-card to-muted/20 hover:border-primary/30`
                  )}
                  role="button"
                  aria-pressed={isSelected}
                  tabIndex={0}
                >
                  {/* Popular Badge */}
                  {vehicle.isPopular && !isSelected && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      <span>Populaire</span>
                    </div>
                  )}

                  {/* Selected Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center shadow-lg"
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}

                  {/* Icon with pulse animation */}
                  <motion.div
                    animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={cn(
                      "w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center",
                      isSelected ? "bg-background/20" : "bg-muted/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-7 h-7",
                        isSelected ? "text-background" : "text-foreground"
                      )}
                    />
                  </motion.div>

                  {/* Vehicle Name */}
                  <h4
                    className={cn(
                      "text-sm font-bold text-center mb-1",
                      isSelected ? "text-background" : "text-foreground"
                    )}
                  >
                    {vehicle.name}
                  </h4>

                  {/* Description */}
                  <p
                    className={cn(
                      "text-[10px] text-center mb-3 leading-tight",
                      isSelected ? "text-background/80" : "text-muted-foreground"
                    )}
                  >
                    {vehicle.description}
                  </p>

                  {/* Price Badge */}
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-full text-center mb-2",
                      isSelected
                        ? "bg-background/20 backdrop-blur"
                        : "bg-primary/10"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-bold",
                        isSelected ? "text-background" : "text-primary"
                      )}
                    >
                      {vehicle.calculatedPrice.toLocaleString()} FC
                    </span>
                  </div>

                  {/* ETA */}
                  <div
                    className={cn(
                      "flex items-center justify-center gap-1 text-[10px]",
                      isSelected ? "text-background/90" : "text-muted-foreground"
                    )}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="font-medium">~{vehicle.eta} min</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Scroll Fade Indicator */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none" />
      </div>

      {/* Selected Vehicle Details */}
      {selectedVehicleId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-xl p-4 border border-border"
        >
          {(() => {
            const selected = vehicles.find(v => v.id === selectedVehicleId);
            if (!selected) return null;

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getIconComponent(selected.icon);
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                    <span className="font-semibold text-foreground">
                      {selected.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {selected.calculatedPrice.toLocaleString()} FC
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selected.basePrice.toLocaleString()} + {selected.pricePerKm}/km
                    </p>
                  </div>
                </div>

                {selected.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selected.features.slice(0, 3).map((feature, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Info Tip */}
      <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
        <p className="text-xs text-muted-foreground">
          💡 <span className="font-semibold">Astuce :</span> Les prix peuvent
          varier selon la demande
        </p>
      </div>
    </div>
  );
};
