import React from 'react';
import { Users, Settings, Fuel, Gauge, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VehicleSpecificationsProps {
  vehicle: any;
}

export const VehicleSpecifications: React.FC<VehicleSpecificationsProps> = ({ vehicle }) => {
  const specs = [
    {
      icon: Users,
      label: 'Places',
      value: `${vehicle.seats} passagers`,
      color: 'text-blue-500'
    },
    {
      icon: Settings,
      label: 'Transmission',
      value: vehicle.transmission === 'automatic' ? 'Automatique' : 'Manuelle',
      color: 'text-purple-500'
    },
    {
      icon: Fuel,
      label: 'Carburant',
      value: vehicle.fuel_type === 'gasoline' ? 'Essence' : vehicle.fuel_type === 'diesel' ? 'Diesel' : 'Hybride',
      color: 'text-green-500'
    },
    {
      icon: Gauge,
      label: 'Année',
      value: vehicle.year.toString(),
      color: 'text-orange-500'
    },
    {
      icon: MapPin,
      label: 'Localisation',
      value: vehicle.city,
      color: 'text-red-500'
    },
    {
      icon: Star,
      label: 'Confort',
      value: vehicle.comfort_level,
      color: 'text-yellow-500'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Caractéristiques</h3>
      
      {/* Grille des spécifications */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {specs.map((spec, index) => {
          const IconComponent = spec.icon;
          return (
            <div
              key={index}
              className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <IconComponent className={`h-4 w-4 ${spec.color}`} />
                <p className="text-xs text-muted-foreground">{spec.label}</p>
              </div>
              <p className="text-sm font-semibold">{spec.value}</p>
            </div>
          );
        })}
      </div>

      {/* Équipements inclus */}
      {vehicle.features && vehicle.features.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Équipements inclus</h4>
          <div className="flex flex-wrap gap-2">
            {vehicle.features.map((feature: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Villes disponibles */}
      {vehicle.available_cities && vehicle.available_cities.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Disponible dans</h4>
          <div className="flex flex-wrap gap-2">
            {vehicle.available_cities.map((city: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {city}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
