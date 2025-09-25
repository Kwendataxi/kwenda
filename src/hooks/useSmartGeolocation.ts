/**
 * 🎯 HOOK DE GÉOLOCALISATION INTELLIGENT ET UNIFIÉ
 * 
 * Performance, fiabilité et UX optimisés pour l'Afrique
 * Fallbacks automatiques : GPS → IP → Cache → Base de données → Défaut
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types unifiés
export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'gps' | 'ip' | 'database' | 'fallback' | 'recent' | 'popular' | 'current' | 'default' | 'geocoded' | 'google' | 'manual';
  placeId?: string;
  accuracy?: number;
  name?: string;
  subtitle?: string;
  confidence?: number;
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title?: string;
  isPopular?: boolean;
  distance?: number;
  relevanceScore?: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
}

interface SmartGeolocationState {
  currentLocation: LocationData | null;
  loading: boolean;
  error: string | null;
  searchResults: LocationSearchResult[];
  searchLoading: boolean;
  lastUpdate: number | null;
  source: string | null;
}

export const useSmartGeolocation = () => {
  const [state, setState] = useState<SmartGeolocationState>({
    currentLocation: null,
    loading: false,
    error: null,
    searchResults: [],
    searchLoading: false,
    lastUpdate: null,
    source: null
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // 🎯 GÉOLOCALISATION PRINCIPALE
  const getCurrentPosition = useCallback(async (options: GeolocationOptions = {}): Promise<LocationData> => {
    const {
      enableHighAccuracy = true,
      timeout = 8000,
      maximumAge = 300000,
      fallbackToIP = true,
      fallbackToDatabase = true,
      fallbackToDefault = true
    } = options;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Essayer GPS natif (rapide)
      try {
        const gpsPosition = await getGPSPosition({ enableHighAccuracy, timeout, maximumAge });
        setState(prev => ({
          ...prev,
          currentLocation: gpsPosition,
          loading: false,
          source: 'GPS',
          lastUpdate: Date.now()
        }));
        setCachedPosition(gpsPosition);
        return gpsPosition;
      } catch (gpsError) {
        console.log('GPS failed, trying fallbacks:', gpsError);
      }

      // 2. Fallback IP (moyen)
      if (fallbackToIP) {
        try {
          const ipPosition = await getIPPosition();
          setState(prev => ({
            ...prev,
            currentLocation: ipPosition,
            loading: false,
            source: 'IP',
            lastUpdate: Date.now()
          }));
          setCachedPosition(ipPosition);
          return ipPosition;
        } catch (ipError) {
          console.log('IP geolocation failed:', ipError);
        }
      }

      // 3. Cache local
      const cachedPosition = getCachedPosition();
      if (cachedPosition) {
        setState(prev => ({
          ...prev,
          currentLocation: cachedPosition,
          loading: false,
          source: 'Cache',
          lastUpdate: Date.now()
        }));
        return cachedPosition;
      }

      // 4. Base de données Supabase
      if (fallbackToDatabase) {
        try {
          const dbPosition = await getDatabasePosition();
          setState(prev => ({
            ...prev,
            currentLocation: dbPosition,
            loading: false,
            source: 'Database',
            lastUpdate: Date.now()
          }));
          return dbPosition;
        } catch (dbError) {
          console.log('Database fallback failed:', dbError);
        }
      }

      // 5. Position par défaut (Kinshasa)
      if (fallbackToDefault) {
        const defaultPosition = getDefaultPosition();
        setState(prev => ({
          ...prev,
          currentLocation: defaultPosition,
          loading: false,
          source: 'Default',
          lastUpdate: Date.now()
        }));
        return defaultPosition;
      }

      throw new Error('Toutes les méthodes de géolocalisation ont échoué');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Géolocalisation impossible: ${errorMessage}`
      }));
      throw error;
    }
  }, []);

  // 🔍 RECHERCHE INTELLIGENTE
  const searchLocations = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    if (!query.trim()) {
      const popularPlaces = getPopularPlaces();
      setState(prev => ({ ...prev, searchResults: popularPlaces }));
      return popularPlaces;
    }

    setState(prev => ({ ...prev, searchLoading: true }));

    // Debounce pour éviter trop de requêtes
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    return new Promise((resolve) => {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // 1. Recherche dans la base de données locale
          const dbResults = await searchInDatabase(query);
          
          // 2. Si pas assez de résultats, chercher via Google
          let allResults = [...dbResults];
          if (dbResults.length < 5) {
            const googleResults = await searchViaGoogle(query);
            allResults = [...dbResults, ...googleResults];
          }

          // 3. Trier par pertinence
          const sortedResults = allResults
            .filter((result, index, self) => 
              self.findIndex(r => r.lat === result.lat && r.lng === result.lng) === index
            )
            .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
            .slice(0, 8);

          setState(prev => ({
            ...prev,
            searchResults: sortedResults,
            searchLoading: false
          }));
          resolve(sortedResults);

        } catch (error) {
          console.error('Search error:', error);
          const popularFallback = getPopularPlaces();
          setState(prev => ({
            ...prev,
            searchResults: popularFallback,
            searchLoading: false
          }));
          resolve(popularFallback);
        }
      }, 300); // 300ms debounce
    });
  }, []);

  // 🗺️ LIEUX POPULAIRES
  const getPopularPlaces = useCallback((): LocationSearchResult[] => {
    return [
      {
        id: 'pop-1',
        name: 'Aéroport International de N\'djili',
        address: 'Aéroport N\'djili, Kinshasa, RDC',
        lat: -4.3857,
        lng: 15.4444,
        type: 'popular',
        title: 'Aéroport N\'djili',
        subtitle: 'Transport international',
        isPopular: true,
        relevanceScore: 100
      },
      {
        id: 'pop-2',
        name: 'Centre-ville de Kinshasa',
        address: 'Gombe, Kinshasa, RDC',
        lat: -4.3217,
        lng: 15.3069,
        type: 'popular',
        title: 'Centre-ville',
        subtitle: 'Gombe, quartier des affaires',
        isPopular: true,
        relevanceScore: 95
      },
      {
        id: 'pop-3',
        name: 'Université de Kinshasa',
        address: 'Mont-Amba, Kinshasa, RDC',
        lat: -4.4324,
        lng: 15.2973,
        type: 'popular',
        title: 'UNIKIN',
        subtitle: 'Campus universitaire principal',
        isPopular: true,
        relevanceScore: 90
      },
      {
        id: 'pop-4',
        name: 'Marché Central',
        address: 'Kinshasa, RDC',
        lat: -4.3150,
        lng: 15.3100,
        type: 'popular',
        title: 'Marché Central',
        subtitle: 'Commerce et shopping',
        isPopular: true,
        relevanceScore: 85
      },
      {
        id: 'pop-5',
        name: 'Stade des Martyrs',
        address: 'Kalamu, Kinshasa, RDC',
        lat: -4.3500,
        lng: 15.3200,
        type: 'popular',
        title: 'Stade des Martyrs',
        subtitle: 'Complexe sportif national',
        isPopular: true,
        relevanceScore: 80
      }
    ];
  }, []);

  // 🧹 NETTOYER LES ERREURS
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 📏 CALCULER DISTANCE
  const calculateDistance = useCallback((point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // 📏 FORMATER DISTANCE
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    // État
    currentLocation: state.currentLocation,
    loading: state.loading,
    error: state.error,
    searchResults: state.searchResults,
    searchLoading: state.searchLoading,
    lastUpdate: state.lastUpdate,
    source: state.source,

    // Actions
    getCurrentPosition,
    searchLocations,
    getPopularPlaces,
    clearError,
    calculateDistance,
    formatDistance
  };
};

// 🔧 FONCTIONS UTILITAIRES PRIVÉES

async function getGPSPosition(options: PositionOptions): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout GPS'));
    }, options.timeout || 8000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        
        const coords = position.coords;
        let address = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
        
        // Essayer le géocodage inverse
        try {
          address = await reverseGeocode(coords.latitude, coords.longitude);
        } catch (error) {
          console.log('Reverse geocoding failed, using coordinates');
        }
        
        resolve({
          address,
          lat: coords.latitude,
          lng: coords.longitude,
          type: 'gps',
          accuracy: coords.accuracy,
          confidence: 0.95
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        const errorMessages: { [key: number]: string } = {
          1: 'Permission refusée',
          2: 'Position indisponible',
          3: 'Timeout GPS'
        };
        reject(new Error(errorMessages[error.code] || 'Erreur GPS inconnue'));
      },
      options
    );
  });
}

async function getIPPosition(): Promise<LocationData> {
  // Essayer plusieurs services IP en parallèle
  const services = [
    fetch('http://ip-api.com/json/?fields=status,lat,lon,city,country,regionName')
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'success') throw new Error('IPAPI failed');
        return {
          address: `${data.city}, ${data.regionName}, ${data.country}`,
          lat: data.lat,
          lng: data.lon,
          type: 'ip' as const,
          accuracy: 10000,
          confidence: 0.7
        };
      }),
    
    fetch('https://ipinfo.io/json')
      .then(res => res.json())
      .then(data => {
        if (!data.loc) throw new Error('IPInfo failed');
        const [lat, lng] = data.loc.split(',').map(Number);
        return {
          address: `${data.city || 'Unknown'}, ${data.region || 'Unknown'}, ${data.country || 'Unknown'}`,
          lat,
          lng,
          type: 'ip' as const,
          accuracy: 10000,
          confidence: 0.7
        };
      })
  ];

  return Promise.race(services.map(service => service.catch(err => err)))
    .then(result => {
      if (result instanceof Error) {
        throw result;
      }
      return result;
    });
}

async function getDatabasePosition(): Promise<LocationData> {
  const { data, error } = await supabase
    .rpc('intelligent_places_search', {
      search_query: '',
      search_city: 'Kinshasa',
      max_results: 1
    });

  if (error || !data?.[0]) {
    throw new Error('Database position failed');
  }

  const place = data[0];
  return {
    address: place.name,
    lat: place.latitude,
    lng: place.longitude,
    type: 'database',
    name: place.name,
    subtitle: `${place.commune || ''}, ${place.city || ''}`.replace(/^,\s*/, '').trim() || place.name,
    confidence: 0.8
  };
}

