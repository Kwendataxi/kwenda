import React from 'react';
import { Car, Bike, Bus, Truck, Clock } from 'lucide-react';

interface YangoVehicle {
  id: string;
  name: string;
  type: 'moto' | 'eco' | 'standard' | 'premium' | 'bus';
  icon: React.ComponentType<any>;
  estimatedTime: number;
  basePrice: number;
  multiplier: number;
  available: boolean;
  capacity: number;
}

interface YangoStyleVehicleSelectionProps {
  distance: number;
  onVehicleSelect: (vehicle: YangoVehicle & { price: number }) => void;
  selectedVehicleId?: string;
}

const YangoStyleVehicleSelection: React.FC<YangoStyleVehicleSelectionProps> = ({
  distance,
  onVehicleSelect,
  selectedVehicleId
}) => {
  const vehicles: YangoVehicle[] = [
    {
      id: 'moto',
      name: 'Moto',
      type: 'moto',
      icon: Bike,
      estimatedTime: 5,
      basePrice: 300,
      multiplier: 0.6,
      available: true,
      capacity: 1
    },
    {
      id: 'eco',
      name: 'Eco',
      type: 'eco',
      icon: Car,
      estimatedTime: 8,
      basePrice: 500,
      multiplier: 1.0,
      available: true,
      capacity: 4
    },
    {
      id: 'standard',
      name: 'Standard',
      type: 'standard',
      icon: Car,
      estimatedTime: 10,
      basePrice: 750,
      multiplier: 1.5,
      available: true,
      capacity: 4
    },
    {
      id: 'premium',
      name: 'Premium',
      type: 'premium',
      icon: Car,
      estimatedTime: 12,
      basePrice: 1200,
      multiplier: 2.0,
      available: true,
      capacity: 4
    },
    {
      id: 'bus',
      name: 'Bus',
      type: 'bus',
      icon: Bus,
      estimatedTime: 20,
      basePrice: 200,
      multiplier: 0.4,
      available: false,
      capacity: 12
    }
  ];

  const calculatePrice = (vehicle: YangoVehicle): number => {
    const distanceKm = Math.max(distance, 1);
    const pricePerKm = 150;
    return Math.round(vehicle.basePrice + (distanceKm * pricePerKm * vehicle.multiplier));
  };

  const getVehicleColor = (type: string, isSelected: boolean, available: boolean) => {
    if (!available) return 'bg-grey-100 border-grey-200';
    if (isSelected) return 'bg-primary border-primary';
    
    switch (type) {
      case 'moto': return 'bg-congo-yellow/10 border-congo-yellow/30 hover:border-congo-yellow';
      case 'eco': return 'bg-green-50 border-green-200 hover:border-green-400';
      case 'standard': return 'bg-blue-50 border-blue-200 hover:border-blue-400';
      case 'premium': return 'bg-purple-50 border-purple-200 hover:border-purple-400';
      case 'bus': return 'bg-orange-50 border-orange-200 hover:border-orange-400';
      default: return 'bg-grey-50 border-grey-200 hover:border-grey-400';
    }
  };

  const getIconColor = (type: string, isSelected: boolean, available: boolean) => {
    if (!available) return 'text-grey-400';
    if (isSelected) return 'text-white';
    
    switch (type) {
      case 'moto': return 'text-congo-yellow';
      case 'eco': return 'text-green-600';
      case 'standard': return 'text-blue-600';
      case 'premium': return 'text-purple-600';
      case 'bus': return 'text-orange-600';
      default: return 'text-grey-600';
    }
  };

  const getTextColor = (isSelected: boolean, available: boolean) => {
    if (!available) return 'text-grey-400';
    if (isSelected) return 'text-white';
    return 'text-grey-900';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-grey-900">Choisir un véhicule</h3>
        {distance > 0 && (
          <span className="text-sm text-grey-600">
            {distance.toFixed(1)} km
          </span>
        )}
      </div>

      {/* Horizontal Vehicle Cards */}
      <div className="relative">
        {/* Scroll container with gradient fade */}
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="flex gap-3 px-1 min-w-max">
            {vehicles.map((vehicle) => {
              const price = calculatePrice(vehicle);
              const isSelected = selectedVehicleId === vehicle.id;
              const cardColorClass = getVehicleColor(vehicle.type, isSelected, vehicle.available);
              const iconColorClass = getIconColor(vehicle.type, isSelected, vehicle.available);
              const textColorClass = getTextColor(isSelected, vehicle.available);

              return (
                <div
                  key={vehicle.id}
                  onClick={() => vehicle.available && onVehicleSelect({ ...vehicle, price })}
                  className={`
                    relative flex-shrink-0 w-24 h-28 p-3 rounded-2xl border-2 
                    transition-all duration-200 cursor-pointer touch-friendly
                    ${cardColorClass}
                    ${!vehicle.available ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'}
                    ${isSelected ? 'shadow-lg scale-105' : ''}
                  `}
                >
                  {/* Icon */}
                  <div className={`w-8 h-8 mx-auto mb-1 flex items-center justify-center rounded-lg
                    ${isSelected ? 'bg-white/20' : 'bg-transparent'}
                  `}>
                    <vehicle.icon className={`h-5 w-5 ${iconColorClass}`} />
                  </div>

                  {/* Vehicle Name */}
                  <div className="text-center mb-1">
                    <p className={`text-xs font-medium ${textColorClass} leading-tight`}>
                      {vehicle.name}
                    </p>
                  </div>

                  {/* Time Badge */}
                  <div className={`flex items-center justify-center mb-1 px-1.5 py-0.5 rounded-full
                    ${isSelected ? 'bg-white/20' : 'bg-black/5'}
                  `}>
                    <Clock className={`h-2.5 w-2.5 mr-1 ${textColorClass}`} />
                    <span className={`text-[10px] font-medium ${textColorClass}`}>
                      {vehicle.estimatedTime}m
                    </span>
                  </div>

                  {/* Price */}
                  <div className="text-center">
                    <p className={`text-xs font-bold ${textColorClass} leading-tight`}>
                      {vehicle.available ? `${price.toLocaleString()} FC` : 'N/A'}
                    </p>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}

                  {/* Unavailable Overlay */}
                  {!vehicle.available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-2xl">
                      <span className="text-[10px] font-medium text-grey-600 bg-white px-1.5 py-0.5 rounded">
                        Indispo
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none"></div>
      </div>

      {/* Selected Vehicle Details */}
      {selectedVehicleId && (
        <div className="bg-grey-50 rounded-xl p-3 border border-grey-100">
          {(() => {
            const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
            if (!selectedVehicle) return null;
            
            return (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <selectedVehicle.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-grey-900">{selectedVehicle.name}</span>
                  <span className="text-grey-600">• {selectedVehicle.capacity} places</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {calculatePrice(selectedVehicle).toLocaleString()} FC
                  </p>
                  <p className="text-xs text-grey-500">
                    ~{selectedVehicle.estimatedTime} min
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default YangoStyleVehicleSelection;