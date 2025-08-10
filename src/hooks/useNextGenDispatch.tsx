// Hook pour le système de dispatch nouvelle génération
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { intelligentDispatch } from '@/services/intelligentDispatchService';
import { robustNotifications } from '@/services/robustNotificationService';
import { useMasterLocation } from '@/hooks/useMasterLocation';
import { toast } from 'sonner';

interface NextGenDispatchState {
  isSearching: boolean;
  availableDrivers: any[];
  selectedDriver: any | null;
  estimatedPrice: number;
  surgeMultiplier: number;
  estimatedArrival: number;
  currentLocation: { lat: number; lng: number } | null;
  city: string | null;
  error: string | null;
}

interface DispatchRequest {
  pickup_location: string;
  pickup_coordinates: { lat: number; lng: number };
  destination?: string;
  destination_coordinates?: { lat: number; lng: number };
  service_type: 'transport' | 'delivery' | 'marketplace';
  vehicle_class?: string;
  priority?: 'normal' | 'high' | 'urgent';
}

export const useNextGenDispatch = () => {
  const { user } = useAuth();
  const [state, setState] = useState<NextGenDispatchState>({
    isSearching: false,
    availableDrivers: [],
    selectedDriver: null,
    estimatedPrice: 0,
    surgeMultiplier: 1.0,
    estimatedArrival: 0,
    currentLocation: null,
    city: null,
    error: null
  });

  // Utiliser MasterLocation unifié
  const {
    location: masterLocation,
    loading: locationLoading,
    error: locationError,
    getCurrentPosition,
    hasLocation,
    isHighAccuracy
  } = useMasterLocation({
    autoDetectLocation: true,
    enableHighAccuracy: true,
    fallbackToIP: true,
    fallbackToDatabase: true
  });

  // Synchroniser l'état avec MasterLocation
  useEffect(() => {
    if (masterLocation) {
      setState(prev => ({
        ...prev,
        currentLocation: {
          lat: masterLocation.lat,
          lng: masterLocation.lng
        },
        city: masterLocation.address.split(',')[0] || null,
        loading: false
      }));
    }
    
    if (locationError) {
      setState(prev => ({
        ...prev,
        error: locationError,
        loading: false
      }));
    }
  }, [masterLocation, locationError]);

  // Lancer une recherche de chauffeurs intelligente
  const searchDrivers = useCallback(async (request: DispatchRequest) => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setState(prev => ({
      ...prev,
      isSearching: true,
      error: null,
      availableDrivers: [],
      selectedDriver: null
    }));

    try {
      console.log('🚀 Lancement recherche next-gen:', request);

      // Utiliser le système de dispatch intelligent
      const result = await intelligentDispatch.dispatchRequest({
        pickup_location: request.pickup_coordinates,
        destination_location: request.destination_coordinates,
        service_type: request.service_type,
        vehicle_class: request.vehicle_class || 'standard',
        priority: request.priority || 'normal',
        customer_id: user.id
      });

      if (result.success && result.assigned_driver) {
        // Chauffeur trouvé et assigné
        setState(prev => ({
          ...prev,
          isSearching: false,
          selectedDriver: result.assigned_driver,
          availableDrivers: result.alternatives || [],
          estimatedPrice: result.estimated_price || 0,
          surgeMultiplier: result.surge_multiplier || 1.0,
          estimatedArrival: result.estimated_arrival || 0
        }));

        toast.success(`Chauffeur trouvé ! Arrivée estimée: ${result.estimated_arrival} min`);

        // Notifier le chauffeur
        await robustNotifications.sendNotification({
          user_id: result.assigned_driver.driver_id,
          title: '🎯 Nouvelle course assignée',
          message: `${request.pickup_location} → ${request.destination || 'Destination à confirmer'}`,
          type: 'ride_request',
          priority: request.priority === 'urgent' ? 'urgent' : 'high',
          data: {
            request_id: user.id,
            pickup_coordinates: request.pickup_coordinates,
            destination_coordinates: request.destination_coordinates,
            estimated_price: result.estimated_price
          },
          sound: true,
          vibration: true
        });

      } else {
        // Aucun chauffeur trouvé
        setState(prev => ({
          ...prev,
          isSearching: false,
          error: result.error || 'Aucun chauffeur disponible'
        }));

        toast.error(result.error || 'Aucun chauffeur disponible dans votre zone');
      }

    } catch (error: any) {
      console.error('Erreur recherche chauffeurs:', error);
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error.message
      }));

      toast.error('Erreur lors de la recherche de chauffeurs');
    }
  }, [user]);

  // Recherche alternative avec rayon élargi
  const searchWithExpandedRadius = useCallback(async (request: DispatchRequest) => {
    setState(prev => ({ ...prev, isSearching: true }));

    try {
      // Relancer avec priorité élevée et rayon max
      const expandedRequest = {
        ...request,
        priority: 'high' as const,
        max_distance: 20 // 20km
      };

      const result = await intelligentDispatch.dispatchRequest({
        pickup_location: request.pickup_coordinates,
        destination_location: request.destination_coordinates,
        service_type: request.service_type,
        vehicle_class: request.vehicle_class || 'standard',
        priority: expandedRequest.priority,
        customer_id: user?.id || '',
        max_distance: expandedRequest.max_distance
      });

      if (result.success) {
        setState(prev => ({
          ...prev,
          isSearching: false,
          availableDrivers: result.alternatives || [],
          estimatedPrice: result.estimated_price || 0,
          surgeMultiplier: result.surge_multiplier || 1.0
        }));

        toast.success(`${result.alternatives?.length || 0} chauffeurs trouvés dans un rayon élargi`);
      } else {
        setState(prev => ({
          ...prev,
          isSearching: false,
          error: 'Aucun chauffeur trouvé même avec un rayon élargi'
        }));
      }

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error.message
      }));
    }
  }, [user]);

  // Sélectionner manuellement un chauffeur
  const selectDriver = useCallback((driver: any) => {
    setState(prev => ({
      ...prev,
      selectedDriver: driver
    }));

    toast.success(`Chauffeur sélectionné: ${driver.rating}⭐`);
  }, []);

  // Annuler la recherche
  const cancelSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSearching: false,
      availableDrivers: [],
      selectedDriver: null,
      error: null
    }));

    toast.info('Recherche annulée');
  }, []);

  // Obtenir les métriques de performance
  const getPerformanceMetrics = useCallback(async () => {
    try {
      const [dispatchMetrics, notificationMetrics] = await Promise.all([
        intelligentDispatch.getDispatchMetrics(),
        robustNotifications.getDeliveryStats()
      ]);

      return {
        dispatch: dispatchMetrics,
        notifications: notificationMetrics,
        location_accuracy: masterLocation?.accuracy || 0,
        is_high_accuracy: isHighAccuracy
      };
    } catch (error) {
      console.error('Erreur métriques:', error);
      return null;
    }
  }, []);

  // Obtenir l'estimation de prix en temps réel
  const getPriceEstimate = useCallback(async (
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    serviceType: string = 'transport'
  ) => {
    try {
      // Calcul rapide basé sur la distance
      const distance = calculateDistance(pickup.lat, pickup.lng, destination.lat, destination.lng);
      const basePrice = serviceType === 'delivery' ? 1500 : 2000;
      const pricePerKm = serviceType === 'delivery' ? 250 : 300;
      
      const estimatedPrice = basePrice + (distance * pricePerKm);
      
      return {
        distance,
        estimatedPrice,
        surgeMultiplier: state.surgeMultiplier,
        finalPrice: Math.round(estimatedPrice * state.surgeMultiplier)
      };
    } catch (error) {
      console.error('Erreur calcul prix:', error);
      return null;
    }
  }, [state.surgeMultiplier]);

  return {
    // State
    ...state,
    
    // Actions
    searchDrivers,
    searchWithExpandedRadius,
    selectDriver,
    cancelSearch,
    
    // Utils
    getPerformanceMetrics,
    getPriceEstimate,
    
    // Status
    hasLocation: hasLocation,
    isHighAccuracy: isHighAccuracy,
    retryQueueSize: robustNotifications.getRetryQueueSize()
  };
};

// Utility function
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}