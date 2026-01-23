/**
 * 🎯 Hook Unifié pour le Statut du Chauffeur
 * PHASE 1: Source de vérité unique pour l'état du chauffeur
 * 
 * Fusionne:
 * - useSimplifiedDriverStatus
 * - useUnifiedDispatcher.dispatchStatus
 * - useDriverData.isOnline
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDriverGeolocation } from './useDriverGeolocation';
import { useActiveDriverOrders } from './useActiveDriverOrders';

export type DriverState = 'offline' | 'online_available' | 'online_busy' | 'in_ride';

export interface DriverStatus {
  state: DriverState;
  isOnline: boolean;
  isAvailable: boolean;
  latitude?: number;
  longitude?: number;
  serviceTypes: string[];
  vehicleClass: string;
  lastUpdate?: Date;
  activeOrderId?: string;
  activeOrderType?: 'taxi' | 'delivery' | 'marketplace';
}

export const useDriverStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<DriverStatus>({
    state: 'offline',
    isOnline: false,
    isAvailable: false,
    serviceTypes: ['taxi', 'delivery'],
    vehicleClass: 'standard',
  });
  const [loading, setLoading] = useState(false);
  const [optimisticUpdate, setOptimisticUpdate] = useState<Partial<DriverStatus> | null>(null);

  // 🎯 PHASE 3: Géolocalisation unifiée avec auto-sync
  const { 
    location, 
    getCurrentPosition, 
    startWatching, 
    stopWatching,
    syncing 
  } = useDriverGeolocation({
    autoSync: true, // Auto-sync avec DB toutes les 30s
    syncInterval: 30000,
    batterySaving: false,
  });

  // 🎯 PHASE 3: Commandes actives pour déterminer si occupé
  const { isBusy, hasActiveOrders } = useActiveDriverOrders();

  // Charger le statut initial depuis la DB
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
          const driverState = calculateDriverState(data.is_online, data.is_available, false);
          
          setStatus({
            state: driverState,
            isOnline: data.is_online,
            isAvailable: data.is_available,
            latitude: data.latitude,
            longitude: data.longitude,
            vehicleClass: data.vehicle_class || 'standard',
            serviceTypes: ['taxi', 'delivery'],
            lastUpdate: new Date(data.updated_at)
          });
        }
      } catch (error) {
        console.error('Error loading initial status:', error);
      }
    };

    loadInitialStatus();
  }, [user]);

  // Calculer l'état du chauffeur
  const calculateDriverState = (
    isOnline: boolean, 
    isAvailable: boolean, 
    hasActiveOrder: boolean
  ): DriverState => {
    if (!isOnline) return 'offline';
    // 🎯 PHASE 3: Utiliser isBusy de useActiveDriverOrders
    if (hasActiveOrder || isBusy) return 'in_ride';
    if (!isAvailable) return 'online_busy';
    return 'online_available';
  };

  // ✅ Mutation optimiste avec rollback
  const updateStatus = useCallback(async (newStatus: Partial<DriverStatus>) => {
    if (!user) {
      toast.error('Utilisateur non connecté');
      return false;
    }

    setLoading(true);
    
    // Sauvegarde pour rollback
    const previousStatus = { ...status };
    
    try {
      // 1. Update optimiste immédiat
      const updatedStatus = { ...status, ...newStatus, lastUpdate: new Date() };
      setStatus(updatedStatus);
      setOptimisticUpdate(newStatus);
      
      // 2. Calculer le nouvel état
      const newState = calculateDriverState(
        updatedStatus.isOnline,
        updatedStatus.isAvailable,
        !!updatedStatus.activeOrderId
      );
      
      // 3. Mettre à jour dans driver_locations (source de vérité unique)
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
        // ❌ Rollback en cas d'erreur
        console.error('Error updating driver status:', error);
        setStatus(previousStatus);
        setOptimisticUpdate(null);
        
        toast.error('Erreur lors de la mise à jour du statut');
        return false;
      }

      // ✅ Succès - confirmation
      setOptimisticUpdate(null);
      setStatus(prev => ({ ...prev, state: newState }));
      
      // Feedback approprié
      if (newStatus.isOnline !== undefined) {
        if (newStatus.isOnline) {
          toast.success('✅ Vous êtes en ligne');
        } else {
          toast.info('🔴 Vous êtes hors ligne');
        }
      }
      
      return true;
    } catch (error) {
      // ❌ Rollback en cas d'exception
      console.error('Exception updating driver status:', error);
      setStatus(previousStatus);
      setOptimisticUpdate(null);
      toast.error('Erreur technique');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, status]);

  // ✅ Mettre à jour la position GPS
  const updateDriverLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!user || !status.isOnline) return false;

    try {
      const { error } = await supabase
        .from('driver_locations')
        .update({
          latitude,
          longitude,
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('driver_id', user.id);

      if (error) {
        console.error('Error updating location:', error);
        return false;
      }

      setStatus(prev => ({ ...prev, latitude, longitude }));
      return true;
    } catch (error) {
      console.error('Exception updating location:', error);
      return false;
    }
  }, [user, status.isOnline]);

  // ✅ Passer en ligne
  const goOnline = useCallback(async (latitude?: number, longitude?: number) => {
    // 🎯 PHASE 3: Démarrer le tracking GPS automatiquement
    await getCurrentPosition(true); // Force GPS refresh
    startWatching();
    
    return updateStatus({
      isOnline: true,
      isAvailable: true,
      latitude: latitude || location?.latitude,
      longitude: longitude || location?.longitude,
    });
  }, [updateStatus, getCurrentPosition, startWatching, location]);

  // ✅ Passer hors ligne
  const goOffline = useCallback(async () => {
    // 🎯 PHASE 3: Arrêter le tracking GPS automatiquement
    stopWatching();
    
    return updateStatus({
      isOnline: false,
      isAvailable: false,
    });
  }, [updateStatus, stopWatching]);

  // ✅ Changer la disponibilité
  const setAvailable = useCallback(async (isAvailable: boolean) => {
    if (!status.isOnline && isAvailable) {
      toast.warning('Vous devez être en ligne pour être disponible');
      return false;
    }
    return updateStatus({ isAvailable });
  }, [status.isOnline, updateStatus]);

  // ✅ Marquer comme occupé (course active)
  const markBusy = useCallback(async (orderId: string, orderType: 'taxi' | 'delivery' | 'marketplace') => {
    return updateStatus({ 
      isAvailable: false,
      activeOrderId: orderId,
      activeOrderType: orderType
    });
  }, [updateStatus]);

  // ✅ Marquer comme disponible (course terminée)
  const markAvailable = useCallback(async () => {
    return updateStatus({ 
      isAvailable: true,
      activeOrderId: undefined,
      activeOrderType: undefined
    });
  }, [updateStatus]);

  // ✅ Changer les types de service
  const updateServiceTypes = useCallback(async (serviceTypes: string[]) => {
    return updateStatus({ serviceTypes });
  }, [updateStatus]);

  // ✅ Synchronisation temps réel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`driver-status-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_locations',
        filter: `driver_id=eq.${user.id}`
      }, (payload) => {
        const data = payload.new as any;
        if (data) {
          const newState = calculateDriverState(data.is_online, data.is_available, !!status.activeOrderId);
          
          setStatus(prev => ({
            ...prev,
            state: newState,
            isOnline: data.is_online,
            isAvailable: data.is_available,
            latitude: data.latitude,
            longitude: data.longitude,
            vehicleClass: data.vehicle_class,
            lastUpdate: new Date(data.updated_at)
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, status.activeOrderId]);

  return {
    status,
    loading,
    isOptimistic: !!optimisticUpdate,
    updateStatus,
    updateDriverLocation,
    goOnline,
    goOffline,
    setAvailable,
    markBusy,
    markAvailable,
    updateServiceTypes,
    // 🎯 PHASE 3: Exposer états GPS et commandes
    gpsLocation: location,
    gpsSyncing: syncing,
    hasActiveOrders,
    isBusy,
  };
};
