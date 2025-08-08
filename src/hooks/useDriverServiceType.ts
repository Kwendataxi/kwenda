
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
    const fetchProfile = async () => {
      if (!user) {
        setServiceType('unknown');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('driver_profiles')
        .select('service_type, is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Failed to load driver profile service_type:', error);
        setServiceType('unknown');
      } else {
        // Default to 'taxi' if not set; ensure active drivers still get a sensible default
        const type = (data?.service_type as 'taxi' | 'delivery' | null) || 'taxi';
        setServiceType(type);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  return { loading, serviceType };
};
