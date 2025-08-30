import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { LocationData } from '@/types/location';
import { advancedGeolocation, type GeolocationError } from '@/services/advancedGeolocation';

interface LocationState {
  currentLocation: LocationData | null;
  isLocationEnabled: boolean;
  isLoading: boolean;
  city: string;
  country: string;
  lastError: GeolocationError | null;
}

interface UseMasterLocationReturn {
  currentLocation: LocationData | null;
  isLocationEnabled: boolean;
  isLoading: boolean;
  city: string;
  country: string;
  lastError: GeolocationError | null;
  getCurrentLocation: () => Promise<LocationData | null>;
  searchLocation: (query: string) => Promise<any[]>;
  watchLocation: (callback: (location: LocationData) => void) => number | null;
  stopWatching: (watchId: number) => void;
  requestLocationPermission: () => Promise<boolean>;
  reverseGeocode: (lat: number, lng: number) => Promise<string | null>;
  clearCache: () => void;
  getCacheStats: () => any;
}

export const useMasterLocation = (): UseMasterLocationReturn => {
  const [state, setState] = useState<LocationState>({
    currentLocation: null,
    isLocationEnabled: false,
    isLoading: false,
    city: 'Kinshasa',
    country: 'RDC',
    lastError: null
  });

  const { toast } = useToast();

  // Vérifier si la géolocalisation est supportée
  useEffect(() => {
    const isSupported = advancedGeolocation.isGeolocationSupported();
    setState(prev => ({ ...prev, isLocationEnabled: isSupported }));
    
    if (!isSupported) {
      console.log('❌ Géolocalisation non supportée');
    }
  }, []);

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    if (!state.isLocationEnabled) {
      console.warn('⚠️ Géolocalisation non disponible');
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, lastError: null }));

    try {
      console.log('📍 Demande de géolocalisation avancée...');

      const locationData = await advancedGeolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
        useCache: true,
        maxRetries: 3
      });

      setState(prev => ({ 
        ...prev, 
        currentLocation: locationData,
        isLoading: false,
        lastError: null
      }));

      toast({
        title: "Position détectée",
        description: `📍 ${locationData.address}`,
      });

      return locationData;
    } catch (error: any) {
      console.error('❌ Erreur géolocalisation avancée:', error);
      
      const geolocationError = error as GeolocationError;
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        lastError: geolocationError
      }));

      toast({
        title: "Géolocalisation échouée",
        description: geolocationError.message,
        variant: "destructive"
      });

      return null;
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      return await advancedGeolocation.reverseGeocodeWithCache(lat, lng);
    } catch (error) {
      console.error('❌ Erreur géocodage inverse:', error);
      return null;
    }
  };

  const watchLocation = (callback: (location: LocationData) => void) => {
    if (!state.isLocationEnabled) {
      console.warn('⚠️ Géolocalisation non disponible pour le suivi');
      return null;
    }

    console.log('👁️ Démarrage du suivi de position avancé...');

    const watchId = advancedGeolocation.watchPosition(
      (location) => {
        setState(prev => ({ ...prev, currentLocation: location }));
        callback(location);
      },
      (error) => {
        console.error('❌ Erreur suivi position:', error);
        setState(prev => ({ ...prev, lastError: error }));
        
        toast({
          title: "Erreur de suivi",
          description: error.message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000, // 1 minute
        useCache: true
      }
    );

    return watchId;
  };

  const stopWatching = (watchId: number) => {
    advancedGeolocation.stopWatching(watchId);
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      
      if (result.state === 'granted') {
        setState(prev => ({ ...prev, isLocationEnabled: true }));
        return true;
      } else if (result.state === 'prompt') {
        // L'utilisateur sera invité lors de getCurrentLocation()
        return true;
      } else {
        toast({
          title: "Permission requise",
          description: "Veuillez autoriser l'accès à votre position",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur vérification permission:', error);
      return false;
    }
  };

  // Fonction de recherche de lieux avec suggestions locales enrichies
  const searchLocation = async (query: string): Promise<any[]> => {
    // Base de données enrichie pour Kinshasa et RDC
    const locations = [
      // Zones principales de Kinshasa
      { address: `${query}, Gombe, Kinshasa`, lat: -4.3167, lng: 15.3167, type: 'district' },
      { address: `${query}, Kinshasa Centre`, lat: -4.3217, lng: 15.3069, type: 'centre' },
      { address: `${query}, Lemba, Kinshasa`, lat: -4.3833, lng: 15.2833, type: 'district' },
      { address: `${query}, Matete, Kinshasa`, lat: -4.3833, lng: 15.3333, type: 'district' },
      { address: `${query}, Ngaliema, Kinshasa`, lat: -4.3667, lng: 15.2667, type: 'district' },
      { address: `${query}, Bandalungwa, Kinshasa`, lat: -4.3833, lng: 15.3000, type: 'district' },
      
      // Lieux populaires
      { address: `${query}, Boulevard du 30 Juin, Kinshasa`, lat: -4.3208, lng: 15.3069, type: 'landmark' },
      { address: `${query}, Marché Central, Kinshasa`, lat: -4.3250, lng: 15.3100, type: 'market' },
      { address: `${query}, Université de Kinshasa`, lat: -4.4333, lng: 15.3000, type: 'university' }
    ];
    
    return locations.slice(0, 5); // Limiter à 5 résultats
  };

  const clearCache = () => {
    advancedGeolocation.clearCache();
    toast({
      title: "Cache effacé",
      description: "Toutes les données de localisation ont été supprimées",
    });
  };

  const getCacheStats = () => {
    return advancedGeolocation.getCacheStats();
  };

  return {
    currentLocation: state.currentLocation,
    isLocationEnabled: state.isLocationEnabled,
    isLoading: state.isLoading,
    city: state.city,
    country: state.country,
    lastError: state.lastError,
    getCurrentLocation,
    searchLocation,
    watchLocation,
    stopWatching,
    requestLocationPermission,
    reverseGeocode,
    clearCache,
    getCacheStats
  };
};