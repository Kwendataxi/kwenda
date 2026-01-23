import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook automatique pour maintenir le heartbeat du chauffeur
 * Mise à jour de last_ping toutes les 2 minutes avec géolocalisation
 * CRITIQUE pour la détection de disponibilité dans find_nearby_drivers
 */
export const useDriverHeartbeat = () => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const updateHeartbeat = async () => {
    if (!user) return;

    try {
      // Récupérer la position actuelle
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache 1 minute
        });
      });

      const newPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Ne mettre à jour que si la position a changé significativement (>10m)
      const shouldUpdate = !lastPositionRef.current ||
        Math.abs(lastPositionRef.current.lat - newPosition.lat) > 0.0001 ||
        Math.abs(lastPositionRef.current.lng - newPosition.lng) > 0.0001;

      if (shouldUpdate) {
        const { error } = await supabase
          .from('driver_locations')
          .update({
            latitude: newPosition.lat,
            longitude: newPosition.lng,
            last_ping: new Date().toISOString(),
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            updated_at: new Date().toISOString()
          })
          .eq('driver_id', user.id);

        if (error) {
          console.warn('❌ Heartbeat update failed:', error);
        } else {
          console.log('✅ Heartbeat updated:', {
            lat: newPosition.lat,
            lng: newPosition.lng,
            timestamp: new Date().toISOString()
          });
          lastPositionRef.current = newPosition;
        }
      } else {
        // Juste mettre à jour le timestamp sans changer la position
        await supabase
          .from('driver_locations')
          .update({ last_ping: new Date().toISOString() })
          .eq('driver_id', user.id);

        console.log('⏰ Heartbeat ping (position unchanged)');
      }
    } catch (error) {
      console.warn('⚠️ Heartbeat error:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Première mise à jour immédiate
    updateHeartbeat();

    // Puis toutes les 2 minutes
    intervalRef.current = setInterval(updateHeartbeat, 2 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  return { updateHeartbeat };
};
