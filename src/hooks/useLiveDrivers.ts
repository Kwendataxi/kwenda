/**
 * 🚗 Hook pour afficher les chauffeurs en temps réel sur la carte
 * Subscription Supabase Realtime + calcul de distance
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LiveDriver {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  is_online: boolean;
  is_available: boolean;
  last_ping: string;
  driver_name?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
}

interface UseLiveDriversOptions {
  userLocation: { lat: number; lng: number } | null;
  maxRadius?: number; // en km
  showOnlyAvailable?: boolean;
  updateInterval?: number; // en ms
}

export const useLiveDrivers = ({
  userLocation,
  maxRadius = 10,
  showOnlyAvailable = true,
  updateInterval = 10000
}: UseLiveDriversOptions) => {
  const [liveDrivers, setLiveDrivers] = useState<LiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcul de distance Haversine
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Charger les chauffeurs disponibles
  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Récupérer les chauffeurs actifs (ping < 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('driver_locations')
        .select(`
          *,
          driver_profiles!inner(
            user_id,
            display_name,
            vehicle_model,
            vehicle_plate
          )
        `)
        .eq('is_online', true)
        .gte('last_ping', fiveMinutesAgo);

      if (showOnlyAvailable) {
        query = query.eq('is_available', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!data) {
        setLiveDrivers([]);
        return;
      }

      // Filtrer par distance si position utilisateur fournie
      const driversWithInfo: LiveDriver[] = data.map((location: any) => ({
        id: location.id,
        driver_id: location.driver_id,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        is_online: location.is_online,
        is_available: location.is_available,
        last_ping: location.last_ping,
        driver_name: location.driver_profiles?.display_name,
        vehicle_model: location.driver_profiles?.vehicle_model,
        vehicle_plate: location.driver_profiles?.vehicle_plate
      }));

      let filteredDrivers = driversWithInfo;

      if (userLocation) {
        filteredDrivers = driversWithInfo.filter((driver) => {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            driver.latitude,
            driver.longitude
          );
          return distance <= maxRadius;
        });
      }

      setLiveDrivers(filteredDrivers);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur chargement chauffeurs:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [userLocation, maxRadius, showOnlyAvailable]);

  // Initialisation et polling
  useEffect(() => {
    loadDrivers();
    
    const interval = setInterval(loadDrivers, updateInterval);
    
    return () => clearInterval(interval);
  }, [loadDrivers, updateInterval]);

  // Subscription temps réel pour les mises à jour de position
  useEffect(() => {
    const channel = supabase
      .channel('live-drivers-tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: 'is_online=eq.true'
        },
        (payload) => {
          console.log('🔄 Mise à jour position chauffeur:', payload);
          
          // Recharger les données pour avoir les infos complètes
          loadDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDrivers]);

  return {
    liveDrivers,
    loading,
    error,
    driversCount: liveDrivers.length,
    refresh: loadDrivers
  };
};
