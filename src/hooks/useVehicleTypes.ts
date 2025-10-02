import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VehicleType } from '@/types/vehicle';
import { getVehicleConfig } from '@/utils/vehicleMapper';

interface UseVehicleTypesOptions {
  distance?: number;
  city?: string;
}

export const useVehicleTypes = ({ distance = 0, city = 'Kinshasa' }: UseVehicleTypesOptions = {}) => {
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicle-types', city],
    queryFn: async () => {
      // Fetch service configurations for taxi services
      const { data: configs, error: configError } = await supabase
        .from('service_configurations')
        .select(`
          *,
          service_pricing (*)
        `)
        .eq('service_category', 'taxi')
        .eq('is_active', true);

      if (configError) throw configError;
      if (!configs) return [];

      // Map to UI format with vehicle config
      const mappedVehicles: VehicleType[] = configs.map(config => {
        const pricing = Array.isArray(config.service_pricing) 
          ? config.service_pricing.find((p: any) => p.city === city || p.city === 'Kinshasa')
          : null;

        const vehicleConfig = getVehicleConfig(config.service_type);
        const basePrice = pricing?.base_price || 2000;
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
          capacity: 4, // Default capacity
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

  return {
    vehicles: vehicles || [],
    isLoading,
    error
  };
};
