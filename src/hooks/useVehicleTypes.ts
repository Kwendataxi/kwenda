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
  
  // ⚡ PHASE 2: Ajout distance dans cache key pour invalidation intelligente
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicle-types', city, Math.round(distance)],
    queryFn: async () => {
      console.log('🔍 [useVehicleTypes] Fetching vehicles for:', { city, distance });
      
      // 1. Fetch service configurations for taxi services
      const { data: configs, error: configError } = await supabase
        .from('service_configurations')
        .select('*')
        .eq('service_category', 'taxi')
        .eq('is_active', true);

      if (configError) {
        console.error('❌ [useVehicleTypes] Config error:', configError);
        throw configError;
      }
      if (!configs || configs.length === 0) {
        console.warn('⚠️ [useVehicleTypes] Aucune configuration de service trouvée');
        return [];
      }
      
      console.log('✅ [useVehicleTypes] Configs trouvées:', configs.length);

      // 2. Fetch pricing rules (source unique de vérité depuis l'admin)
      const { data: pricingRules, error: pricingError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('service_type', 'transport')
        .ilike('city', city) // Case-insensitive city matching
        .eq('is_active', true);

      if (pricingError) {
        console.error('❌ [useVehicleTypes] Pricing error:', pricingError);
        throw pricingError;
      }
      
      console.log('💰 [useVehicleTypes] Pricing rules trouvées:', pricingRules?.length || 0);

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
          isPopular: config.service_type === 'taxi_confort' || config.service_type === 'taxi_moto'
        };
      });

      // Sort by price (cheapest first)
      const sortedVehicles = mappedVehicles.sort((a, b) => a.calculatedPrice - b.calculatedPrice);
      
      console.log('🚗 [useVehicleTypes] Véhicules mappés:', {
        count: sortedVehicles.length,
        vehicles: sortedVehicles.map(v => ({ id: v.id, name: v.name, price: v.calculatedPrice }))
      });
      
      return sortedVehicles;
    },
    enabled: true,
    // ✅ PHASE 3: Pas de cache quand distance calculée pour forcer le recalcul des prix
    staleTime: distance > 0 ? 0 : 5 * 60 * 1000,
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
