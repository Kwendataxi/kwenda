import { motion } from 'framer-motion';
import { Car, Bike, Bus, Truck, Clock, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VehicleType } from '@/types/vehicle';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-muted/30">
            <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
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
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Type de véhicule</h2>
        <p className="text-sm text-muted-foreground">
          Choisissez votre mode de transport
        </p>
      </div>

      {/* Vehicle Cards - Vertical Stack */}
      <div className="space-y-3">
        {vehicles.map((vehicle) => {
          const isSelected = selectedVehicleId === vehicle.id;
          const Icon = getIconComponent(vehicle.icon);

          return (
            <motion.button
              key={vehicle.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onVehicleSelect(vehicle)}
              className={cn(
                "relative w-full p-5 rounded-2xl transition-all duration-300",
                "flex items-center gap-4 text-left",
                "border-2 hover:shadow-xl",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" 
                  : "border-border bg-card/50 hover:border-primary/30"
              )}
            >
              {/* Icon Circle */}
              <div className={cn(
                "flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center",
                `bg-gradient-to-br ${vehicle.gradient}`,
                "shadow-lg transition-transform duration-300",
                isSelected && "scale-110"
              )}>
                <Icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {vehicle.name}
                  </h3>
                  <Badge variant="default" className="text-xs animate-pulse">
                    Actif
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {vehicle.description}
                </p>
              </div>

              {/* Price */}
              <div className="flex-shrink-0 text-right">
                <p className="text-2xl font-bold text-foreground">
                  {vehicle.calculatedPrice.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  CDF
                </p>
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Vehicle Details */}
      {selectedVehicleId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-muted/30 border border-border"
        >
          {(() => {
            const selected = vehicles.find(v => v.id === selectedVehicleId);
            if (!selected) return null;

            return (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground mb-1">
                    ✓ {selected.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Base: {selected.basePrice.toLocaleString()} CDF 
                    + {selected.pricePerKm}/km
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Arrivée estimée : ~{selected.eta} minutes</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* Info Tip */}
      <p className="text-xs text-center text-muted-foreground">
        💡 Les prix peuvent varier selon la demande et les conditions de circulation
      </p>
    </div>
  );
};
