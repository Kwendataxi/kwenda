/**
 * Hook sécurisé pour la géolocalisation des chauffeurs
 * Remplace l'ancien système qui exposait les coordonnées exactes
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  secureDriverLocationService, 
  type SecureDriverInfo, 
  type DriverSummary,
  type UseSecureDriverLocationOptions,
  type UseSecureDriverLocationReturn 
} from '@/services/secureDriverLocationService';

export const useSecureDriverLocation = (
  options: UseSecureDriverLocationOptions = {}
): UseSecureDriverLocationReturn => {
  const {
    autoSearch = false,
    maxDistance = 5,
    vehicleClass,
    refreshInterval = 30000 // 30 secondes
  } = options;

  const [drivers, setDrivers] = useState<SecureDriverInfo[]>([]);
  const [summary, setSummary] = useState<DriverSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null);
  const [searchLimits, setSearchLimits] = useState({ remaining: 10, resetTime: new Date() });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier l'authentification au montage
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await secureDriverLocationService.isUserAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const limits = await secureDriverLocationService.getUserSearchLimits();
        setSearchLimits(limits);
      }
    };
    
    checkAuth();
  }, []);

  // Recherche sécurisée de chauffeurs à proximité
  const searchNearbyDrivers = useCallback(async (
    lat: number, 
    lng: number, 
    searchOptions?: { maxDistance?: number; vehicleClass?: string }
  ) => {
    if (!isAuthenticated) {
      setError('Connexion requise pour rechercher des chauffeurs');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Recherche sécurisée de chauffeurs à proximité');
      
      const nearbyDrivers = await secureDriverLocationService.findNearbyDriversSecure(
        lat,
        lng,
        searchOptions?.maxDistance ?? maxDistance,
        searchOptions?.vehicleClass ?? vehicleClass
      );

      setDrivers(nearbyDrivers);
      setLastSearchTime(new Date());

      // Mettre à jour les limites de recherche
      const limits = await secureDriverLocationService.getUserSearchLimits();
      setSearchLimits(limits);

      console.log(`✅ ${nearbyDrivers.length} chauffeurs trouvés de manière sécurisée`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la recherche';
      setError(errorMessage);
      console.error('❌ Erreur lors de la recherche sécurisée:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, maxDistance, vehicleClass]);

  // Actualiser le résumé des chauffeurs disponibles
  const refreshSummary = useCallback(async () => {
    try {
      setError(null);
      const summaryData = await secureDriverLocationService.getAvailableDriversSummary();
      setSummary(summaryData);
      console.log('✅ Résumé des chauffeurs actualisé');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du résumé';
      setError(errorMessage);
      console.error('❌ Erreur lors du refresh du résumé:', err);
    }
  }, []);

  // Signaler un problème de sécurité
  const reportSecurityIssue = useCallback(async (issue: any) => {
    try {
      await secureDriverLocationService.reportSecurityIssue(issue);
      console.log('✅ Problème de sécurité signalé');
    } catch (err) {
      console.error('❌ Erreur lors du signalement:', err);
      throw err;
    }
  }, []);

  // Charger le résumé au montage
  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  // Actualisation automatique du résumé
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refreshSummary, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshSummary, refreshInterval]);

  // Recherche automatique si activée et géolocalisation disponible
  useEffect(() => {
    if (autoSearch && isAuthenticated && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          searchNearbyDrivers(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('⚠️ Géolocalisation non disponible pour la recherche automatique:', error);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    }
  }, [autoSearch, isAuthenticated, searchNearbyDrivers]);

  return {
    drivers,
    summary,
    isLoading,
    error,
    lastSearchTime,
    searchLimits,
    searchNearbyDrivers,
    refreshSummary,
    reportSecurityIssue,
    isAuthenticated
  };
};