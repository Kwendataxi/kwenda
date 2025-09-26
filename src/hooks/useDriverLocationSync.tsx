/**
 * 🎯 SYNCHRONISATION AUTOMATIQUE POSITION CHAUFFEUR
 * 
 * Hook pour maintenir la position du chauffeur à jour en temps réel
 * avec optimisations batterie et cache intelligent
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

interface UseDriverLocationSyncOptions {
  enabled?: boolean;
  updateInterval?: number;
  highAccuracy?: boolean;
  minDistance?: number; // Distance minimale pour déclencher une mise à jour (mètres)
}

export function useDriverLocationSync({
  enabled = true,
  updateInterval = 10000, // 10 secondes par défaut
  highAccuracy = true,
  minDistance = 20 // 20 mètres
}: UseDriverLocationSyncOptions = {}) {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncCount, setSyncCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== FONCTION DE SYNCHRONISATION ====================
  
  const syncLocationToDatabase = useCallback(async (location: LocationData) => {
    if (!user || userRole !== 'chauffeur') return false;

    try {
      // Calculer la distance depuis la dernière position
      const shouldSync = !lastLocationRef.current || 
        calculateDistance(lastLocationRef.current, location) >= minDistance;

      if (!shouldSync) {
        console.log('🎯 Position inchangée, pas de sync nécessaire');
        return true;
      }

      console.log('📍 Synchronisation position chauffeur:', {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: Math.round(location.accuracy),
        speed: location.speed ? Math.round(location.speed * 3.6) + ' km/h' : 'N/A'
      });

      // Géocoder l'adresse via l'Edge Function
      let googleAddress = null;
      let googlePlaceName = null;
      let googlePlaceId = null;

      try {
        const { data: geocodeData } = await supabase.functions.invoke('geocode-proxy', {
          body: { 
            lat: location.latitude, 
            lng: location.longitude,
            language: 'fr'
          }
        });

        if (geocodeData?.results?.[0]) {
          const result = geocodeData.results[0];
          googleAddress = result.formatted_address;
          googlePlaceId = result.place_id;
          
          // Extraire le nom du lieu principal
          const nameComponent = result.address_components?.find((comp: any) => 
            comp.types.includes('point_of_interest') || 
            comp.types.includes('establishment') ||
            comp.types.includes('sublocality')
          );
          googlePlaceName = nameComponent?.long_name || null;
        }
      } catch (geocodeError) {
        console.warn('⚠️ Géocodage échoué, position brute enregistrée');
      }

      // Mise à jour en base avec upsert
      const { error: upsertError } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed || null,
          heading: location.heading || null,
          google_address: googleAddress,
          google_place_name: googlePlaceName,
          google_place_id: googlePlaceId,
          google_geocoded_at: googleAddress ? new Date().toISOString() : null,
          geocode_source: googleAddress ? 'google' : 'none',
          is_online: true,
          is_available: true,
          last_ping: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'driver_id'
        });

      if (upsertError) throw upsertError;

      // Mettre à jour les états locaux
      lastLocationRef.current = location;
      setCurrentLocation(location);
      setLastSyncTime(new Date());
      setSyncCount(prev => prev + 1);
      setError(null);

      return true;

    } catch (err) {
      console.error('❌ Erreur sync position:', err);
      setError(err instanceof Error ? err.message : 'Erreur de synchronisation');
      return false;
    }
  }, [user, userRole, minDistance]);

  // ==================== GESTION GÉOLOCALISATION ====================
  
  const startLocationTracking = useCallback(() => {
    if (!enabled || !user || userRole !== 'chauffeur') return false;

    // Vérifier les permissions d'abord
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée par ce navigateur');
      return false;
    }

    console.log('🚀 Démarrage tracking position chauffeur');

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 15000,
      maximumAge: 5000
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const location: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
        timestamp: position.timestamp
      };

      // Synchroniser immédiatement
      syncLocationToDatabase(location);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('❌ Erreur géolocalisation:', error);
      
      const errorMessages: Record<number, string> = {
        1: 'Permission géolocalisation refusée',
        2: 'Position indisponible',
        3: 'Timeout de géolocalisation'
      };
      
      setError(errorMessages[error.code] || 'Erreur de géolocalisation');
    };

    // Démarrer le watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    setIsTracking(true);
    setError(null);
    return true;

  }, [enabled, user, userRole, highAccuracy, syncLocationToDatabase]);

  const stopLocationTracking = useCallback(() => {
    console.log('🛑 Arrêt tracking position chauffeur');

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    setIsTracking(false);

    // Marquer comme hors ligne en base
    if (user && userRole === 'chauffeur') {
      supabase
        .from('driver_locations')
        .update({
          is_online: false,
          is_available: false,
          last_ping: new Date().toISOString()
        })
        .eq('driver_id', user.id)
        .then(() => console.log('✅ Marqué hors ligne'));
    }
  }, [user, userRole]);

  // ==================== FONCTIONS UTILITAIRES ====================
  
  const calculateDistance = useCallback((pos1: LocationData, pos2: LocationData): number => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLng = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const getTrackingStatus = useCallback(() => {
    if (!enabled) return 'disabled';
    if (error) return 'error';
    if (isTracking) return 'active';
    return 'inactive';
  }, [enabled, error, isTracking]);

  const getLastUpdateText = useCallback(() => {
    if (!lastSyncTime) return 'Jamais synchronisé';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `il y a ${diffSec}s`;
    if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)}min`;
    return `il y a ${Math.floor(diffSec / 3600)}h`;
  }, [lastSyncTime]);

  // ==================== EFFETS ====================
  
  // Démarrage/arrêt automatique selon les conditions
  useEffect(() => {
    if (enabled && user && userRole === 'chauffeur' && !isTracking) {
      startLocationTracking();
    } else if ((!enabled || userRole !== 'chauffeur') && isTracking) {
      stopLocationTracking();
    }

    return () => {
      if (isTracking) {
        stopLocationTracking();
      }
    };
  }, [enabled, user, userRole, isTracking, startLocationTracking, stopLocationTracking]);

  // Synchronisation périodique de sauvegarde
  useEffect(() => {
    if (isTracking && updateInterval > 0) {
      syncIntervalRef.current = setInterval(() => {
        if (currentLocation) {
          console.log('🔄 Sync périodique de sauvegarde');
          syncLocationToDatabase(currentLocation);
        }
      }, updateInterval);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [isTracking, updateInterval, currentLocation, syncLocationToDatabase]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  return {
    // État
    isTracking,
    currentLocation,
    lastSyncTime,
    syncCount,
    error,
    status: getTrackingStatus(),
    lastUpdateText: getLastUpdateText(),
    
    // Actions
    startTracking: startLocationTracking,
    stopTracking: stopLocationTracking,
    
    // Utilitaires
    calculateDistance
  };
}