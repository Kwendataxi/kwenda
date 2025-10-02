import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Bike, Truck, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleType {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface VehicleTypeSelectorProps {
  serviceCategory: 'taxi' | 'delivery';
  selectedType: string | null;
  onTypeSelect: (type: string) => void;
}

const TAXI_VEHICLES: VehicleType[] = [
  {
    value: 'voiture',
    label: 'Voiture',
    icon: <Car className="w-8 h-8" />,
    description: 'Berline, SUV, etc.'
  },
  {
    value: 'moto',
    label: 'Moto',
    icon: <Bike className="w-8 h-8" />,
    description: 'Moto-taxi rapide'
  }
];

const DELIVERY_VEHICLES: VehicleType[] = [
  {
    value: 'moto',
    label: 'Moto',
    icon: <Bike className="w-8 h-8" />,
    description: 'Livraisons rapides'
  },
  {
    value: 'voiture',
    label: 'Voiture',
    icon: <Car className="w-8 h-8" />,
    description: 'Colis moyens'
  },
  {
    value: 'camionnette',
    label: 'Camionnette',
    icon: <Package className="w-8 h-8" />,
    description: 'Gros colis'
  },
  {
    value: 'camion',
    label: 'Camion',
    icon: <Truck className="w-8 h-8" />,
    description: 'Très gros colis'
  }
];

export const VehicleTypeSelector: React.FC<VehicleTypeSelectorProps> = ({
  serviceCategory,
  selectedType,
  onTypeSelect
}) => {
  const vehicles = serviceCategory === 'taxi' ? TAXI_VEHICLES : DELIVERY_VEHICLES;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
          Type de Véhicule
        </h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Sélectionnez le type de véhicule que vous utilisez
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((vehicle) => (
          <Card
            key={vehicle.value}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:scale-105",
              "border-2 dark:bg-card/95 dark:border-border/60",
              selectedType === vehicle.value
                ? "border-primary bg-primary/5 dark:bg-primary/10 dark:border-primary shadow-lg"
                : "border-border/40 hover:border-primary/50 dark:hover:border-primary/50"
            )}
            onClick={() => {
              console.log('🚗 Vehicle Type Selected:', vehicle.value);
              onTypeSelect(vehicle.value);
            }}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div className={cn(
                "mx-auto w-16 h-16 rounded-full flex items-center justify-center",
                selectedType === vehicle.value
                  ? "bg-primary/20 text-primary dark:bg-primary/30"
                  : "bg-muted text-muted-foreground dark:bg-muted/50"
              )}>
                {vehicle.icon}
              </div>
              <div>
                <h4 className="font-semibold text-foreground dark:text-foreground">
                  {vehicle.label}
                </h4>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                  {vehicle.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
