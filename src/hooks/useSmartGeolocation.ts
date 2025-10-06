/**
 * 🎯 HOOK DE GÉOLOCALISATION INTELLIGENT ET UNIFIÉ
 * 
 * Performance, fiabilité et UX optimisés pour l'Afrique
 * Fallbacks automatiques : GPS → IP → Cache → Base de données → Défaut
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { universalGeolocation, type CityConfig } from '@/services/universalGeolocation';

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
  currentCity: CityConfig | null;
  cityDetectionLoading: boolean;
}

export const useSmartGeolocation = () => {
  const [state, setState] = useState<SmartGeolocationState>({
    currentLocation: null,
    loading: false,
    error: null,
    searchResults: [],
    searchLoading: false,
    lastUpdate: null,
    source: null,
    currentCity: null,
    cityDetectionLoading: false
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // 🎯 GÉOLOCALISATION UNIVERSELLE PRINCIPALE
  const getCurrentPosition = useCallback(async (options: GeolocationOptions = {}): Promise<LocationData> => {
    const {
      enableHighAccuracy = true,
      timeout = 8000,
      maximumAge = 300000,
      fallbackToIP = true,
      fallbackToDatabase = true,
      fallbackToDefault = true
    } = options;

    setState(prev => ({ ...prev, loading: true, error: null, cityDetectionLoading: true }));

    try {
      // 1. Détecter la ville d'abord
      let detectedCity: CityConfig;
      
      // 2. Essayer GPS natif (rapide) pour détection de ville
      try {
        const gpsPosition = await getGPSPosition({ enableHighAccuracy, timeout, maximumAge });
        
        // Détecter la ville avec les coordonnées GPS
        detectedCity = await universalGeolocation.detectUserCity({
          lat: gpsPosition.lat,
          lng: gpsPosition.lng
        });
        
        setState(prev => ({
          ...prev,
          currentLocation: gpsPosition,
          loading: false,
          source: 'GPS',
          lastUpdate: Date.now(),
          currentCity: detectedCity,
          cityDetectionLoading: false
        }));
        setCachedPosition(gpsPosition);
        return gpsPosition;
      } catch (gpsError) {
        console.log('GPS failed, trying fallbacks:', gpsError);
      }

      // 3. Fallback IP avec détection de ville
      if (fallbackToIP) {
        try {
          const ipPosition = await getIPPosition();
          
          // Détecter la ville avec les coordonnées IP
          detectedCity = await universalGeolocation.detectUserCity({
            lat: ipPosition.lat,
            lng: ipPosition.lng
          });
          
          setState(prev => ({
            ...prev,
            currentLocation: ipPosition,
            loading: false,
            source: 'IP',
            lastUpdate: Date.now(),
            currentCity: detectedCity,
            cityDetectionLoading: false
          }));
          setCachedPosition(ipPosition);
          return ipPosition;
        } catch (ipError) {
          console.log('IP geolocation failed:', ipError);
        }
      }

      // 4. Détecter la ville même sans position exacte et utiliser cache local
      detectedCity = await universalGeolocation.detectUserCity();
      
      const cachedPosition = getCachedPosition();
      if (cachedPosition) {
        setState(prev => ({
          ...prev,
          currentLocation: cachedPosition,
          loading: false,
          source: 'Cache',
          lastUpdate: Date.now(),
          currentCity: detectedCity,
          cityDetectionLoading: false
        }));
        return cachedPosition;
      }

      // 5. Position de la ville détectée depuis la base de données
      if (fallbackToDatabase) {
        try {
          const dbPosition = await getDatabasePosition();
          setState(prev => ({
            ...prev,
            currentLocation: dbPosition,
            loading: false,
            source: 'Database',
            lastUpdate: Date.now(),
            currentCity: detectedCity,
            cityDetectionLoading: false
          }));
          return dbPosition;
        } catch (dbError) {
          console.log('Database fallback failed:', dbError);
        }
      }

      // 6. Position par défaut de la ville détectée
      if (fallbackToDefault) {
        const defaultPosition = getDefaultPosition();
        setState(prev => ({
          ...prev,
          currentLocation: defaultPosition,
          loading: false,
          source: 'Default',
          lastUpdate: Date.now(),
          currentCity: detectedCity,
          cityDetectionLoading: false
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

  // 🔍 RECHERCHE UNIVERSELLE INTELLIGENTE AVEC CACHE
  const searchLocations = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    if (!query.trim()) {
      const popularPlaces = await getPopularPlacesForCurrentCity();
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
          // Utiliser le service de géolocalisation amélioré
          const { enhancedLocationService } = await import('@/services/enhancedLocationService');
          
          const currentCity = state.currentCity?.code || 'cd';
          const userLat = state.currentLocation?.lat;
          const userLng = state.currentLocation?.lng;
          
          const results = await enhancedLocationService.searchLocations(
            query,
            currentCity,
            userLat,
            userLng
          );

          setState(prev => ({
            ...prev,
            searchResults: results,
            searchLoading: false
          }));
          resolve(results);

        } catch (error) {
          console.error('Search error:', error);
          const popularFallback = getPopularPlacesFallback();
          setState(prev => ({
            ...prev,
            searchResults: popularFallback,
            searchLoading: false
          }));
          resolve(popularFallback);
        }
      }, 300); // 300ms debounce
    });
  }, [state.currentCity, state.currentLocation]);

  // 🗺️ LIEUX POPULAIRES UNIVERSELS
  const getPopularPlacesForCurrentCity = useCallback(async (): Promise<LocationSearchResult[]> => {
    try {
      const results = await universalGeolocation.getPopularPlacesForCurrentCity();
      return results.map((place: any, index: number) => ({
        id: `pop-${index}`,
        name: place.name,
        address: `${place.commune || ''}, ${place.city || ''}`.replace(/^,\s*/, '').trim() || place.name,
        lat: place.latitude || place.lat,
        lng: place.longitude || place.lng,
        type: 'popular' as const,
        title: place.name,
        subtitle: `${place.commune || ''}, ${place.city || ''}`.replace(/^,\s*/, '').trim() || place.name,
        isPopular: true,
        relevanceScore: 100 - index * 5
      }));
    } catch (error) {
      console.error('Erreur lieux populaires:', error);
      return getPopularPlacesFallback();
    }
  }, []);

  const getPopularPlacesFallback = useCallback((): LocationSearchResult[] => {
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
    // État principal
    currentLocation: state.currentLocation,
    loading: state.loading,
    error: state.error,
    searchResults: state.searchResults,
    searchLoading: state.searchLoading,
    lastUpdate: state.lastUpdate,
    source: state.source,

    // Actions principales
    getCurrentPosition,
    searchLocations: async (query: string, callback?: (results: LocationSearchResult[]) => void) => {
      if (callback) {
        // Mode callback pour compatibilité
        try {
          const results = await searchLocations(query);
          callback(results);
        } catch {
          callback([]);
        }
      } else {
        // Mode Promise
        return searchLocations(query);
      }
    },
    getPopularPlaces: getPopularPlacesFallback,
    clearError,
    calculateDistance,
    formatDistance,

    // Aliases de compatibilité pour useGeolocation
    latitude: state.currentLocation?.lat || -4.3217,
    longitude: state.currentLocation?.lng || 15.3069,
    accuracy: state.currentLocation?.accuracy || 0,
    isRealGPS: state.currentLocation?.type === 'gps',
    currentPosition: state.currentLocation,
    
    // Aliases de méthodes pour compatibilité
    getCurrentLocation: getCurrentPosition,
    requestLocation: getCurrentPosition,
    forceRefreshPosition: () => getCurrentPosition(),
    
    // Propriétés d'état supplémentaires
    lastKnownPosition: state.currentLocation,
    isLoading: state.loading,
    position: state.currentLocation,
    currentCity: state.currentCity,
    cityDetectionLoading: state.cityDetectionLoading,
    
    // Propriété ville sous forme de string pour compatibilité
    currentCityName: state.currentCity?.name || 'Kinshasa'
  };
};

