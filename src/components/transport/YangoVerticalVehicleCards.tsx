import React from 'react';
import { Bike, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePricingRules } from '@/hooks/usePricingRules';
import { cn } from '@/lib/utils';

interface YangoVehicle {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  estimatedTime: number;
  basePrice: number;
  multiplier: number;
  available: boolean;
  gradient: string;
  borderColor: string;
  bgColor: string;
  iconColor: string;
}

interface YangoVerticalVehicleCardsProps {
  distance: number;
  selectedVehicleId: string;
  onVehicleSelect: (vehicleId: string) => void;
}

const YangoVerticalVehicleCards: React.FC<YangoVerticalVehicleCardsProps> = ({
  distance,
  selectedVehicleId,
  onVehicleSelect
}) => {
  const { rules } = usePricingRules();

  const vehicles: YangoVehicle[] = [
    {
      id: 'taxi_moto',
      name: 'Moto',
      icon: Bike,
      estimatedTime: 5,
      basePrice: 300,
      multiplier: 0.6,
      available: true,
      gradient: 'from-yellow-50/80 to-yellow-100/80',
      borderColor: 'border-l-congo-yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-congo-yellow'
    },
    {
      id: 'taxi_eco',
      name: 'Eco',
      icon: Car,
      estimatedTime: 8,
      basePrice: 500,
      multiplier: 1.0,
      available: true,
      gradient: 'from-green-50/80 to-green-100/80',
      borderColor: 'border-l-congo-green',
      bgColor: 'bg-green-50',
      iconColor: 'text-congo-green'
    },
    {
      id: 'taxi_confort',
      name: 'Standard',
      icon: Car,
      estimatedTime: 10,
      basePrice: 750,
      multiplier: 1.5,
      available: true,
      gradient: 'from-blue-50/80 to-blue-100/80',
      borderColor: 'border-l-congo-blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-congo-blue'
    },
    {
      id: 'taxi_premium',
      name: 'Premium',
      icon: Car,
      estimatedTime: 12,
      basePrice: 1200,
      multiplier: 2.0,
      available: true,
      gradient: 'from-purple-50/80 to-purple-100/80',
      borderColor: 'border-l-purple-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  const calculatePrice = (vehicle: YangoVehicle): number => {
    const distanceKm = Math.max(distance, 0);
    const rule = rules.find(r => r.service_type === 'transport' && r.vehicle_class === vehicle.id);
    if (rule) {
      return Math.round((Number(rule.base_price) || 0) + distanceKm * (Number(rule.price_per_km) || 0));
    }
    const pricePerKm = 150;
    return Math.round(vehicle.basePrice + (distanceKm * pricePerKm * vehicle.multiplier));
  };

  return (
    <div className="space-y-3 font-montserrat">
      {vehicles.map((vehicle, index) => {
        const price = calculatePrice(vehicle);
        const isSelected = selectedVehicleId === vehicle.id;

        return (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => vehicle.available && onVehicleSelect(vehicle.id)}
            className={cn(
              "relative flex items-center gap-3 p-4 rounded-2xl border-l-4 cursor-pointer",
              "transition-all duration-300 overflow-hidden",
              vehicle.borderColor,
              isSelected 
                ? `shadow-xl scale-[1.02] ring-2 ring-primary/20 bg-gradient-to-r ${vehicle.gradient}`
                : `shadow-sm hover:shadow-md bg-white hover:bg-gradient-to-r hover:${vehicle.gradient}`,
              !vehicle.available && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Icône véhicule */}
            <motion.div 
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                vehicle.bgColor
              )}
              animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <vehicle.icon className={cn("w-6 h-6", vehicle.iconColor)} strokeWidth={2.5} />
            </motion.div>

            {/* Infos véhicule */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base text-foreground mb-0.5">{vehicle.name}</h4>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{vehicle.estimatedTime}m</span>
              </div>
            </div>

            {/* Prix */}
            <div className="flex-shrink-0 text-right">
              <p className="text-lg font-extrabold text-foreground">
                {vehicle.available ? `${price.toLocaleString()}` : 'N/A'}
              </p>
              <p className="text-xs font-semibold text-muted-foreground">FC</p>
            </div>

            {/* Badge sélection */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
              >
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}

            {/* Effet brillant au hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default YangoVerticalVehicleCards;
