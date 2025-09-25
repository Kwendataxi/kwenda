import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverStatus {
  isOnline: boolean;
  isAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
  serviceTypes: string[];
  vehicleClass: string;
  lastUpdate: Date | null;
}

interface UseUnifiedDriverTrackingOptions {
  enableBackgroundTracking?: boolean;
  updateInterval?: number; // en millisecondes
  accuracyThreshold?: number; // en mètres
  batteryOptimized?: boolean;
}

export const useUnifiedDriverTracking = (options: UseUnifiedDriverTrackingOptions = {}) => {
  const {
    enableBackgroundTracking = true,
    updateInterval = 30000, // 30 secondes par défaut
    accuracyThreshold = 50, // 50 mètres par défaut
    batteryOptimized = true
  } = options;

  const { toast } = useToast();
  const [status, setStatus] = useState<DriverStatus>({
    isOnline: false,
    isAvailable: false,
    latitude: null,
    longitude: null,
    serviceTypes: [],
    vehicleClass: 'standard',
    lastUpdate: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  
  // Refs pour gérer les timers et watchers
  const locationWatcherRef = useRef<number | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Fonction optimisée pour mettre à jour la position du chauffeur
  const updateDriverLocation = useCallback(async (latitude: number, longitude: number, forceUpdate = false) => {
    try {
      // Vérifier si la position a suffisamment changé (optimisation batterie)
      if (!forceUpdate && lastLocationRef.current && batteryOptimized) {
        const distance = calculateDistance(
          lastLocationRef.current.lat,
          lastLocationRef.current.lng,
          latitude,
          longitude
        );
        
        if (distance < accuracyThreshold) {
          console.log('📍 Position inchangée, pas de mise à jour nécessaire');
          return true;
        }
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Utilisateur non connecté');
      }

      const { error: updateError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.user.id,
          latitude,
          longitude,
          is_online: status.isOnline,
          is_available: status.isAvailable,
          vehicle_class: status.vehicleClass,
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour la référence de dernière position
      lastLocationRef.current = { lat: latitude, lng: longitude };
      
      setStatus(prev => ({
        ...prev,
        latitude,
        longitude,
        lastUpdate: new Date()
      }));

      console.log('📍 Position du chauffeur mise à jour:', { latitude, longitude });
      return true;

    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour de position:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    }
  }, [status.isOnline, status.isAvailable, status.vehicleClass, accuracyThreshold, batteryOptimized]);

  // Fonction pour calculer la distance entre deux points (en mètres)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Démarrer le tracking GPS
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return false;
    }

    // Options de géolocalisation optimisées pour la batterie
    const geoOptions: PositionOptions = {
      enableHighAccuracy: !batteryOptimized,
      timeout: batteryOptimized ? 15000 : 10000,
      maximumAge: batteryOptimized ? 60000 : 30000 // Cache plus long si optimisé
    };

    // Watcher de position continue
    locationWatcherRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateDriverLocation(latitude, longitude);
        setError(null);
      },
      (error) => {
        console.warn('⚠️ Erreur de géolocalisation:', error);
        setError(`Erreur GPS: ${error.message}`);
      },
      geoOptions
    );

    setTrackingEnabled(true);
    console.log('🎯 Tracking GPS démarré');
    return true;
  }, [updateDriverLocation, batteryOptimized]);

  // Arrêter le tracking GPS
  const stopLocationTracking = useCallback(() => {
    if (locationWatcherRef.current) {
      navigator.geolocation.clearWatch(locationWatcherRef.current);
      locationWatcherRef.current = null;
    }
    
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
    }
    
    setTrackingEnabled(false);
    console.log('🛑 Tracking GPS arrêté');
  }, []);

  // Fonction unifiée pour changer le statut du chauffeur
  const updateStatus = useCallback(async (newStatus: Partial<DriverStatus>) => {
    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Utilisateur non connecté');
      }

      const updatedStatus = { ...status, ...newStatus };

      const { error: updateError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.user.id,
          latitude: updatedStatus.latitude || -4.3217, // Défaut Kinshasa
          longitude: updatedStatus.longitude || 15.3069,
          is_online: updatedStatus.isOnline,
          is_available: updatedStatus.isAvailable,
          vehicle_class: updatedStatus.vehicleClass,
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        throw updateError;
      }

      setStatus({ ...updatedStatus, lastUpdate: new Date() });

      // Démarrer/arrêter le tracking selon le statut
      if (updatedStatus.isOnline && enableBackgroundTracking && !trackingEnabled) {
        startLocationTracking();
      } else if (!updatedStatus.isOnline && trackingEnabled) {
        stopLocationTracking();
      }

      toast({
        title: 'Statut mis à jour',
        description: `Vous êtes maintenant ${updatedStatus.isOnline ? 'en ligne' : 'hors ligne'}`,
      });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(errorMessage);
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [status, enableBackgroundTracking, trackingEnabled, startLocationTracking, stopLocationTracking, toast]);

  // Fonctions spécialisées pour les actions courantes
  const goOnline = useCallback(() => updateStatus({ isOnline: true, isAvailable: true }), [updateStatus]);
  const goOffline = useCallback(() => updateStatus({ isOnline: false, isAvailable: false }), [updateStatus]);
  const setAvailable = useCallback((isAvailable: boolean) => {
    if (!status.isOnline && isAvailable) {
      toast({
        title: 'Attention',
        description: 'Vous devez être en ligne pour être disponible',
        variant: 'destructive',
      });
      return Promise.resolve(false);
    }
    return updateStatus({ isAvailable });
  }, [status.isOnline, updateStatus, toast]);

  // Charger le statut initial au montage
  useEffect(() => {
    const loadInitialStatus = async () => {
      setLoading(true);
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data: driverLocation, error } = await supabase
          .from('driver_locations')
          .select('*')
          .eq('driver_id', user.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (driverLocation) {
          setStatus({
            isOnline: driverLocation.is_online || false,
            isAvailable: driverLocation.is_available || false,
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            serviceTypes: ['transport'], // TODO: récupérer depuis le profil
            vehicleClass: driverLocation.vehicle_class || 'standard',
            lastUpdate: driverLocation.updated_at ? new Date(driverLocation.updated_at) : null
          });

          // Démarrer le tracking si le chauffeur était en ligne
          if (driverLocation.is_online && enableBackgroundTracking) {
            startLocationTracking();
          }
        }

      } catch (err) {
        console.error('❌ Erreur lors du chargement du statut initial:', err);
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadInitialStatus();
  }, [enableBackgroundTracking, startLocationTracking]);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  return {
    status,
    loading,
    error,
    trackingEnabled,
    updateStatus,
    updateDriverLocation,
    goOnline,
    goOffline,
    setAvailable,
    startLocationTracking,
    stopLocationTracking
  };
};