import { useState, useCallback } from 'react';
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

  const updateStatus = useCallback(async (newStatus: Partial<DriverStatus>) => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return false;
    }

    setLoading(true);
    
    try {
      const updatedStatus = { ...status, ...newStatus, lastUpdate: new Date() };
      
      // Si on a une position, mettre à jour la location
      if (updatedStatus.latitude && updatedStatus.longitude) {
        const locationSuccess = await updateDriverLocation(updatedStatus.latitude, updatedStatus.longitude);
        if (!locationSuccess) {
          toast.warning('Position mise à jour partiellement');
        }
      } else if (updatedStatus.isOnline) {
        // Si on va en ligne sans position, utiliser une position par défaut
        const defaultLat = -4.3217;
        const defaultLng = 15.3069;
        const locationSuccess = await updateDriverLocation(defaultLat, defaultLng);
        if (locationSuccess) {
          updatedStatus.latitude = defaultLat;
          updatedStatus.longitude = defaultLng;
        }
      }

      setStatus(updatedStatus);
      
      if (updatedStatus.isOnline) {
        toast.success('Statut chauffeur mis à jour');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, status, updateDriverLocation]);

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