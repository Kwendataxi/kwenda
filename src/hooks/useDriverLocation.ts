/**
 * 📍 Hook de Géolocalisation Chauffeur Temps Réel
 * PHASE 5: Tracking GPS avec sync backend automatique
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useSmartGeolocation } from './useSmartGeolocation';
import { toast } from 'sonner';

interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseDriverLocationReturn {
  isTracking: boolean;
  currentLocation: DriverLocation | null;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  updateLocationNow: () => Promise<void>;
}

const SYNC_INTERVAL = 10000; // 10 secondes
const MAX_ACCURACY = 100; // Maximum 100m d'accuracy

export const useDriverLocation = (): UseDriverLocationReturn => {
  const { user } = useAuth();
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<DriverLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);

  /**
   * 📤 Sync location avec backend
   */
  const syncLocationToBackend = useCallback(async (location: DriverLocation) => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_online: true, // Le fait de tracker signifie qu'on est online
          is_available: true // Par défaut disponible (peut être modifié ailleurs)
        }, {
          onConflict: 'driver_id'
        });

      if (updateError) {
        console.error('❌ Erreur sync location:', updateError);
        throw updateError;
      }

      lastSyncRef.current = Date.now();
      console.log('✅ Position synced:', location.latitude.toFixed(6), location.longitude.toFixed(6));
      
    } catch (err) {
      console.error('Sync error:', err);
      setError('Erreur de synchronisation GPS');
    }
  }, [user]);

  /**
   * 📍 Callback quand la position change
   */
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const newLocation: DriverLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp
    };

    // Ne sync que si accuracy acceptable
    if (position.coords.accuracy <= MAX_ACCURACY) {
      setCurrentLocation(newLocation);
      setError(null);

      // Sync immédiatement si plus de 10s depuis dernier sync
      const timeSinceLastSync = Date.now() - lastSyncRef.current;
      if (timeSinceLastSync >= SYNC_INTERVAL) {
        syncLocationToBackend(newLocation);
      }
    } else {
      console.warn('⚠️ Position ignorée (accuracy trop faible):', position.coords.accuracy.toFixed(0), 'm');
    }
  }, [syncLocationToBackend]);

  /**
   * ⚠️ Callback en cas d'erreur
   */
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Erreur GPS';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permission GPS refusée. Activez la localisation dans les paramètres.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Position GPS indisponible. Vérifiez votre connexion.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Délai GPS dépassé. Réessayez.';
        break;
    }

    console.error('GPS Error:', errorMessage);
    setError(errorMessage);
    toast.error(errorMessage);
  }, []);

  /**
   * ▶️ Démarrer le tracking
   */
  const startTracking = useCallback(async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour activer le tracking GPS');
      return;
    }

    try {
      // 1. Obtenir position initiale via l'API native
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      handlePositionUpdate(position);

      // 2. Démarrer le watch en continu
      const watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
      watchIdRef.current = watchId;

      // 3. Sync périodique automatique
      syncIntervalRef.current = setInterval(() => {
        if (currentLocation) {
          syncLocationToBackend(currentLocation);
        }
      }, SYNC_INTERVAL);

      setIsTracking(true);
      toast.success('📍 Localisation activée');
      
    } catch (err: any) {
      handlePositionError(err);
    }
  }, [user, handlePositionUpdate, handlePositionError, currentLocation, syncLocationToBackend]);

  /**
   * ⏹️ Arrêter le tracking
   */
  const stopTracking = useCallback(async () => {
    // Clear watch GPS
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Clear sync interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    // Marquer comme offline dans la DB
    if (user) {
      await supabase
        .from('driver_locations')
        .update({
          is_online: false,
          is_available: false,
          last_ping: new Date().toISOString()
        })
        .eq('driver_id', user.id);
    }

    setIsTracking(false);
    setCurrentLocation(null);
    toast.info('📍 Localisation désactivée');
  }, [user]);

  /**
   * 🔄 Forcer un update immédiat
   */
  const updateLocationNow = useCallback(async () => {
    if (!isTracking) {
      toast.error('Le tracking GPS n\'est pas actif');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      handlePositionUpdate(position);
      await syncLocationToBackend({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
      toast.success('📍 Position mise à jour');
    } catch (err: any) {
      handlePositionError(err);
    }
  }, [isTracking, handlePositionUpdate, syncLocationToBackend, handlePositionError]);

  /**
   * 🧹 Cleanup au démontage
   */
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  return {
    isTracking,
    currentLocation,
    error,
    startTracking,
    stopTracking,
    updateLocationNow
  };
};
