
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the driver's service type to help default the Chauffeur UI tab.
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
        // First, check driver service preferences
        const { data: prefData, error: prefError } = await supabase
          .from('driver_service_preferences')
          .select('service_types, is_active')
          .eq('driver_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!prefError && prefData && prefData.service_types?.length > 0) {
          const serviceTypes = prefData.service_types;
          
          // Check if any delivery services are included
          if (serviceTypes.some(type => type.includes('delivery'))) {
            setServiceType('delivery');
            setLoading(false);
            return;
          }
          
          // Check if any taxi services are included
          if (serviceTypes.some(type => type.includes('taxi') || type === 'moto_transport')) {
            setServiceType('taxi');
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
          const type = profileData.service_type || 'taxi';
          
          if (type === 'delivery' || type === 'delivery_flex' || type === 'delivery_flash') {
            setServiceType('delivery');
          } else {
            setServiceType('taxi');
          }
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
            if (chauffeurData.migrated_service_type.includes('delivery')) {
              setServiceType('delivery');
            } else {
              setServiceType('taxi');
            }
            setLoading(false);
            return;
          }

          // Map legacy data based on delivery capacity
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
