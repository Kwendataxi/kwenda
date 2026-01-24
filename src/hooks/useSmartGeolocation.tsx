/**
 * 🎯 HOOK DE GÉOLOCALISATION INTELLIGENT - UNIFIÉ ET PROFESSIONNEL
 * Système centralisé pour toute la géolocalisation dans Kwenda
 * 
 * ✅ FIX: Utilise nativeGeolocationService pour Android/iOS + retry + timeout progressif
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { universalGeolocation, CityConfig } from '@/services/universalGeolocation';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';

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

// Cache en mémoire pour la session - réduit à 2 minutes pour fraîcheur
const locationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const useSmartGeolocation = (options: GeolocationOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState<CityConfig | null>({
    name: 'Kinshasa',
    code: 'KIN',
    countryCode: 'CD',
    coordinates: { lat: -4.3276, lng: 15.3136 },
    currency: 'CDF'
  } as CityConfig);
  const [popularPlaces, setPopularPlaces] = useState<LocationSearchResult[]>([]);
  
  const abortControllerRef = useRef<AbortController>();

  // Détection de la ville au montage
  useEffect(() => {
    const detectCity = async () => {
      try {
        const city = await universalGeolocation.detectUserCity();
        console.log('🌍 [useSmartGeolocation] Ville détectée:', { 
          name: city.name, 
          code: city.code, 
          country: city.countryCode 
        });
        setCurrentCity(city);
        
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
   * 📍 Obtenir la position GPS actuelle avec retry progressif
   * ✅ Utilise nativeGeolocationService (Capacitor pour mobile, navigator pour web)
   */
  const getCurrentPosition = useCallback(async (opts?: GeolocationOptions): Promise<LocationData> => {
    const cacheKey = 'current-position';
    const cached = locationCache.get(cacheKey);
    
    // Cache réduit à 2 minutes pour fraîcheur
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📍 Position depuis cache');
      return cached.data;
    }

    setLoading(true);
    setError(null);

    // Timeouts progressifs pour retry
    const timeouts = [15000, 20000, 25000]; // 15s, 20s, 25s
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < timeouts.length; attempt++) {
      try {
        console.log(`📍 Tentative GPS ${attempt + 1}/${timeouts.length} (timeout: ${timeouts[attempt]/1000}s)...`);
        
        // ✅ Utiliser nativeGeolocationService (Capacitor + Browser)
        const position = await nativeGeolocationService.getCurrentPosition({
          enableHighAccuracy: opts?.enableHighAccuracy ?? true,
          timeout: timeouts[attempt],
          maximumAge: opts?.maximumAge ?? 30000
        });

        const coords = {
          lat: position.lat,
          lng: position.lng
        };

        console.log(`✅ GPS réussi:`, coords, `Précision: ±${Math.round(position.accuracy)}m`);

        // Détecter le pays correct via les coordonnées
        const detectedCity = await universalGeolocation.detectUserCity(coords);
        console.log(`🌍 Ville détectée: ${detectedCity.name} (${detectedCity.countryCode})`);

        // Géocodage inverse via Edge Function avec code pays correct
        let formattedAddress = 'Position actuelle';
        let placeName = 'Ma position';

        try {
          const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-proxy', {
            body: {
              query: `${coords.lat},${coords.lng}`,
              language: 'fr',
              region: detectedCity.countryCode // CI pour Abidjan, CD pour RDC
            }
          });

          if (!geocodeError && geocodeData?.results?.[0]) {
            formattedAddress = geocodeData.results[0].formatted_address || formattedAddress;
            placeName = geocodeData.results[0].name || placeName;
          }
        } catch (geocodeErr) {
          console.warn('⚠️ Géocodage inverse échoué, utilisation des coordonnées');
        }

        const locationData: LocationData = {
          address: formattedAddress,
          lat: coords.lat,
          lng: coords.lng,
          type: 'current',
          accuracy: position.accuracy,
          name: placeName
        };

        locationCache.set(cacheKey, { data: locationData, timestamp: Date.now() });
        setLoading(false);
        return locationData;

      } catch (gpsError: any) {
        console.warn(`❌ Tentative ${attempt + 1} échouée:`, gpsError.message);
        lastError = gpsError;

        // Si permission refusée, pas de retry
        if (gpsError.message?.includes('Permission') || gpsError.message?.includes('denied') || gpsError.message?.includes('refusée')) {
          console.error('🚫 Permission GPS refusée - arrêt des tentatives');
          break;
        }

        // Attendre avant retry (sauf dernière tentative)
        if (attempt < timeouts.length - 1) {
          console.log(`⏳ Attente 1s avant prochaine tentative...`);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    // Toutes les tentatives GPS ont échoué - Fallback IP
    console.warn('🌐 GPS échoué après toutes les tentatives, fallback IP...', lastError?.message);

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
        setLoading(false);
        setError('Position approximative (IP)');
        return locationData;
      } catch (ipError) {
        console.error('IP fallback échoué:', ipError);
      }
    }

    setLoading(false);
    setError(lastError?.message || 'Impossible de déterminer votre position');
    throw new Error(lastError?.message || 'Impossible de déterminer votre position');
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
    currentLocation: null, // Pas de currentLocation dans ce hook (utiliser getCurrentPosition)
    source: 'smart_geolocation' as const,
    getCurrentPosition,
    searchLocations,
    getPopularPlaces,
    calculateDistance,
    formatDistance
  };
};
