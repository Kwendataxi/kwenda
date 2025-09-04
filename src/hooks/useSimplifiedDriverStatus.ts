import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DriverStatus {
  isOnline: boolean;
  isAvailable: boolean;
  latitude?: number;
  longitude?: number;
  serviceTypes: string[];
  vehicleClass: string;
  lastUpdate?: Date;
}

export const useSimplifiedDriverStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<DriverStatus>({
    isOnline: false,
    isAvailable: false,
    serviceTypes: ['delivery'],
    vehicleClass: 'standard',
  });
  const [loading, setLoading] = useState(false);

  const updateDriverLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          latitude,
          longitude,
          is_online: status.isOnline,
          is_available: status.isAvailable,
          vehicle_class: status.vehicleClass,
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'driver_id'
        });

      if (error) {
        console.error('Error updating driver location:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateDriverLocation:', error);
      return false;
    }
  }, [user, status.isOnline, status.isAvailable, status.vehicleClass]);

  // Charger le statut initial depuis la base de données
  useEffect(() => {
    const loadInitialStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('driver_locations')
          .select('*')
          .eq('driver_id', user.id)
          .single();

        if (data && !error) {
          setStatus(prev => ({
            ...prev,
            isOnline: data.is_online,
            isAvailable: data.is_available,
            latitude: data.latitude,
            longitude: data.longitude,
            vehicleClass: data.vehicle_class || 'standard',
            lastUpdate: new Date(data.updated_at)
          }));
        }
      } catch (error) {
        console.error('Error loading initial status:', error);
      }
    };

    loadInitialStatus();
  }, [user]);

  const updateStatus = useCallback(async (newStatus: Partial<DriverStatus>) => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return false;
    }

    setLoading(true);
    
    try {
      const updatedStatus = { ...status, ...newStatus, lastUpdate: new Date() };
      
      // Mettre à jour dans driver_locations
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          latitude: updatedStatus.latitude || -4.3217, // Kinshasa par défaut
          longitude: updatedStatus.longitude || 15.3069,
          is_online: updatedStatus.isOnline,
          is_available: updatedStatus.isAvailable,
          vehicle_class: updatedStatus.vehicleClass,
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_verified: true
        }, {
          onConflict: 'driver_id'
        });

      if (error) {
        console.error('Error updating driver status:', error);
        toast.error('Erreur lors de la mise à jour du statut');
        return false;
      }

      setStatus(updatedStatus);
      
      if (updatedStatus.isOnline) {
        toast.success('Vous êtes maintenant en ligne');
      } else {
        toast.success('Vous êtes maintenant hors ligne');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, status]);

  const goOnline = useCallback(async (latitude?: number, longitude?: number) => {
    return updateStatus({
      isOnline: true,
      isAvailable: true,
      latitude,
      longitude,
    });
  }, [updateStatus]);

  const goOffline = useCallback(async () => {
    return updateStatus({
      isOnline: false,
      isAvailable: false,
    });
  }, [updateStatus]);

  const setAvailable = useCallback(async (isAvailable: boolean) => {
    if (!status.isOnline && isAvailable) {
      toast.warning('Vous devez être en ligne pour être disponible');
      return false;
    }
    return updateStatus({ isAvailable });
  }, [status.isOnline, updateStatus]);

  const updateServiceTypes = useCallback(async (serviceTypes: string[]) => {
    return updateStatus({ serviceTypes });
  }, [updateStatus]);

  return {
    status,
    loading,
    updateStatus,
    goOnline,
    goOffline,
    setAvailable,
    updateServiceTypes,
    updateDriverLocation,
  };
};