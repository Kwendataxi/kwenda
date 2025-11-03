/**
 * 🎯 HOOK DE GÉOLOCALISATION INTELLIGENT - UNIFIÉ ET PROFESSIONNEL
 * Système centralisé pour toute la géolocalisation dans Kwenda
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { universalGeolocation } from '@/services/universalGeolocation';

// Types exportés pour compatibilité
export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'database' | 'google' | 'manual' | 'ip' | 'fallback' | 'default' | 'gps';
  placeId?: string;
  accuracy?: number;
  name?: string;
  subtitle?: string;
  contact?: {
    name?: string;
    phone?: string;
  };
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title?: string;
  subtitle?: string;
  isPopular?: boolean;
  relevanceScore?: number;
  distance?: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
}

// Cache en mémoire pour la session
const locationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (réduit pour fraîcheur des données)

export const useSmartGeolocation = (options: GeolocationOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState<string>('Kinshasa');
  const [popularPlaces, setPopularPlaces] = useState<LocationSearchResult[]>([]);
  
  const abortControllerRef = useRef<AbortController>();

  // Détection de la ville au montage
  useEffect(() => {
    const detectCity = async () => {
      try {
        const city = await universalGeolocation.detectUserCity();
        setCurrentCity(city.name);
        
        // 🆕 PHASE 4: Prefetch et tri intelligent des lieux populaires
        const places = await universalGeolocation.getPopularPlacesForCurrentCity();
        const sortedPlaces = places
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .map((p, idx) => ({
            id: `popular-${idx}`,
            address: p.name,
            lat: p.lat,
            lng: p.lng,
            type: 'popular' as const,
            name: p.name,
            subtitle: p.commune || city.name,
            isPopular: true,
            relevanceScore: 90 - idx * 5
          }));
        setPopularPlaces(sortedPlaces);
      } catch (err) {
        console.error('Erreur détection ville:', err);
      }
    };
    
    detectCity();
  }, []);

  /**
   * 📍 Obtenir la position GPS actuelle
   */
  const getCurrentPosition = useCallback(async (opts?: GeolocationOptions): Promise<LocationData> => {
    const cacheKey = 'current-position';
    const cached = locationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      // Essayer GPS d'abord
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Géolocalisation non disponible'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: opts?.enableHighAccuracy ?? true,
            timeout: opts?.timeout ?? 5000,
            maximumAge: opts?.maximumAge ?? 30000
          }
        );
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Géocodage inverse via Edge Function
      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-proxy', {
        body: {
          query: `${coords.lat},${coords.lng}`,
          language: 'fr'
        }
      });

      if (geocodeError) throw geocodeError;

      const locationData: LocationData = {
        address: geocodeData?.results?.[0]?.formatted_address || 'Position actuelle',
        lat: coords.lat,
        lng: coords.lng,
        type: 'current',
        accuracy: position.coords.accuracy,
        name: geocodeData?.results?.[0]?.name || 'Ma position'
      };

      locationCache.set(cacheKey, { data: locationData, timestamp: Date.now() });
      return locationData;

    } catch (gpsError) {
      console.warn('GPS échoué, fallback IP...', gpsError);

      // Fallback IP si demandé
      if (opts?.fallbackToIP !== false) {
        try {
          const city = await universalGeolocation.detectUserCity();
          const locationData: LocationData = {
            address: `Centre de ${city.name}`,
            lat: city.coordinates.lat,
            lng: city.coordinates.lng,
            type: 'ip',
            name: city.name
          };
          
          locationCache.set(cacheKey, { data: locationData, timestamp: Date.now() });
          return locationData;
        } catch (ipError) {
          console.error('IP fallback échoué:', ipError);
        }
      }

      throw new Error('Impossible de déterminer votre position');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔍 Rechercher des lieux via Google Places + DB
   */
  const searchLocations = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    if (!query || query.trim().length < 2) {
      return popularPlaces.slice(0, 5);
    }

    const cacheKey = `search-${query.toLowerCase()}`;
    const cached = locationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Annuler la recherche précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Recherche via Google Places Autocomplete
      const { data: googleData, error: googleError } = await supabase.functions.invoke(
        'google-places-autocomplete',
        {
          body: {
            input: query,
            language: 'fr'
          }
        }
      );

      if (googleError) throw googleError;

      const predictions = googleData?.predictions || [];
      
      // 🆕 PHASE 2.1: Enrichir les 3 premiers résultats immédiatement avec coordonnées réelles
      const city = await universalGeolocation.detectUserCity();
      
      const enrichedResults = await Promise.all(
        predictions.slice(0, 3).map(async (pred: any, idx: number) => {
          try {
            const { data: details } = await supabase.functions.invoke('google-place-details', {
              body: { placeId: pred.place_id }
            });
            
            if (details?.result?.geometry?.location) {
              console.log('✅ Coordonnées enrichies pour:', pred.description);
              return {
                id: pred.place_id,
                address: pred.description,
                lat: details.result.geometry.location.lat,
                lng: details.result.geometry.location.lng,
                type: 'google' as const,
                placeId: pred.place_id,
                name: pred.structured_formatting?.main_text || pred.description,
                subtitle: pred.structured_formatting?.secondary_text,
                title: pred.structured_formatting?.main_text,
                relevanceScore: 100 - idx * 10
              };
            }
          } catch (err) {
            console.error('Erreur enrichissement:', err);
          }
          
          // Fallback : coordonnées du centre-ville
          return {
            id: pred.place_id,
            address: pred.description,
            lat: city.defaultCoordinates.lat,
            lng: city.defaultCoordinates.lng,
            type: 'google' as const,
            placeId: pred.place_id,
            name: pred.structured_formatting?.main_text || pred.description,
            subtitle: pred.structured_formatting?.secondary_text,
            title: pred.structured_formatting?.main_text,
            relevanceScore: 90 - idx * 10
          };
        })
      );

      // Ajouter résultats 4 et 5 avec fallback centre-ville
      const remainingResults = predictions.slice(3, 5).map((pred: any, idx: number) => ({
        id: pred.place_id,
        address: pred.description,
        lat: city.defaultCoordinates.lat,
        lng: city.defaultCoordinates.lng,
        type: 'google' as const,
        placeId: pred.place_id,
        name: pred.structured_formatting?.main_text || pred.description,
        subtitle: pred.structured_formatting?.secondary_text,
        title: pred.structured_formatting?.main_text,
        relevanceScore: 80 - idx * 10
      }));

      const results = [...enrichedResults, ...remainingResults];
      
      // Ajouter lieux populaires pertinents
      const filteredPopular = popularPlaces
        .filter(p => p.name?.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map((p, idx) => ({
          ...p,
          relevanceScore: 85 - idx * 5
        }));
      
      const allResults = [...results, ...filteredPopular];

      locationCache.set(cacheKey, { data: allResults, timestamp: Date.now() });
      return allResults;

    } catch (err: any) {
      console.error('Erreur recherche:', err);
      setError(err.message || 'Erreur de recherche');
      
      // Fallback: filtrer les lieux populaires
      return popularPlaces.filter(p => 
        p.name?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
    } finally {
      setLoading(false);
    }
  }, [popularPlaces]);

  /**
   * 📍 Obtenir les lieux populaires
   */
  const getPopularPlaces = useCallback((): LocationSearchResult[] => {
    return popularPlaces;
  }, [popularPlaces]);

  /**
   * 📏 Calculer la distance entre deux points (Haversine)
   */
  const calculateDistance = useCallback((
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en mètres
  }, []);

  /**
   * 📏 Formater une distance
   */
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }, []);

  return {
    loading,
    error,
    currentCity,
    getCurrentPosition,
    searchLocations,
    getPopularPlaces,
    calculateDistance,
    formatDistance
  };
};
