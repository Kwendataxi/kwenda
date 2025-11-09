import React, { useMemo, useCallback, memo, useEffect } from 'react';
import { Bike, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAvailableTaxiServices } from '@/hooks/useAvailableTaxiServices';
import { cn } from '@/lib/utils';

interface YangoVehicle {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  estimatedTime: number;
  basePrice: number;
  pricePerKm: number;
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
  city?: string;
}

const YangoVerticalVehicleCards = memo<YangoVerticalVehicleCardsProps>(({
  distance,
  selectedVehicleId,
  onVehicleSelect,
  city = 'Kinshasa'
}) => {
  const { availableServices, loading } = useAvailableTaxiServices(city);

  // Configuration visuelle des véhicules
  const getVehicleDisplayConfig = useCallback((vehicleClass: string) => {
    const configs: Record<string, any> = {
      moto: {
        name: 'Moto',
        icon: Bike,
        estimatedTime: 5,
        gradient: 'from-yellow-50/80 to-yellow-100/80',
        borderColor: 'border-l-congo-yellow',
        bgColor: 'bg-yellow-50',
        iconColor: 'text-congo-yellow'
      },
      eco: {
        name: 'Eco',
        icon: Car,
        estimatedTime: 8,
        gradient: 'from-green-50/80 to-green-100/80',
        borderColor: 'border-l-congo-green',
        bgColor: 'bg-green-50',
        iconColor: 'text-congo-green'
      },
      standard: {
        name: 'Standard',
        icon: Car,
        estimatedTime: 10,
        gradient: 'from-blue-50/80 to-blue-100/80',
        borderColor: 'border-l-congo-blue',
        bgColor: 'bg-blue-50',
        iconColor: 'text-congo-blue'
      },
      premium: {
        name: 'Premium',
        icon: Car,
        estimatedTime: 12,
        gradient: 'from-purple-50/80 to-purple-100/80',
        borderColor: 'border-l-purple-500',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600'
      }
    };
    return configs[vehicleClass] || configs.standard;
  }, []);

  // Charger dynamiquement les véhicules depuis availableServices
  const vehicles: YangoVehicle[] = useMemo(() => {
    // Le filtrage is_active est déjà fait dans le hook useAvailableTaxiServices
    return availableServices.map(service => {
      const config = getVehicleDisplayConfig(service.vehicle_class);
      return {
        id: service.vehicle_class,
        name: config.name,
        icon: config.icon,
        estimatedTime: config.estimatedTime,
        basePrice: Number(service.base_price),
        pricePerKm: Number(service.price_per_km),
        available: true,
        gradient: config.gradient,
        borderColor: config.borderColor,
        bgColor: config.bgColor,
        iconColor: config.iconColor
      };
    }).sort((a, b) => a.basePrice - b.basePrice);
  }, [availableServices, getVehicleDisplayConfig]);

  // Debug : Logger si aucun véhicule disponible
  useEffect(() => {
    if (!loading && availableServices.length === 0) {
      console.error('❌ [YangoVerticalVehicleCards] NO VEHICLES AVAILABLE', {
        city: city,
        timestamp: Date.now(),
        loading: loading
      });
    }
  }, [loading, availableServices, city]);

  // Message si aucun véhicule disponible
  if (!loading && vehicles.length === 0) {
    return (
      <div className="p-6 text-center space-y-3 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
        <Car className="w-16 h-16 mx-auto text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="text-destructive font-semibold text-base">⚠️ Aucun véhicule disponible</p>
          <p className="text-sm text-muted-foreground font-medium">
            Ville sélectionnée : <span className="font-bold text-foreground">{city}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Vérifiez que les services sont activés dans l'admin (pricing_rules et service_configurations)
        </p>
      </div>
    );
  }

  // Sélectionner automatiquement le premier véhicule si aucun n'est sélectionné
  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      onVehicleSelect(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId, onVehicleSelect]);

  return (
    <div className="space-y-3 font-montserrat" style={{ willChange: 'transform' }}>
      {vehicles.map((vehicle, index) => {
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
            <div className="flex-shrink-0 text-right space-y-0.5">
              <div className="flex flex-col items-end">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Base
                </div>
                <div className="text-base font-bold text-foreground">
                  {vehicle.basePrice.toLocaleString()} CDF
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-semibold">{vehicle.pricePerKm} CDF</span>
                <span>/km</span>
              </div>
            </div>

            {/* Badge disponibilité */}
            {vehicle.available && !isSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-2 right-2"
              >
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full backdrop-blur-sm border border-green-500/20">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Dispo</span>
                </div>
              </motion.div>
            )}

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
});

YangoVerticalVehicleCards.displayName = 'YangoVerticalVehicleCards';

export default YangoVerticalVehicleCards;
