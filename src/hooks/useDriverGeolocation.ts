/**
 * 🎯 HOOK GÉOLOCALISATION UNIFIÉ POUR CHAUFFEURS
 * 
 * Consolidation de tous les hooks de géolocalisation :
 * - useSimplifiedGeolocation
 * - useDriverLocationSync
 * - useBackgroundTracking
 * 
 * PHASE 3 - Optimisation
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { throttle } from '@/utils/performanceUtils';

interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

interface UseDriverGeolocationOptions {
  enableHighAccuracy?: boolean;
  autoSync?: boolean; // Auto-sync avec la DB toutes les 30s
  syncInterval?: number; // Intervalle de sync en ms
  batterySaving?: boolean; // Mode économie batterie
}

export const useDriverGeolocation = (options: UseDriverGeolocationOptions = {}) => {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    enableHighAccuracy = true,
    autoSync = false,
    syncInterval = 30000, // 30 secondes par défaut
    batterySaving = false,
  } = options;

  // Position par défaut Kinshasa
  const DEFAULT_POSITION: DriverLocation = {
    latitude: -4.3217,
    longitude: 15.3069,
    accuracy: 1000,
    timestamp: Date.now()
  };

  // ============================================
  // STOCKAGE LOCAL (CACHE)
  // ============================================

  const getStoredLocation = useCallback((): DriverLocation | null => {
    try {
      const stored = localStorage.getItem('driver_last_location');
      const timestamp = localStorage.getItem('driver_last_location_time');
      
      if (stored && timestamp) {
        const location = JSON.parse(stored);
        const time = parseInt(timestamp);
        
        // Cache valide 30 minutes
        if (Date.now() - time < 30 * 60 * 1000) {
          return { ...location, timestamp: time };
        }
      }
    } catch (err) {
      console.error('❌ Error reading stored location:', err);
    }
    return null;
  }, []);

  const storeLocation = useCallback((location: DriverLocation) => {
    try {
      localStorage.setItem('driver_last_location', JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed
      }));
      localStorage.setItem('driver_last_location_time', location.timestamp.toString());
    } catch (err) {
      console.error('❌ Error storing location:', err);
    }
  }, []);

  // ============================================
  // SYNC AVEC DATABASE (THROTTLED)
  // ============================================

  const syncWithDatabase = useCallback(
    throttle(async (loc: DriverLocation) => {
      setSyncing(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('⚠️ No user to sync location');
          return;
        }

        const { error: syncError } = await supabase
          .from('driver_locations')
          .upsert({
            driver_id: user.id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            heading: loc.heading,
            speed: loc.speed,
            last_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'driver_id'
          });

        if (syncError) {
          console.error('❌ Location sync error:', syncError);
        } else {
          console.log('✅ Location synced to DB');
        }
      } catch (err) {
        console.error('❌ Sync failed:', err);
      } finally {
        setSyncing(false);
      }
    }, 5000), // Throttle : max 1 sync toutes les 5 secondes
    []
  );

  // ============================================
  // OBTENIR POSITION GPS
  // ============================================

  const getCurrentPosition = useCallback(async (
    forceRefresh = false
  ): Promise<DriverLocation> => {
    setLoading(true);
    setError(null);

    try {
      // Utiliser cache si disponible et pas de forceRefresh
      if (!forceRefresh) {
        const stored = getStoredLocation();
        if (stored) {
          setLocation(stored);
          setLoading(false);
          return stored;
        }
      }

      // Vérifier support géolocalisation
      if (!navigator.geolocation) {
        throw new Error('GEOLOCATION_NOT_SUPPORTED');
      }

      // Paramètres GPS adaptatifs selon mode batterie
      const geoOptions: PositionOptions = {
        enableHighAccuracy: batterySaving ? false : enableHighAccuracy,
        timeout: batterySaving ? 10000 : 20000,
        maximumAge: batterySaving ? 60000 : (forceRefresh ? 0 : 5000),
      };

      // Obtenir position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, geoOptions);
      });

      const newLocation: DriverLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
        timestamp: Date.now(),
      };

      setLocation(newLocation);
      storeLocation(newLocation);
      setLoading(false);

      // Auto-sync si activé
      if (autoSync) {
        syncWithDatabase(newLocation);
      }

      return newLocation;

    } catch (err: any) {
      setLoading(false);
      
      let errorMessage = 'Erreur GPS';
      
      if (err.code === 1) {
        errorMessage = 'Permission GPS refusée';
      } else if (err.code === 2) {
        errorMessage = 'Signal GPS indisponible';
      } else if (err.code === 3) {
        errorMessage = 'Délai GPS dépassé';
      }

      setError(errorMessage);

      // Fallback : position stockée
      const stored = getStoredLocation();
      if (stored) {
        setLocation(stored);
        toast.warning('Position précédente utilisée');
        return stored;
      }

      // Dernier recours : position par défaut
      setLocation(DEFAULT_POSITION);
      toast.warning('Position par défaut (Kinshasa)');
      return DEFAULT_POSITION;
    }
  }, [
    enableHighAccuracy, 
    batterySaving, 
    autoSync, 
    getStoredLocation, 
    storeLocation, 
    syncWithDatabase
  ]);

  // ============================================
  // SUIVI CONTINU (WATCH POSITION)
  // ============================================

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return;
    }

    // Nettoyer watch existant
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: batterySaving ? false : enableHighAccuracy,
      timeout: 15000,
      maximumAge: batterySaving ? 30000 : 5000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: DriverLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
          timestamp: Date.now(),
        };

        setLocation(newLocation);
        storeLocation(newLocation);
        setError(null);

        // Auto-sync avec throttling
        if (autoSync) {
          syncWithDatabase(newLocation);
        }
      },
      (err) => {
        console.error('❌ Watch position error:', err);
        // Ne pas afficher d'erreur continue
      },
      geoOptions
    );

    console.log('📍 GPS tracking started');
  }, [
    enableHighAccuracy, 
    batterySaving, 
    autoSync, 
    storeLocation, 
    syncWithDatabase
  ]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log('📍 GPS tracking stopped');
    }
  }, []);

  // ============================================
  // AUTO-SYNC PÉRIODIQUE
  // ============================================

  useEffect(() => {
    if (autoSync && location) {
      // Sync périodique
      syncIntervalRef.current = setInterval(() => {
        getCurrentPosition(true); // Force refresh + sync
      }, syncInterval);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [autoSync, syncInterval, location, getCurrentPosition]);

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      stopWatching();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [stopWatching]);

  // ============================================
  // RETURN API
  // ============================================

  return {
    location,
    loading,
    error,
    syncing,
    getCurrentPosition,
    startWatching,
    stopWatching,
    syncWithDatabase: () => location && syncWithDatabase(location),
    hasStoredLocation: !!getStoredLocation(),
  };
};
