import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BackgroundTrackingOptions {
  distanceFilterMeters?: number; // min distance change to emit
  minIntervalMs?: number;        // throttle DB writes
}

interface LastLocation {
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  timestamp: number; // epoch ms
}

// Utility: Haversine distance in meters
function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000; // meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

export const useBackgroundTracking = (opts: BackgroundTrackingOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isTracking, setIsTracking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastLocation, setLastLocation] = useState<LastLocation | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const watcherIdRef = useRef<string | number | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const lastSentLocRef = useRef<{ lat: number; lon: number } | null>(null);

  const distanceFilter = opts.distanceFilterMeters ?? 25; // meters
  const minInterval = opts.minIntervalMs ?? 10_000; // 10s

  // Lazy load plugin (optional)
  const bgPluginRef = useRef<any>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Try cap-community plugin API
          const mod = await import('@capacitor-community/background-geolocation');
          bgPluginRef.current = (mod as any).BackgroundGeolocation;
          setSupported(true);
        } else {
          setSupported(false);
        }
      } catch (e) {
        console.warn('BackgroundGeolocation plugin not available, will fallback to Geolocation.watchPosition()', e);
        setSupported(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const stop = useCallback(async () => {
    try {
      if (watcherIdRef.current != null) {
        // Plugin watcher
        if (supported && bgPluginRef.current?.removeWatcher) {
          await bgPluginRef.current.removeWatcher({ id: watcherIdRef.current });
        } else {
          // Fallback: clear watchPosition
          await Geolocation.clearWatch({ id: watcherIdRef.current as string });
        }
      }
    } catch (e) {
      console.error('Error stopping background tracking', e);
    } finally {
      watcherIdRef.current = null;
      setIsTracking(false);
    }
  }, [supported]);

  const upsertDriverLocation = useCallback(
    async (loc: LastLocation) => {
      if (!user?.id) return;

      // Throttle + distance filter
      const now = Date.now();
      const prev = lastSentLocRef.current;
      const shouldSendByTime = now - lastSentAtRef.current >= minInterval;
      const shouldSendByDistance = !prev || haversineMeters({ lat: prev.lat, lon: prev.lon }, { lat: loc.latitude, lon: loc.longitude }) >= distanceFilter;

      if (!shouldSendByTime && !shouldSendByDistance) return;

      lastSentAtRef.current = now;
      lastSentLocRef.current = { lat: loc.latitude, lon: loc.longitude };

      const payload = {
        driver_id: user.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        heading: loc.heading ?? null,
        speed: loc.speed ?? null,
        accuracy: loc.accuracy ?? null,
        is_online: true,
        is_available: true,
        last_ping: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as const;

      try {
        const { data: updated, error: updateError } = await supabase
          .from('driver_locations')
          .update(payload)
          .eq('driver_id', user.id)
          .select('id');

        if (updateError) throw updateError;

        if (!updated || updated.length === 0) {
          const { error: insertError } = await supabase.from('driver_locations').insert(payload);
          if (insertError) throw insertError;
        }
      } catch (e: any) {
        console.error('Failed to persist driver location', e);
        setLastError(e?.message || 'Erreur de sauvegarde de position');
      }
    },
    [user?.id, distanceFilter, minInterval]
  );

  const start = useCallback(async () => {
    if (!user?.id) {
      toast({ title: 'Non connecté', description: 'Veuillez vous connecter pour activer le suivi.' });
      return;
    }

    try {
      setLastError(null);

      if (supported && bgPluginRef.current?.addWatcher) {
        // Community plugin flow
        const id = await bgPluginRef.current.addWatcher(
          {
            backgroundMessage: 'Le suivi Kwenda Taxi est actif en arrière-plan.',
            backgroundTitle: 'Suivi en cours',
            requestPermissions: true,
            stale: false,
            distanceFilter: distanceFilter,
            // Android accuracy hints
            // accuracy: 'high',
            // iOS allows always permission via user prompt
          },
          async (location: any, err: any) => {
            if (err) {
              console.error('BG location error', err);
              setLastError(err?.message || 'Erreur de localisation');
              return;
            }
            if (!location) return;

            const loc: LastLocation = {
              latitude: location.latitude,
              longitude: location.longitude,
              speed: location.speed ?? null,
              heading: location.bearing ?? location.heading ?? null,
              accuracy: location.accuracy ?? null,
              timestamp: Date.now(),
            };
            setLastLocation(loc);
            await upsertDriverLocation(loc);
          }
        );
        watcherIdRef.current = id;
      } else {
        // Fallback to foreground watchPosition (limited in background)
        const perm = await Geolocation.requestPermissions({ permissions: ['location'] as any });
        const id = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            maximumAge: 5_000,
            timeout: 20_000,
          },
          async (pos: Position | null, err) => {
            if (err) {
              console.error('watchPosition error', err);
              setLastError((err as any)?.message || 'Erreur de localisation');
              return;
            }
            if (!pos?.coords) return;
            const { latitude, longitude, speed, heading, accuracy } = pos.coords;
            const loc: LastLocation = {
              latitude,
              longitude,
              speed: speed ?? null,
              heading: heading ?? null,
              accuracy: accuracy ?? null,
              timestamp: Date.now(),
            };
            setLastLocation(loc);
            await upsertDriverLocation(loc);
          }
        );
        watcherIdRef.current = id as any;
      }

      setIsTracking(true);
      toast({ title: 'Suivi activé', description: "Votre position est partagée en arrière-plan." });
    } catch (e: any) {
      console.error('Error starting background tracking', e);
      setIsTracking(false);
      setLastError(e?.message || 'Impossible de démarrer le suivi');
      toast({ title: 'Erreur', description: 'Impossible d\'activer le suivi', variant: 'destructive' });
    }
  }, [supported, toast, upsertDriverLocation, user?.id]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stop();
    };
  }, [stop]);

  return {
    isTracking,
    supported,
    lastLocation,
    lastError,
    start,
    stop,
  } as const;
};