// Cache et gestion des requêtes
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes
let abortControllerRef: AbortController | null = null;

// Obtenir la ville actuelle
const getCurrentCity = () => {
  // Retourner la ville par défaut pour l'instant
  return { name: 'Kinshasa', region: 'CD' };
};

// Fonction pour détecter et valider les adresses Google Maps réelles
const isValidRealAddress = (address: string): boolean => {
  if (!address || address.length < 15) return false;
  
  // Détecter les Plus Codes (format XXXX+XXX)
  if (address.match(/[A-Z0-9]{4,}\+[A-Z0-9]{2,}/)) {
    console.log('❌ Plus Code détecté:', address);
    return false;
  }
  
  // Détecter les coordonnées brutes
  if (address.match(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)) {
    console.log('❌ Coordonnées brutes détectées:', address);
    return false;
  }
  
  // Doit contenir au moins une ville ou un pays
  const hasLocation = address.includes('Kinshasa') || 
                      address.includes('Lubumbashi') || 
                      address.includes('Kolwezi') ||
                      address.includes('Abidjan') ||
                      address.includes('Congo') ||
                      address.includes('Côte d\'Ivoire');
  
  if (!hasLocation) {
    console.log('❌ Pas de ville/pays reconnu:', address);
    return false;
  }
  
  return true;
};

