import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Bike, Car, CarFront, Crown } from 'lucide-react';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap = {
  Bike: Bike,
  Car: Car,
  CarFront: CarFront,
  Crown: Crown
};

interface VehicleTypeSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
  city?: string;
}

export default function VehicleTypeSelector({ selected, onSelect, city = 'Kinshasa' }: VehicleTypeSelectorProps) {
  const { vehicles, isLoading } = useVehicleTypes({ distance: 0, city });

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="flex-shrink-0 w-24 h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
      {vehicles.map((vehicle) => {
        const IconComponent = iconMap[vehicle.icon as keyof typeof iconMap] || Car;
        const isSelected = selected === vehicle.id;
        
        return (
          <motion.button
            key={vehicle.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(vehicle.id)}
            className={`
              relative flex-shrink-0 w-24 p-3 rounded-2xl border-2 transition-all
              ${isSelected 
                ? 'bg-primary/10 border-primary shadow-md' 
                : 'bg-card border-border'
              }
            `}
          >
            {vehicle.isPopular && (
              <Badge className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 shadow-md">
                New
              </Badge>
            )}
            
            <div className="flex items-center justify-center mb-2">
              <IconComponent className={`w-8 h-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            
            <p className={`text-xs font-semibold text-center ${isSelected ? 'text-primary' : 'text-foreground'}`}>
              {vehicle.name}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
