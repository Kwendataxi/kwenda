import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { VEHICLE_CLASS_TO_SERVICE_TYPE } from '@/utils/pricingMapper';

export interface AvailableTaxiService {
  id: string;
  service_type: 'transport';
  vehicle_class: string;
  base_price: number;
  price_per_km: number;
  price_per_minute: number;
  minimum_fare: number;
  surge_multiplier: number;
  waiting_fee_per_minute: number;
  free_waiting_time_minutes: number;
  max_waiting_time_minutes: number;
  currency: string;
  city: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Données enrichies de service_configurations
  display_name: string;
  description?: string;
}

/**
 * Hook unifié pour récupérer les services taxi disponibles
 * Combine pricing_rules.is_active ET service_configurations.is_active
 * 
 * Un service est visible UNIQUEMENT si les deux conditions sont remplies :
 * 1. pricing_rules.is_active = true
 * 2. service_configurations.is_active = true (via mapping vehicle_class -> service_type)
 */
export const useAvailableTaxiServices = (city: string = 'Kinshasa') => {
  const queryClient = useQueryClient();

  const query = useQuery<AvailableTaxiService[]>({
    queryKey: ['available-taxi-services', city],
    queryFn: async () => {
      const timestamp = Date.now();
      console.log(`[${timestamp}] 🚕 Fetching available taxi services for ${city}...`);

      // 1. Récupérer les pricing_rules actifs pour cette ville
      const { data: pricingRules, error: pricingError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('city', city)
        .eq('service_type', 'transport')
        .eq('is_active', true);

      if (pricingError) {
        console.error(`[${timestamp}] ❌ Error fetching pricing_rules:`, pricingError);
        throw pricingError;
      }

      console.log(`[${timestamp}] 📊 Pricing rules fetched:`, pricingRules?.length);

      // 2. Récupérer les service_configurations pour les taxis
      const { data: serviceConfigs, error: configError } = await supabase
        .from('service_configurations')
        .select('*')
        .eq('service_category', 'taxi')
        .eq('is_active', true);

      if (configError) {
        console.error(`[${timestamp}] ❌ Error fetching service_configurations:`, configError);
        throw configError;
      }

      console.log(`[${timestamp}] ⚙️ Service configurations fetched:`, serviceConfigs?.length);

      // 3. Filtrer pour ne garder que les services avec BOTH is_active = true
      const availableServices: AvailableTaxiService[] = (pricingRules || [])
        .map((rule: any) => {
          // Mapper vehicle_class -> service_type (ex: 'eco' -> 'taxi_eco')
          const serviceType = VEHICLE_CLASS_TO_SERVICE_TYPE[rule.vehicle_class];
          
          // Trouver la configuration correspondante
          const config = serviceConfigs?.find(c => c.service_type === serviceType);

          // Si config n'existe pas ou n'est pas active, exclure ce service
          if (!config || !config.is_active) {
            console.log(`[${timestamp}] ⚠️ Service ${rule.vehicle_class} excluded (config inactive)`);
            return null;
          }

          // Enrichir avec les données de configuration
          return {
            ...rule,
            display_name: config.display_name,
            description: config.description,
          } as AvailableTaxiService;
        })
        .filter(Boolean) as AvailableTaxiService[];

      console.log(`[${timestamp}] ✅ Available services after filtering:`, {
        count: availableServices.length,
        services: availableServices.map(s => s.vehicle_class)
      });

      return availableServices;
    },
    staleTime: 0, // ⚠️ Force refresh pour tests
    gcTime: 0,    // ⚠️ Pas de cache pour tests
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Realtime: Écouter les changements sur les deux tables
  useEffect(() => {
    const pricingChannel = supabase
      .channel('pricing-rules-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_rules' },
        (payload: any) => {
          const affectedCity = payload.new?.city || payload.old?.city;
          if (affectedCity === city) {
            console.log('🔄 Pricing rules changed, invalidating cache...');
            queryClient.invalidateQueries({ queryKey: ['available-taxi-services', city] });
          }
        }
      )
      .subscribe();

    const configChannel = supabase
      .channel('service-configurations-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_configurations' },
        (payload: any) => {
          console.log('🔄 Service configurations changed, invalidating cache...');
          queryClient.invalidateQueries({ queryKey: ['available-taxi-services', city] });
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(pricingChannel);
        supabase.removeChannel(configChannel);
      } catch {}
    };
  }, [queryClient, city]);

  return {
    availableServices: query.data || [],
    loading: query.isLoading,
    error: query.error as Error | null,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['available-taxi-services', city] }),
  };
};
