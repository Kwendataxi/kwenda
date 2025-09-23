/**
 * Hook optimisé pour le tracking de localisation mobile avec gestion de batterie
 * Utilise les APIs natives Capacitor pour un tracking longue durée
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';
// import { BackgroundMode } from '@capacitor/background-mode'; // Module non disponible
import { Device } from '@capacitor/device';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';

export interface BatteryOptimizedTrackingOptions {
  enableBackgroundMode?: boolean;
  accuracyLevel?: 'high' | 'balanced' | 'low_power';
  updateIntervalMs?: number;
  distanceFilterMeters?: number;
  enableBatteryOptimization?: boolean;
  showNotification?: boolean;
  maxLocationAge?: number;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface TrackingStats {
  totalUpdates: number;
  batteryUsage: number;
  activeTimeMs: number;
  lastUpdate?: Date;
}

export function useBatteryOptimizedTracking(options: BatteryOptimizedTrackingOptions = {}) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TrackingStats>({
    totalUpdates: 0,
    batteryUsage: 0,
    activeTimeMs: 0
  });
  const [batteryLevel, setBatteryLevel] = useState<number>(100);

  const watchIdRef = useRef<string | null>(null);
  const lastLocationRef = useRef<LocationUpdate | null>(null);
  const startTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);

  // Configuration par défaut selon le niveau d'accuracy
  const getTrackingOptions = useCallback((): PositionOptions => {
    const { accuracyLevel = 'balanced' } = options;
    
    const configs = {
      high: {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      },
      balanced: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      },
      low_power: {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60000
      }
    };

    return configs[accuracyLevel];
  }, [options.accuracyLevel]);

  // Initialiser les permissions et la surveillance de batterie
  useEffect(() => {
    initializeBatteryMonitoring();
    return () => {
      if (watchIdRef.current) {
        stopTracking();
      }
    };
  }, []);

  const initializeBatteryMonitoring = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Surveiller le niveau de batterie
        const info = await Device.getBatteryInfo();
        setBatteryLevel(info.batteryLevel || 100);
        
        // Vérifier le niveau toutes les minutes
        setInterval(async () => {
          const info = await Device.getBatteryInfo();
          setBatteryLevel(info.batteryLevel || 100);
        }, 60000);
      }
    } catch (error) {
      console.warn('Impossible de surveiller la batterie:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // Demander permissions de géolocalisation
      const locationPermission = await Geolocation.requestPermissions();
      
      if (locationPermission.location !== 'granted') {
        setError('Permission de géolocalisation refusée');
        return false;
      }

      // Demander permission pour mode arrière-plan si nécessaire
      if (options.enableBackgroundMode && Capacitor.isNativePlatform()) {
        try {
          // BackgroundMode.requestPermissions(); // Module non disponible
          
          // Demander permission pour notifications
          if (options.showNotification) {
            await LocalNotifications.requestPermissions();
          }
        } catch (bgError) {
          console.warn('Permissions arrière-plan non disponibles:', bgError);
        }
      }

      return true;
    } catch (error) {
      setError(`Erreur permissions: ${error}`);
      return false;
    }
  };

  const shouldUpdateLocation = (newLocation: LocationUpdate): boolean => {
    if (!lastLocationRef.current) return true;

    const { distanceFilterMeters = 10 } = options;
    const lastLoc = lastLocationRef.current;
    
    // Calculer distance
    const distance = calculateDistance(
      lastLoc.latitude, lastLoc.longitude,
      newLocation.latitude, newLocation.longitude
    );

    return distance >= distanceFilterMeters;
  };

  const optimizeForBattery = (location: LocationUpdate): boolean => {
    if (!options.enableBatteryOptimization) return true;

    // Réduire la fréquence si batterie faible
    if (batteryLevel < 20) {
      const timeSinceLastUpdate = Date.now() - (lastLocationRef.current?.timestamp || 0);
      return timeSinceLastUpdate >= (options.updateIntervalMs || 30000) * 3;
    }

    if (batteryLevel < 50) {
      const timeSinceLastUpdate = Date.now() - (lastLocationRef.current?.timestamp || 0);
      return timeSinceLastUpdate >= (options.updateIntervalMs || 30000) * 1.5;
    }

    return true;
  };

  const handleLocationUpdate = useCallback(async (position: Position) => {
    const locationUpdate: LocationUpdate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      timestamp: position.timestamp
    };

    // Vérifier les filtres d'optimisation
    if (!shouldUpdateLocation(locationUpdate) || !optimizeForBattery(locationUpdate)) {
      return;
    }

    setCurrentLocation(locationUpdate);
    lastLocationRef.current = locationUpdate;
    updateCountRef.current += 1;

    // Mettre à jour les statistiques
    setStats(prev => ({
      ...prev,
      totalUpdates: updateCountRef.current,
      activeTimeMs: Date.now() - startTimeRef.current,
      lastUpdate: new Date(),
      batteryUsage: Math.max(0, 100 - batteryLevel)
    }));

    // Sauvegarder en base si conducteur
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase
          .from('driver_locations')
          .upsert({
            driver_id: user.user.id,
            latitude: locationUpdate.latitude,
            longitude: locationUpdate.longitude,
            accuracy: locationUpdate.accuracy,
            speed: locationUpdate.speed,
            heading: locationUpdate.heading,
            last_ping: new Date().toISOString(),
            is_online: true,
            is_available: true,
            updated_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Erreur sauvegarde position:', error);
    }

    setError(null);
  }, [options, batteryLevel]);

  const handleLocationError = useCallback((error: any) => {
    console.error('Erreur géolocalisation:', error);
    setError(`Erreur localisation: ${error.message}`);
  }, []);

  const startTracking = async (): Promise<boolean> => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return false;

      // Activer le mode arrière-plan si demandé
      if (options.enableBackgroundMode && Capacitor.isNativePlatform()) {
        // await BackgroundMode.enable(); // Module non disponible
        
        if (options.showNotification) {
          await LocalNotifications.schedule({
            notifications: [{
              title: 'Kwenda - Tracking actif',
              body: 'Votre position est suivie en arrière-plan',
              id: 1
            }]
          });
        }
      }

      startTimeRef.current = Date.now();
      updateCountRef.current = 0;

      // Démarrer le suivi
      const watchId = await Geolocation.watchPosition(
        getTrackingOptions(),
        handleLocationUpdate
      );

      watchIdRef.current = watchId;
      setIsTracking(true);
      setError(null);

      return true;
    } catch (error) {
      setError(`Erreur démarrage tracking: ${error}`);
      return false;
    }
  };

  const stopTracking = async () => {
    try {
      if (watchIdRef.current) {
        await Geolocation.clearWatch({ id: watchIdRef.current });
        watchIdRef.current = null;
      }

      // Désactiver le mode arrière-plan
      if (options.enableBackgroundMode && Capacitor.isNativePlatform()) {
        // await BackgroundMode.disable(); // Module non disponible
        
        if (options.showNotification) {
          await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
        }
      }

      setIsTracking(false);
      
      // Marquer comme hors ligne en base
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await supabase
            .from('driver_locations')
            .update({
              is_online: false,
              last_ping: new Date().toISOString()
            })
            .eq('driver_id', user.user.id);
        }
      } catch (error) {
        console.error('Erreur mise à jour statut offline:', error);
      }

    } catch (error) {
      setError(`Erreur arrêt tracking: ${error}`);
    }
  };

  const getCurrentPosition = async (): Promise<LocationUpdate | null> => {
    try {
      const position = await Geolocation.getCurrentPosition(getTrackingOptions());
      
      const locationUpdate: LocationUpdate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
        timestamp: position.timestamp
      };

      setCurrentLocation(locationUpdate);
      return locationUpdate;
    } catch (error) {
      setError(`Erreur position actuelle: ${error}`);
      return null;
    }
  };

  return {
    isTracking,
    currentLocation,
    error,
    stats,
    batteryLevel,
    startTracking,
    stopTracking,
    getCurrentPosition,
    clearError: () => setError(null)
  };
}

// Fonction utilitaire pour calculer la distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Rayon de la Terre en mètres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}