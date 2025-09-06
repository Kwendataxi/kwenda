
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the driver's service type to help default the Chauffeur UI tab.
 * Supports the new differentiated service system.
 * serviceType: 'taxi' | 'delivery' | 'unknown'
 */
export const useDriverServiceType = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<'taxi' | 'delivery' | 'unknown'>('unknown');

  useEffect(() => {
    const fetchServiceType = async () => {
      if (!user) {
        setServiceType('unknown');
        setLoading(false);
        return;
      }

      try {
        // First, try the new system using the driver_service_status view
        const { data: statusData, error: statusError } = await supabase
          .from('driver_service_status')
          .select('effective_service, current_service, service_category')
          .eq('driver_id', user.id)
          .maybeSingle();

        if (!statusError && statusData) {
          const effectiveService = statusData.effective_service || statusData.current_service;
          
          if (effectiveService) {
            // Map specific service types to general categories
            if (effectiveService.startsWith('delivery_') || effectiveService === 'delivery_flex' || effectiveService === 'delivery_flash' || effectiveService === 'delivery_maxicharge') {
              setServiceType('delivery');
            } else if (effectiveService.startsWith('taxi_') || effectiveService === 'moto_transport') {
              setServiceType('taxi');
            } else {
              // Use service_category as fallback
              setServiceType(statusData.service_category === 'delivery' ? 'delivery' : 'taxi');
            }
            setLoading(false);
            return;
          }
        }

        // Fallback to driver_profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('driver_profiles')
          .select('service_type, is_active')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profileError && profileData) {
          const type = (profileData?.service_type as 'taxi' | 'delivery' | null) || 'taxi';
          setServiceType(type);
          setLoading(false);
          return;
        }

        // Final fallback: check chauffeurs table for legacy data
        const { data: chauffeurData, error: chauffeurError } = await supabase
          .from('chauffeurs')
          .select('vehicle_type, delivery_capacity, migrated_service_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!chauffeurError && chauffeurData) {
          // Use migrated service type if available
          if (chauffeurData.migrated_service_type) {
            if (chauffeurData.migrated_service_type.startsWith('delivery_')) {
              setServiceType('delivery');
            } else {
              setServiceType('taxi');
            }
            setLoading(false);
            return;
          }

          // Map legacy data
          if (chauffeurData.delivery_capacity) {
            setServiceType('delivery');
          } else {
            setServiceType('taxi');
          }
          setLoading(false);
          return;
        }

        // Default fallback
        setServiceType('taxi');

      } catch (err) {
        console.warn('Failed to load driver service type:', err);
        setServiceType('taxi'); // Default to taxi on error
      } finally {
        setLoading(false);
      }
    };

    fetchServiceType();
  }, [user]);

  return { loading, serviceType };
};
