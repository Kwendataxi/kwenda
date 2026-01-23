/**
 * 📍 Hook de Tracking Temps Réel du Chauffeur
 * Suivi de la position du chauffeur avec calcul d'ETA dynamique
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeTrackingData, DriverLocationUpdate } from '@/types/map';
import { toast } from 'sonner';

interface UseRealtimeDriverTrackingOptions {
  bookingId: string;
  clientPosition: { lat: number; lng: number };
  updateInterval?: number; // ms
  autoCenter?: boolean;
}

export const useRealtimeDriverTracking = ({
  bookingId,
  clientPosition,
  updateInterval = 3000,
  autoCenter = true
}: UseRealtimeDriverTrackingOptions) => {
  const [trackingData, setTrackingData] = useState<RealtimeTrackingData>({
    driverLocation: null,
    eta: null,
    distance: null,
    isMoving: false,
    lastUpdate: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);

  // Calculer la distance Haversine entre deux points
  const calculateDistance = useCallback((
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculer l'ETA basé sur la distance et vitesse moyenne
  const calculateETA = useCallback((distanceKm: number, averageSpeedKmh: number = 30): number => {
    // Vitesse moyenne en ville africaine: 20-40 km/h
    const hours = distanceKm / averageSpeedKmh;
    return Math.round(hours * 60); // Convertir en minutes
  }, []);

  // Récupérer le driver_id depuis la réservation
  const fetchDriverId = useCallback(async () => {
    try {
      const { data, error: bookingError } = await supabase
        .from('transport_bookings')
        .select('driver_id')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      
      if (data?.driver_id) {
        setDriverId(data.driver_id);
        console.log('🚗 Driver ID trouvé:', data.driver_id);
      } else {
        console.warn('⚠️ Aucun chauffeur assigné pour cette réservation');
      }
    } catch (err) {
      console.error('❌ Erreur récupération driver_id:', err);
      setError('Impossible de trouver le chauffeur');
    }
  }, [bookingId]);

  // Récupérer la position du chauffeur
  const fetchDriverLocation = useCallback(async () => {
    if (!driverId) return;

    try {
      const { data, error: locationError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (locationError) {
        console.error('❌ Erreur location chauffeur:', locationError);
        return;
      }

      if (data && data.latitude && data.longitude) {
        const driverLocation: DriverLocationUpdate = {
          lat: data.latitude,
          lng: data.longitude,
          heading: data.heading,
          speed: data.speed,
          timestamp: data.updated_at,
          is_online: data.is_online,
          is_available: data.is_available
        };

        // Calculer distance et ETA
        const distance = calculateDistance(
          clientPosition.lat,
          clientPosition.lng,
          driverLocation.lat,
          driverLocation.lng
        );

        const eta = calculateETA(distance, driverLocation.speed || 30);

        // Déterminer si le chauffeur est en mouvement
        const isMoving = (driverLocation.speed || 0) > 0.5;

        setTrackingData({
          driverLocation,
          eta,
          distance,
          isMoving,
          lastUpdate: new Date()
        });

        setIsLoading(false);
        setError(null);

        console.log(`📍 Position chauffeur mise à jour - Distance: ${distance.toFixed(2)}km, ETA: ${eta}min`);
      }
    } catch (err) {
      console.error('❌ Erreur tracking:', err);
      setError('Erreur lors du suivi du chauffeur');
    }
  }, [driverId, clientPosition, calculateDistance, calculateETA]);

  // Initialisation: récupérer le driver_id
  useEffect(() => {
    fetchDriverId();
  }, [fetchDriverId]);

  // Polling régulier de la position
  useEffect(() => {
    if (!driverId) return;

    // Première récupération immédiate
    fetchDriverLocation();

    // Mise à jour périodique
    const interval = setInterval(fetchDriverLocation, updateInterval);

    return () => clearInterval(interval);
  }, [driverId, fetchDriverLocation, updateInterval]);

  // Abonnement temps réel Supabase
  useEffect(() => {
    if (!driverId) return;

    console.log('🔔 Abonnement temps réel activé pour driver:', driverId);

    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          console.log('📡 Position chauffeur mise à jour en temps réel:', payload);
          fetchDriverLocation();
          
          // Notification si le chauffeur est proche
          if (trackingData.distance && trackingData.distance < 0.5) {
            toast.info('Votre chauffeur arrive dans moins de 500m !', {
              duration: 5000
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Désabonnement du tracking temps réel');
      supabase.removeChannel(channel);
    };
  }, [driverId, fetchDriverLocation, trackingData.distance]);

  // Notification quand le chauffeur arrive
  useEffect(() => {
    if (trackingData.distance && trackingData.distance < 0.1) {
      toast.success('Votre chauffeur est arrivé ! 🎉', {
        duration: 10000
      });
    }
  }, [trackingData.distance]);

  return {
    ...trackingData,
    isLoading,
    error,
    refresh: fetchDriverLocation
  };
};
