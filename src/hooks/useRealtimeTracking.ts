import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackingState {
  isTracking: boolean;
  currentLocation: { lat: number; lng: number } | null;
  error: string | null;
  lastUpdate: Date | null;
  accuracy: number | null;
}

interface TrackingOptions {
  updateInterval?: number;
  highAccuracy?: boolean;
  maxAge?: number;
  timeout?: number;
}

export function useRealtimeTracking() {
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    currentLocation: null,
    error: null,
    lastUpdate: null,
    accuracy: null
  });

  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);
  const optionsRef = useRef<TrackingOptions>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const positionBufferRef = useRef<Array<{ lat: number; lng: number; timestamp: number; accuracy: number }>>([]);

  // Optimisation batterie: réduire la fréquence selon la vitesse
  const [adaptiveInterval, setAdaptiveInterval] = useState(10000);
  const lastPositionRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);

  const calculateSpeed = useCallback((newPos: { lat: number; lng: number }, timestamp: number) => {
    if (!lastPositionRef.current) {
      lastPositionRef.current = { ...newPos, timestamp };
      return 0;
    }

    const last = lastPositionRef.current;
    const timeDiff = (timestamp - last.timestamp) / 1000; // en secondes
    
    if (timeDiff < 1) return 0; // Éviter les calculs sur de très petites durées

    // Calcul de la distance (formule haversine simplifiée)
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (newPos.lat - last.lat) * Math.PI / 180;
    const dLng = (newPos.lng - last.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(last.lat * Math.PI / 180) * Math.cos(newPos.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // en mètres

    const speed = distance / timeDiff; // m/s
    lastPositionRef.current = { ...newPos, timestamp };
    
    return speed;
  }, []);

  // Adapter la fréquence selon la vitesse
  const updateTrackingInterval = useCallback((speed: number) => {
    let newInterval;
    
    if (speed < 1) { // Stationnaire ou marche lente (< 3.6 km/h)
      newInterval = 30000; // 30 secondes
    } else if (speed < 5) { // Marche rapide/vélo (< 18 km/h)
      newInterval = 15000; // 15 secondes  
    } else if (speed < 15) { // Véhicule urbain (< 54 km/h)
      newInterval = 5000; // 5 secondes
    } else { // Véhicule rapide
      newInterval = 2000; // 2 secondes
    }

    if (newInterval !== adaptiveInterval) {
      setAdaptiveInterval(newInterval);
      console.log(`📱 Interval adapté: ${newInterval}ms (vitesse: ${(speed * 3.6).toFixed(1)} km/h)`);
    }
  }, [adaptiveInterval]);

  // Mise à jour de position avec buffer et compression
  const updatePosition = useCallback(async (position: GeolocationPosition) => {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy || 0,
      timestamp: Date.now()
    };

    // Calculer la vitesse et adapter l'interval
    const speed = calculateSpeed(newLocation, newLocation.timestamp);
    updateTrackingInterval(speed);

    // Ajouter au buffer
    positionBufferRef.current.push(newLocation);

    // Limiter la taille du buffer
    if (positionBufferRef.current.length > 20) {
      positionBufferRef.current = positionBufferRef.current.slice(-10);
    }

    setState(prev => ({
      ...prev,
      currentLocation: { lat: newLocation.lat, lng: newLocation.lng },
      lastUpdate: new Date(),
      accuracy: newLocation.accuracy,
      error: null
    }));

    // Envoyer la position via Supabase seulement si changement significatif
    const shouldUpdate = !lastPositionRef.current || 
                        speed > 0.5 || // En mouvement
                        Date.now() - (lastPositionRef.current?.timestamp || 0) > 60000; // Ou toutes les minutes

    if (shouldUpdate) {
      try {
        const { error } = await supabase
          .from('driver_locations')
          .upsert({
            driver_id: (await supabase.auth.getUser()).data.user?.id,
            latitude: newLocation.lat,
            longitude: newLocation.lng,
            accuracy: newLocation.accuracy,
            last_ping: new Date().toISOString(),
            is_online: true
          });

        if (error) {
          console.error('❌ Erreur mise à jour position:', error);
        } else {
          console.log('📍 Position mise à jour:', { lat: newLocation.lat, lng: newLocation.lng, accuracy: newLocation.accuracy });
        }
      } catch (updateError) {
        console.error('❌ Erreur réseau position:', updateError);
        // Ne pas afficher d'erreur pour éviter le spam
      }
    }
  }, [calculateSpeed, updateTrackingInterval]);

  // Reconnexion automatique
  const setupReconnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Tentative de reconnexion au tracking...');
      if (state.isTracking) {
        stopTracking();
        setTimeout(() => startTracking(optionsRef.current), 1000);
      }
    }, 30000); // Reconnexion après 30 secondes
  }, [state.isTracking]);

  const startTracking = useCallback(async (options: TrackingOptions = {}) => {
    console.log('🚀 Démarrage du tracking temps réel');
    
    optionsRef.current = options;

    if (!navigator.geolocation) {
      const error = 'Géolocalisation non supportée';
      setState(prev => ({ ...prev, error }));
      toast.error(error);
      return;
    }

    // Vérifier les permissions
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        const error = 'Permission de géolocalisation refusée';
        setState(prev => ({ ...prev, error }));
        toast.error(error);
        return;
      }
    } catch (permError) {
      console.warn('Impossible de vérifier les permissions:', permError);
    }

    setState(prev => ({ ...prev, isTracking: true, error: null }));

    const trackingOptions: PositionOptions = {
      enableHighAccuracy: options.highAccuracy ?? true,
      timeout: options.timeout || 15000,
      maximumAge: options.maxAge || 10000
    };

    // Démarrer le watch GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      updatePosition,
      (error) => {
        console.error('❌ Erreur tracking GPS:', error);
        
        let errorMessage = 'Erreur de géolocalisation';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permission de géolocalisation refusée';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position non disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Timeout de géolocalisation';
            setupReconnection(); // Essayer de reconnecter
            return; // Ne pas arrêter le tracking pour un timeout
        }

        setState(prev => ({ ...prev, error: errorMessage }));
      },
      trackingOptions
    );

    // Configurer les mises à jour temps réel Supabase
    setupRealtimeConnection();

  }, [updatePosition, setupReconnection]);

  const setupRealtimeConnection = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel('driver-tracking')
      .on('presence', { event: 'sync' }, () => {
        console.log('📡 Connexion temps réel synchronisée');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 Nouveau chauffeur connecté:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 Chauffeur déconnecté:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const user = (await supabase.auth.getUser()).data.user;
          if (user) {
            // S'enregistrer comme présent
            await channelRef.current?.track({
              driver_id: user.id,
              online_at: new Date().toISOString(),
              status: 'tracking'
            });
            console.log('📡 Connecté au canal temps réel');
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Erreur canal temps réel, reconnexion...');
          setupReconnection();
        }
      });
  }, [setupReconnection]);

  const stopTracking = useCallback(async () => {
    console.log('🛑 Arrêt du tracking temps réel');
    
    setState(prev => ({ ...prev, isTracking: false }));

    // Arrêter le GPS watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Nettoyer les timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Déconnecter le canal temps réel
    if (channelRef.current) {
      await channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Marquer le chauffeur comme hors ligne
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        await supabase
          .from('driver_locations')
          .update({ 
            is_online: false,
            last_ping: new Date().toISOString()
          })
          .eq('driver_id', user.id);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise hors ligne:', error);
    }

    // Nettoyer les refs
    positionBufferRef.current = [];
    lastPositionRef.current = null;
  }, []);

  // Obtenir les chauffeurs proches
  const getNearbyDrivers = useCallback(async (radius: number = 5): Promise<any[]> => {
    if (!state.currentLocation) return [];

    try {
      const { data, error } = await supabase.rpc('find_nearby_drivers', {
        pickup_lat: state.currentLocation.lat,
        pickup_lng: state.currentLocation.lng,
        radius_km: radius
      });

      if (error) {
        console.error('❌ Erreur recherche chauffeurs proches:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur réseau chauffeurs proches:', error);
      return [];
    }
  }, [state.currentLocation]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
    getNearbyDrivers,
    adaptiveInterval,
    positionBuffer: positionBufferRef.current
  };
}