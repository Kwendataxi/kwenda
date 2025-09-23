import { useState, useCallback, useRef, useEffect } from 'react';
import { LocationData, GeolocationOptions } from '@/types/location';
import { toast } from 'sonner';

interface EnhancedLocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  source: 'gps' | 'ip' | 'cache' | 'manual' | null;
  lastUpdate: Date | null;
}

interface CachedLocation {
  data: LocationData;
  timestamp: number;
  accuracy: number;
}

export function useEnhancedGeolocation() {
  const [state, setState] = useState<EnhancedLocationState>({
    location: null,
    loading: false,
    error: null,
    accuracy: null,
    source: null,
    lastUpdate: null
  });

  const watchIdRef = useRef<number | null>(null);
  const cacheRef = useRef<Map<string, CachedLocation>>(new Map());
  const lastPositionRef = useRef<GeolocationPosition | null>(null);

  // Cache des lieux populaires par ville
  const popularPlaces = useRef({
    'Kinshasa': [
      { name: 'Centre-ville de Kinshasa', lat: -4.3217, lng: 15.3069, accuracy: 100 },
      { name: 'Aéroport N\'djili', lat: -4.3856, lng: 15.4446, accuracy: 50 },
      { name: 'Université de Kinshasa', lat: -4.4043, lng: 15.2969, accuracy: 200 },
      { name: 'Marché Central', lat: -4.3190, lng: 15.3072, accuracy: 150 }
    ],
    'Lubumbashi': [
      { name: 'Centre-ville de Lubumbashi', lat: -11.6792, lng: 27.5294, accuracy: 100 },
      { name: 'Aéroport de Lubumbashi', lat: -11.5912, lng: 27.5308, accuracy: 50 }
    ],
    'Abidjan': [
      { name: 'Plateau Abidjan', lat: 5.3364, lng: -4.0267, accuracy: 100 },
      { name: 'Aéroport Félix Houphouët-Boigny', lat: 5.2539, lng: -3.9263, accuracy: 50 }
    ]
  });

  // Nettoyage du cache (expire après 5 minutes)
  const cleanCache = useCallback(() => {
    const now = Date.now();
    const expiry = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, cached] of cacheRef.current.entries()) {
      if (now - cached.timestamp > expiry) {
        cacheRef.current.delete(key);
      }
    }
  }, []);

  // Géolocalisation native optimisée
  const getCurrentPosition = useCallback(async (options: GeolocationOptions = {}): Promise<LocationData | null> => {
    const cacheKey = 'current_position';
    
    // Vérifier le cache d'abord
    cleanCache();
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute
      setState(prev => ({
        ...prev,
        location: cached.data,
        accuracy: cached.accuracy,
        source: 'cache',
        lastUpdate: new Date(cached.timestamp)
      }));
      return cached.data;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Géolocalisation non supportée'));
          return;
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout de géolocalisation'));
        }, options.timeout || 10000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            reject(err);
          },
          {
            enableHighAccuracy: options.enableHighAccuracy ?? true,
            timeout: options.timeout || 10000,
            maximumAge: options.maximumAge || 30000
          }
        );
      });

      const locationData: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address: 'Position actuelle',
        type: 'current',
        accuracy: position.coords.accuracy
      };

      // Mettre en cache
      cacheRef.current.set(cacheKey, {
        data: locationData,
        timestamp: Date.now(),
        accuracy: position.coords.accuracy || 0
      });

      // Essayer de récupérer l'adresse avec le geocoding inverse
      try {
        const response = await fetch('/api/geocode-reverse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        });

        if (response.ok) {
          const geocodeData = await response.json();
          if (geocodeData.address) {
            locationData.address = geocodeData.address;
          }
        }
      } catch (geocodeError) {
        console.warn('Geocoding inverse échoué:', geocodeError);
      }

      setState(prev => ({
        ...prev,
        location: locationData,
        loading: false,
        accuracy: position.coords.accuracy || null,
        source: 'gps',
        lastUpdate: new Date()
      }));

      lastPositionRef.current = position;
      return locationData;

    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      
      // Fallback vers une position populaire
      if (options.fallbackToDatabase) {
        const fallbackLocation = await getFallbackLocation();
        if (fallbackLocation) {
          setState(prev => ({
            ...prev,
            location: fallbackLocation,
            loading: false,
            source: 'cache',
            error: null,
            lastUpdate: new Date()
          }));
          return fallbackLocation;
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur de géolocalisation',
        source: null
      }));

      toast.error('Impossible d\'obtenir votre position actuelle');
      return null;
    }
  }, [cleanCache]);

  // Fallback vers des positions populaires
  const getFallbackLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      // Déterminer la ville (pourrait être basé sur l'IP ou les préférences utilisateur)
      const defaultCity = 'Kinshasa';
      const places = popularPlaces.current[defaultCity] || popularPlaces.current['Kinshasa'];
      
      if (places.length > 0) {
        const randomPlace = places[Math.floor(Math.random() * places.length)];
        return {
          lat: randomPlace.lat,
          lng: randomPlace.lng,
          address: randomPlace.name,
          type: 'fallback',
          accuracy: randomPlace.accuracy
        };
      }
    } catch (error) {
      console.error('Fallback location error:', error);
    }
    return null;
  }, []);

  // Recherche d'adresses avec autocomplétion
  const searchLocation = useCallback(async (query: string, city: string = 'Kinshasa'): Promise<LocationData[]> => {
    if (!query || query.length < 3) return [];

    const cacheKey = `search_${query}_${city}`;
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return [cached.data];
    }

    try {
      const response = await fetch('/api/geocode-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: `${query}, ${city}`,
          city: city
        })
      });

      if (!response.ok) {
        throw new Error('Erreur de recherche');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const results = data.results.slice(0, 5).map((result: any) => ({
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          address: result.formatted_address,
          type: 'geocoded' as const,
          placeId: result.place_id
        }));

        // Mettre en cache le premier résultat
        if (results.length > 0) {
          cacheRef.current.set(cacheKey, {
            data: results[0],
            timestamp: Date.now(),
            accuracy: 50
          });
        }

        return results;
      }

      return [];
    } catch (error) {
      console.error('Search location error:', error);
      toast.error('Erreur lors de la recherche d\'adresse');
      return [];
    }
  }, []);

  // Tracking continu avec optimisation batterie
  const startTracking = useCallback((callback: (location: LocationData) => void, interval: number = 10000) => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée');
      return;
    }

    stopTracking(); // Arrêter le tracking précédent

    const trackingOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 5000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: 'Position en cours',
          type: 'current',
          accuracy: position.coords.accuracy
        };

        callback(locationData);
        
        setState(prev => ({
          ...prev,
          location: locationData,
          accuracy: position.coords.accuracy || null,
          source: 'gps',
          lastUpdate: new Date()
        }));
      },
      (error) => {
        console.error('Tracking error:', error);
        // Ne pas arrêter le tracking pour des erreurs temporaires
      },
      trackingOptions
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Calculer la distance entre deux points
  const calculateDistance = useCallback((point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      stopTracking();
      cacheRef.current.clear();
    };
  }, [stopTracking]);

  return {
    ...state,
    getCurrentPosition,
    searchLocation,
    startTracking,
    stopTracking,
    calculateDistance,
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}