// Construire une adresse lisible à partir des composants Google
const buildReadableAddress = (addressComponents: any[]): string => {
  const components = {
    street: '',
    neighborhood: '',
    commune: '',
    city: '',
    country: ''
  };
  
  addressComponents.forEach((comp: any) => {
    if (comp.types.includes('route') || comp.types.includes('street_address')) {
      components.street = comp.long_name;
    }
    if (comp.types.includes('neighborhood') || comp.types.includes('sublocality')) {
      components.neighborhood = comp.long_name;
    }
    if (comp.types.includes('administrative_area_level_2') || comp.types.includes('locality')) {
      components.commune = comp.long_name;
    }
    if (comp.types.includes('administrative_area_level_1') || comp.types.includes('locality')) {
      if (!components.city) components.city = comp.long_name;
    }
    if (comp.types.includes('country')) {
      components.country = comp.long_name;
    }
  });
  
  // Construire l'adresse avec les parties disponibles
  const parts = [
    components.street,
    components.neighborhood,
    components.commune || components.city,
    components.country
  ].filter(Boolean);
  
  return parts.join(', ') || 'Position non identifiée';
};

// Géocodage inverse amélioré avec détection de Plus Codes
const reverseGeocodeEnhanced = async (lat: number, lng: number, region?: string): Promise<string> => {
  try {
    const cacheKey = `reverse-${lat.toFixed(6)}-${lng.toFixed(6)}-${region || 'default'}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as string;
    }

    console.log('🔍 Géocodage inverse pour:', { lat, lng, region });

    // Forcer l'utilisation de Google Maps avec language=fr
    const { data, error } = await supabase.functions.invoke('geocode-proxy', {
      body: { 
        query: `${lat},${lng}`,
        region: region || getCurrentCity()?.region || 'CD',
        language: 'fr'
      }
    });

    if (error) {
      console.error('❌ Erreur geocode-proxy:', error);
      throw error;
    }

    // Extraire et valider l'adresse Google Maps
    if (data?.results && data.results.length > 0) {
      const result = data.results[0];
      let address = result.formatted_address || '';
      
      console.log('📍 Adresse Google reçue:', address);
      
      // Vérifier si c'est une vraie adresse (pas un Plus Code)
      if (!isValidRealAddress(address)) {
        console.log('⚠️ Adresse invalide, construction manuelle...');
        
        // Construire manuellement l'adresse avec address_components
        if (result.address_components && result.address_components.length > 0) {
          address = buildReadableAddress(result.address_components);
          console.log('✅ Adresse construite:', address);
        }
      }
      
      // Vérifier une dernière fois
      if (isValidRealAddress(address)) {
        cache.set(cacheKey, {
          data: address,
          timestamp: Date.now()
        });
        console.log('✅ Adresse valide retournée:', address);
        return address;
      }
    }

    // Fallback intelligent basé sur la région
    const city = getCurrentCity();
    const fallbackAddress = city ? 
      `Proche de ${city.name}, ${city.region}` : 
      `Position géographique (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    
    cache.set(cacheKey, {
      data: fallbackAddress,
      timestamp: Date.now()
    });

    return fallbackAddress;
  } catch (error: any) {
    console.error('❌ Erreur géocodage inverse:', error);
    
    // Fallback intelligent avec nom de ville si possible
    const city = getCurrentCity();
    return city ? 
      `Proche de ${city.name}, ${city.region}` : 
      `Position géographique (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
};

// 🔧 FONCTIONS UTILITAIRES PRIVÉES

async function getGPSPosition(options: PositionOptions): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }

    // Timeout adaptatif pour l'Afrique (plus long pour connexions lentes)
    const adaptiveTimeout = options.timeout || 15000; // 15 secondes pour l'Afrique
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout GPS - Connexion trop lente'));
    }, adaptiveTimeout);

    // Options GPS optimisées pour l'Afrique
    const optimizedOptions = {
      ...options,
      enableHighAccuracy: true,
      timeout: adaptiveTimeout,
      maximumAge: 60000 // Accepter une position vieille de 1 minute
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        
        const coords = position.coords;
        let address = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
        let retryCount = 0;
        const maxRetries = 2;
        
        // Essayer le géocodage inverse avec retry si Plus Code détecté
        while (retryCount <= maxRetries) {
          try {
            const geocodePromise = reverseGeocodeEnhanced(
              coords.latitude, 
              coords.longitude,
              getCurrentCity()?.region
            );
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Geocoding timeout')), 8000) // Augmenté à 8s
            );
            
            const geocodedAddress = await Promise.race([geocodePromise, timeoutPromise]) as string;
            
            // Vérifier si c'est une vraie adresse
            if (isValidRealAddress(geocodedAddress)) {
              address = geocodedAddress;
              console.log('✅ Adresse GPS valide obtenue:', address);
              break;
            } else {
              console.log('⚠️ Plus Code ou adresse invalide, retry...', retryCount + 1);
              retryCount++;
              
              // Attendre un peu avant retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.log(`Tentative ${retryCount + 1} échouée:`, error);
            retryCount++;
            
            if (retryCount > maxRetries) {
              // Dernier fallback: essayer de construire une adresse avec la DB
              try {
                const city = getCurrentCity();
                address = city ? 
                  `Position proche de ${city.name}, ${city.region}` : 
                  `Position: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
              } catch {
                address = `Position: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
              }
            }
          }
        }
        
        resolve({
          address,
          lat: coords.latitude,
          lng: coords.longitude,
          type: 'gps',
          accuracy: coords.accuracy,
          confidence: coords.accuracy < 100 ? 0.95 : 0.85 // Confiance basée sur précision
        });
      },
      (error) => {
        clearTimeout(timeoutId);
        const errorMessages: { [key: number]: string } = {
          1: 'Permission GPS refusée - Veuillez autoriser la géolocalisation',
          2: 'Position GPS indisponible - Vérifiez votre connexion',
          3: 'Timeout GPS - Connexion trop lente'
        };
        reject(new Error(errorMessages[error.code] || `Erreur GPS ${error.code}`));
      },
      optimizedOptions
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
  const currentCity = universalGeolocation.getCurrentCity();
  
  const { data, error } = await supabase
    .rpc('intelligent_places_search', {
      search_query: '',
      search_city: currentCity.name,
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
  const currentCity = universalGeolocation.getCurrentCity();
  
  return {
    address: `${currentCity.name}, ${currentCity.countryCode === 'CD' ? 'RDC' : 'Côte d\'Ivoire'}`,
    lat: currentCity.coordinates.lat,
    lng: currentCity.coordinates.lng,
    type: 'default',
    name: currentCity.name,
    subtitle: 'Ville par défaut',
    confidence: 0.5
  };
}

// 🔍 RECHERCHE UNIVERSELLE DANS LA BASE DE DONNÉES
async function searchInCurrentCityDatabase(query: string): Promise<LocationSearchResult[]> {
  try {
    const results = await universalGeolocation.searchInCurrentCity(query, 8);
    return results.map((place: any) => ({
      id: place.id,
      name: place.name,
      address: place.formatted_address || `${place.commune || ''}, ${place.city || ''}`.replace(/^,\s*/, '').trim(),
      lat: place.latitude,
      lng: place.longitude,
      type: 'database' as const,
      title: place.name,
      subtitle: place.subtitle || `${place.commune || ''}, ${place.city || ''}`.replace(/^,\s*/, '').trim(),
      relevanceScore: place.relevance_score || 50,
      distance: place.distance_meters ? Math.round(place.distance_meters / 1000) : undefined
    }));
  } catch (error) {
    console.error('Erreur recherche base de données:', error);
    return [];
  }
}

async function searchInDatabase(query: string): Promise<LocationSearchResult[]> {
  try {
    // Utiliser la ville détectée dynamiquement au lieu de Kinshasa codé en dur
    const currentCity = universalGeolocation.getCurrentCity();
    const { data, error } = await supabase
      .rpc('intelligent_places_search', {
        search_query: query,
        search_city: currentCity.name,
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
    // Adapter la recherche Google selon la ville détectée DYNAMIQUEMENT
    const currentCity = universalGeolocation.getCurrentCity();
    console.log(`🌐 Recherche Google dans: ${currentCity.name} (${currentCity.countryCode})`);
    
    const { data, error } = await supabase.functions.invoke('geocode-proxy', {
      body: { 
        query: query,
        city: currentCity.name,
        region: currentCity.countryCode.toLowerCase()
      }
    });

    if (error) throw error;

    return data?.results?.slice(0, 3).map((result: any, index: number) => ({
      id: `google-${index}`,
      address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      type: 'google' as const,
      title: result.formatted_address,
      subtitle: `Via Google Maps • ${currentCity.name}`,
      relevanceScore: 70 - index * 10, // Score Google modéré
      confidence: 0.85
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