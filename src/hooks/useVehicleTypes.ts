import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VehicleType } from '@/types/vehicle';
import { getVehicleConfig } from '@/utils/vehicleMapper';
import { getVehicleClass } from '@/utils/pricingMapper';

interface UseVehicleTypesOptions {
  distance?: number;
  city?: string;
}

export const useVehicleTypes = ({ distance = 0, city = 'Kinshasa' }: UseVehicleTypesOptions = {}) => {
  const queryClient = useQueryClient();
  
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicle-types', city],
    queryFn: async () => {
      // 1. Fetch service configurations for taxi services
      const { data: configs, error: configError } = await supabase
        .from('service_configurations')
        .select('*')
        .eq('service_category', 'taxi')
        .eq('is_active', true);

      if (configError) throw configError;
      if (!configs) return [];

      // 2. Fetch pricing rules (source unique de vérité depuis l'admin)
      const { data: pricingRules, error: pricingError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_type', 'transport')
        .ilike('city', city) // Case-insensitive city matching
        .eq('is_active', true);

      if (pricingError) throw pricingError;

      // 3. Map configs with pricing_rules
      const mappedVehicles: VehicleType[] = configs.map(config => {
        const vehicleClass = getVehicleClass(config.service_type);
        const pricing = pricingRules?.find(p => p.vehicle_class === vehicleClass);

        const vehicleConfig = getVehicleConfig(config.service_type);
        const basePrice = pricing?.base_price || 2500;
        const pricePerKm = pricing?.price_per_km || 300;
        const calculatedPrice = Math.round(basePrice + (distance * pricePerKm));

        // Estimate ETA based on distance (assuming 30 km/h average speed in city)
        const eta = distance > 0 ? Math.round((distance / 30) * 60) + 5 : 10;

        return {
          id: config.service_type,
          name: vehicleConfig.displayName,
          description: vehicleConfig.description,
          icon: vehicleConfig.icon,
          gradient: vehicleConfig.gradient,
          basePrice,
          pricePerKm,
          calculatedPrice,
          eta,
          features: Array.isArray(config.features) 
            ? config.features.filter((f): f is string => typeof f === 'string')
            : [],
          capacity: 4,
          available: true,
          isPopular: config.service_type === 'confort' || config.service_type === 'moto'
        };
      });

      // Sort by price (cheapest first)
      return mappedVehicles.sort((a, b) => a.calculatedPrice - b.calculatedPrice);
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Synchronisation temps réel avec pricing_rules
  useEffect(() => {
    const channel = supabase
      .channel('pricing-updates-for-vehicles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_rules' },
        (payload: any) => {
          // Invalider le cache quand pricing_rules change pour cette ville
          const newCity = payload.new?.city as string | undefined;
          const oldCity = payload.old?.city as string | undefined;
          if (newCity === city || oldCity === city) {
            queryClient.invalidateQueries({ queryKey: ['vehicle-types', city] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [city, queryClient]);

  return {
    vehicles: vehicles || [],
    isLoading,
    error
  };
};