function getDefaultPosition(): LocationData {
  return {
    address: 'Kinshasa Centre, République Démocratique du Congo',
    lat: -4.3217,
    lng: 15.3069,
    type: 'fallback',
    name: 'Kinshasa Centre',
    subtitle: 'Position par défaut',
    confidence: 0.5
  };
}

async function searchInDatabase(query: string): Promise<LocationSearchResult[]> {
  try {
    const { data, error } = await supabase
      .rpc('intelligent_places_search', {
        search_query: query,
        search_city: 'Kinshasa',
        max_results: 6
      });

    if (error) throw error;

    return data?.map((place: any) => ({
      id: place.id,
      address: place.name,
      lat: place.latitude,
      lng: place.longitude,
      type: 'database' as const,
      title: place.name,
      subtitle: `${place.commune || ''}, ${place.city || ''}`.replace(/^,\s*/, '').trim(),
      relevanceScore: place.relevance_score,
      confidence: place.relevance_score / 100
    })) || [];
  } catch (error) {
    console.error('Database search error:', error);
    return [];
  }
}

async function searchViaGoogle(query: string): Promise<LocationSearchResult[]> {
  try {
    const { data, error } = await supabase.functions.invoke('geocode-proxy', {
      body: { query }
    });

    if (error) throw error;

    return data?.results?.slice(0, 3).map((result: any, index: number) => ({
      id: `google-${index}`,
      address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      type: 'database' as const,
      title: result.formatted_address,
      subtitle: 'Via Google Maps',
      relevanceScore: 60 - index * 10, // Décrémenter pour l'ordre
      confidence: 0.9
    })) || [];
  } catch (error) {
    console.error('Google search error:', error);
    return [];
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('geocode-proxy', {
      body: { lat, lng, reverse: true }
    });

    if (error) throw error;
    return data?.results?.[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function getCachedPosition(): LocationData | null {
  try {
    const cached = localStorage.getItem('smart-location-cache');
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < 10 * 60 * 1000) { // 10 minutes
        return data.location;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

function setCachedPosition(location: LocationData): void {
  try {
    localStorage.setItem('smart-location-cache', JSON.stringify({
      location,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}