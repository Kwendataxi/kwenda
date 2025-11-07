/**
 * Hook pour récupérer les informations complètes du service du chauffeur
 * Remplace useDriverServiceType avec support de service_specialization
 */

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface DriverServiceInfo {
  serviceType: 'taxi' | 'delivery' | 'unknown';
  serviceSpecialization: string | null;
}

export const useDriverServiceInfo = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serviceInfo, setServiceInfo] = useState<DriverServiceInfo>({
    serviceType: 'unknown',
    serviceSpecialization: null
  });

  useEffect(() => {
    const fetchServiceInfo = async () => {
      if (!user) {
        setServiceInfo({ serviceType: 'unknown', serviceSpecialization: null });
        setLoading(false);
        return;
      }

      try {
        // ✅ Utiliser la nouvelle fonction RPC get_driver_service_info
        const { data, error } = await (supabase as any)
          .rpc('get_driver_service_info', { driver_user_id: user.id });

        if (error) {
          console.error('❌ RPC Error fetching service info:', error);
          setServiceInfo({ serviceType: 'unknown', serviceSpecialization: null });
          setLoading(false);
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          const info = data[0];
          setServiceInfo({
            serviceType: info.service_type || 'unknown',
            serviceSpecialization: info.service_specialization || null
          });
          console.log(`✅ Driver service info:`, info);
        } else if (data && typeof data === 'object') {
          // Si la RPC retourne un objet unique au lieu d'un array
          setServiceInfo({
            serviceType: (data as any).service_type || 'unknown',
            serviceSpecialization: (data as any).service_specialization || null
          });
        } else {
          setServiceInfo({ serviceType: 'unknown', serviceSpecialization: null });
        }

      } catch (err) {
        console.error('💥 Failed to load driver service info:', err);
        setServiceInfo({ serviceType: 'unknown', serviceSpecialization: null });
      } finally {
        setLoading(false);
      }
    };

    fetchServiceInfo();
  }, [user]);

  return { loading, ...serviceInfo };
};
