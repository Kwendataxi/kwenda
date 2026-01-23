/**
 * 📍 Hook de géolocalisation chauffeur
 * Gère la position GPS temps réel (foreground + background)
 */

import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

interface UseDriverGeolocationOptions {
  autoSync?: boolean; // Synchroniser automatiquement avec la DB
  syncInterval?: number; // Intervalle de sync en ms (défaut: 10s)
}

export const useDriverGeolocation = (options: UseDriverGeolocationOptions = {}) => {
  const { autoSync = false, syncInterval = 10000 } = options;
  const { user } = useAuth();
  
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<string | null>(null);

  /**
   * Obtenir la position actuelle une seule fois
   */
  const getCurrentPosition = useCallback(async (): Promise<DriverLocation | null> => {
    setLoading(true);
    setError(null);

    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      const currentLocation: DriverLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      };

      setLocation(currentLocation);
      
      if (autoSync && user) {
        await syncLocationToDB(currentLocation);
      }

      return currentLocation;
    } catch (err: any) {
      const errorMsg = err.message || 'Impossible d\'obtenir la position GPS';
      setError(errorMsg);
      console.error('❌ Geolocation error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [autoSync, user]);

  /**
   * Synchroniser la position avec la base de données
   */
  const syncLocationToDB = async (loc: DriverLocation): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          heading: loc.heading || null,
          speed: loc.speed || null,
          accuracy: loc.accuracy,
          is_online: true,
          last_ping: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to sync location:', error);
      }
    } catch (err) {
      console.error('❌ Error syncing location:', err);
    }
  };

  /**
   * Démarrer le suivi continu de la position
   */
  const startWatching = useCallback(async (): Promise<void> => {
    if (watchId) {
      console.log('👀 Already watching position');
      return;
    }

    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            console.error('❌ Watch position error:', err);
            setError(err.message);
            return;
          }

          if (position) {
            const newLocation: DriverLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp
            };

            setLocation(newLocation);
            
            if (autoSync && user) {
              syncLocationToDB(newLocation);
            }
          }
        }
      );

      setWatchId(id);
      console.log('👀 Started watching position:', id);
    } catch (err: any) {
      console.error('❌ Failed to start watching:', err);
      setError(err.message);
    }
  }, [watchId, autoSync, user]);

  /**
   * Arrêter le suivi de la position
   */
  const stopWatching = useCallback(async (): Promise<void> => {
    if (!watchId) return;

    try {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
      console.log('⏹️ Stopped watching position');
    } catch (err: any) {
      console.error('❌ Failed to stop watching:', err);
    }
  }, [watchId]);

  /**
   * Démarrer le watch automatiquement si autoSync est activé
   */
  useEffect(() => {
    if (autoSync && user) {
      startWatching();
    }

    return () => {
      if (watchId) {
        stopWatching();
      }
    };
  }, [autoSync, user]);

  /**
   * Sync périodique si autoSync activé
   */
  useEffect(() => {
    if (!autoSync || !location || !user) return;

    const interval = setInterval(() => {
      syncLocationToDB(location);
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, location, user, syncInterval]);

  return {
    location,
    loading,
    error,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching: !!watchId
  };
};
