/**
 * 🎯 HOOK POUR GÉOLOCALISATION RÉELLE DES CHAUFFEURS
 * 
 * Remplace les anciens hooks de géolocalisation par un système unifié
 * qui utilise des adresses Google Maps réelles
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { realLocationService, driverLocationAdapter } from '@/services/realLocationService';
import type { RealDriverLocation } from '@/types/realLocation';

interface UseRealDriverLocationProps {
  driverId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseRealDriverLocationReturn {
  driverLocation: RealDriverLocation | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  lastUpdate: string | null;
  googleAddress: string | null;
  isOnline: boolean;
  isAvailable: boolean;
}

export const useRealDriverLocation = ({
  driverId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 secondes par défaut
}: UseRealDriverLocationProps): UseRealDriverLocationReturn => {
  const [driverLocation, setDriverLocation] = useState<RealDriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge la position du chauffeur depuis Supabase et la convertit en adresse réelle
   */
  const loadDriverLocation = useCallback(async () => {
    if (!driverId) {
      setError('ID chauffeur requis');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer la position depuis Supabase
      const { data: locationData, error: locationError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .maybeSingle();

      if (locationError) {
        throw new Error(`Erreur Supabase: ${locationError.message}`);
      }

      if (!locationData) {
        throw new Error('Position du chauffeur non trouvée');
      }

      // Convertir vers le nouveau format avec adresse Google réelle
      const realLocation = await driverLocationAdapter.fromLegacy(locationData);
      setDriverLocation(realLocation);

    } catch (err: any) {
      console.error('useRealDriverLocation: Error loading driver location:', err);
      setError(err.message || 'Erreur lors du chargement de la position');
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  /**
   * Met à jour la position en temps réel
   */
  const refreshLocation = useCallback(async () => {
    await loadDriverLocation();
  }, [loadDriverLocation]);

  // Chargement initial
  useEffect(() => {
    loadDriverLocation();
  }, [loadDriverLocation]);

  // Abonnement temps réel aux changements de position
  useEffect(() => {
    if (!driverId) return;

    const channel = supabase
      .channel(`real-driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`,
        },
        async (payload) => {
          try {
            // Convertir la nouvelle position en adresse réelle
            const realLocation = await driverLocationAdapter.fromLegacy(payload.new);
            setDriverLocation(realLocation);
          } catch (err) {
            console.error('useRealDriverLocation: Error processing realtime update:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  // Refresh automatique périodique
  useEffect(() => {
    if (!autoRefresh || !driverId) return;

    const interval = setInterval(() => {
      refreshLocation();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, driverId, refreshLocation]);

  // Nettoyage du cache expiré toutes les 5 minutes
  useEffect(() => {
    const cacheCleanup = setInterval(() => {
      realLocationService.clearExpiredCache();
    }, 5 * 60 * 1000);

    return () => clearInterval(cacheCleanup);
  }, []);

  return {
    driverLocation,
    loading,
    error,
    refreshLocation,
    lastUpdate: driverLocation?.lastUpdate || null,
    googleAddress: driverLocation?.googleAddress || null,
    isOnline: driverLocation?.status.isOnline || false,
    isAvailable: driverLocation?.status.isAvailable || false,
  };
};

/**
 * Hook simplifié pour récupérer uniquement l'adresse Google d'un chauffeur
 */
export const useDriverGoogleAddress = (driverId: string) => {
  const { driverLocation, loading, error } = useRealDriverLocation({
    driverId,
    autoRefresh: false,
  });

  return {
    googleAddress: driverLocation?.googleAddress || null,
    placeName: driverLocation?.googlePlaceName || null,
    loading,
    error,
  };
};

/**
 * Hook pour suivre plusieurs chauffeurs en temps réel
 */
export const useMultipleDriverLocations = (driverIds: string[]) => {
  const [driversLocations, setDriversLocations] = useState<Map<string, RealDriverLocation>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (driverIds.length === 0) {
      setLoading(false);
      return;
    }

    const loadAllDrivers = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: locationsData, error: locationsError } = await supabase
          .from('driver_locations')
          .select('*')
          .in('driver_id', driverIds);

        if (locationsError) {
          throw new Error(`Erreur Supabase: ${locationsError.message}`);
        }

        const locationsMap = new Map<string, RealDriverLocation>();

        // Convertir chaque position en adresse réelle
        for (const locationData of locationsData || []) {
          try {
            const realLocation = await driverLocationAdapter.fromLegacy(locationData);
            locationsMap.set(realLocation.driverId, realLocation);
          } catch (err) {
            console.warn('Failed to convert driver location:', err);
          }
        }

        setDriversLocations(locationsMap);
      } catch (err: any) {
        console.error('useMultipleDriverLocations: Error:', err);
        setError(err.message || 'Erreur lors du chargement des positions');
      } finally {
        setLoading(false);
      }
    };

    loadAllDrivers();
  }, [driverIds]);

  return {
    driversLocations,
    loading,
    error,
  };
};