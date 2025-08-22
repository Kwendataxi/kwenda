import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { LocationData } from '@/types/location';

interface LocationState {
  currentLocation: LocationData | null;
  isLocationEnabled: boolean;
  isLoading: boolean;
  city: string;
  country: string;
}

export const useMasterLocation = () => {
  const [state, setState] = useState<LocationState>({
    currentLocation: null,
    isLocationEnabled: false,
    isLoading: false,
    city: 'Kinshasa',
    country: 'RDC'
  });

  const { toast } = useToast();

  // Vérifier si la géolocalisation est supportée
  useEffect(() => {
    const isSupported = 'geolocation' in navigator;
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

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('📍 Demande de géolocalisation...');

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;

      console.log('✅ Position obtenue:', { latitude, longitude, accuracy });

      // Géocodage inverse pour obtenir l'adresse
      const address = await reverseGeocode(latitude, longitude);

      const locationData: LocationData = {
        lat: latitude,
        lng: longitude,
        address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        type: 'current',
        accuracy: accuracy || undefined
      };

      setState(prev => ({ 
        ...prev, 
        currentLocation: locationData,
        isLoading: false 
      }));

      toast({
        title: "Position détectée",
        description: `📍 ${locationData.address}`,
      });

      return locationData;
    } catch (error: any) {
      console.error('❌ Erreur géolocalisation:', error);
      
      let errorMessage = 'Impossible d\'obtenir votre position';
      
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = 'Accès à la localisation refusé';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = 'Position indisponible';
          break;
        case 3: // TIMEOUT
          errorMessage = 'Délai de localisation dépassé';
          break;
      }

      toast({
        title: "Géolocalisation échouée",
        description: errorMessage,
        variant: "destructive"
      });

      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      console.log('🔍 Géocodage inverse:', { lat, lng });

      // Utiliser l'edge function geocode-proxy pour éviter les problèmes CORS
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reverse',
          lat,
          lng
        })
      });

      if (!response.ok) {
        throw new Error('Erreur géocodage');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        console.log('✅ Adresse trouvée:', address);
        return address;
      }

      // Fallback avec noms de lieux connus pour Kinshasa/RDC
      return getFallbackAddress(lat, lng);
    } catch (error) {
      console.error('❌ Erreur géocodage inverse:', error);
      return getFallbackAddress(lat, lng);
    }
  };

  const getFallbackAddress = (lat: number, lng: number): string => {
    // Coordonnées approximatives des zones principales de Kinshasa
    const zones = [
      { name: 'Gombe', center: [-4.3167, 15.3167], radius: 0.02 },
      { name: 'Kinshasa Centre', center: [-4.4167, 15.3167], radius: 0.03 },
      { name: 'Lemba', center: [-4.3833, 15.2833], radius: 0.03 },
      { name: 'Matete', center: [-4.3833, 15.3333], radius: 0.03 },
      { name: 'Ngaliema', center: [-4.3667, 15.2667], radius: 0.03 },
      { name: 'Bandalungwa', center: [-4.3833, 15.3000], radius: 0.02 }
    ];

    // Trouver la zone la plus proche
    let closestZone = 'Kinshasa';
    let minDistance = Infinity;

    zones.forEach(zone => {
      const distance = Math.sqrt(
        Math.pow(lat - zone.center[0], 2) + Math.pow(lng - zone.center[1], 2)
      );
      
      if (distance < zone.radius && distance < minDistance) {
        minDistance = distance;
        closestZone = zone.name;
      }
    });

    return `${closestZone}, Kinshasa, RDC`;
  };

  const watchLocation = (callback: (location: LocationData) => void) => {
    if (!state.isLocationEnabled) {
      console.warn('⚠️ Géolocalisation non disponible pour le suivi');
      return null;
    }

    console.log('👁️ Démarrage du suivi de position...');

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        const address = await reverseGeocode(latitude, longitude);
        
        const locationData: LocationData = {
          lat: latitude,
          lng: longitude,
          address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          type: 'current',
          accuracy: accuracy || undefined
        };

        setState(prev => ({ ...prev, currentLocation: locationData }));
        callback(locationData);
      },
      (error) => {
        console.error('❌ Erreur suivi position:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000 // 1 minute
      }
    );

    return watchId;
  };

  const stopWatching = (watchId: number) => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      console.log('🛑 Arrêt du suivi de position');
    }
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

  return {
    ...state,
    getCurrentLocation,
    getCurrentPosition: getCurrentLocation, // Alias for compatibility
    watchLocation,
    stopWatching,
    requestLocationPermission,
    reverseGeocode
  };
};