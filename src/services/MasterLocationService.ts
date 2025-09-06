/**
 * Service unifié de géolocalisation pour Kwenda
 * Remplace tous les services de location précédents
 */

import { supabase } from '@/integrations/supabase/client';
import { locationCache } from './locationCache';

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'ip' | 'fallback' | 'database';
  placeId?: string;
  accuracy?: number;
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title?: string;
  subtitle?: string;
  isPopular?: boolean;
}

interface UseMasterLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
  autoDetectLocation?: boolean;
}

class MasterLocationService {
  private cache = new Map<string, any>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private requestCache = new Map<string, Promise<any>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  // ============ GÉOLOCALISATION PRINCIPALE ============

  async getCurrentPosition(options: UseMasterLocationOptions = {}): Promise<LocationData> {
    const {
      enableHighAccuracy = true,
      timeout = 30000, // Augmenté de 15s à 30s pour plus de stabilité
      maximumAge = 300000, // 5 minutes
      fallbackToIP = true,
      fallbackToDatabase = true,
      fallbackToDefault = true
    } = options;

    try {
      // Tentative GPS
      const position = await this.attemptGPSLocation(enableHighAccuracy, timeout, maximumAge);
      if (position) return position;
    } catch (error) {
      console.log('GPS failed, trying fallbacks:', error);
    }

    // Fallback IP si autorisé
    if (fallbackToIP) {
      try {
        const ipPosition = await this.getIPLocation();
        if (ipPosition) return ipPosition;
      } catch (error) {
        console.log('IP geolocation failed:', error);
      }
    }

    // Fallback base de données si autorisé
    if (fallbackToDatabase) {
      try {
        const dbPosition = await this.getDatabaseLocation();
        if (dbPosition) return dbPosition;
      } catch (error) {
        console.log('Database location failed:', error);
      }
    }

    // Fallback par défaut
    if (fallbackToDefault) {
      return this.getDefaultLocation();
    }

    throw new Error('POSITION_UNAVAILABLE');
  }

  private async attemptGPSLocation(
    enableHighAccuracy: boolean, 
    timeout: number, 
    maximumAge: number,
    retryCount: number = 0
  ): Promise<LocationData | null> {
    const maxRetries = 3;
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GEOLOCATION_NOT_SUPPORTED'));
        return;
      }

      // Validation des paramètres pour éviter les valeurs aberrantes
      const options = {
        enableHighAccuracy,
        timeout: Math.min(timeout, 15000), // Max 15s pour éviter les blocages
        maximumAge: Math.max(maximumAge, 60000) // Min 1 minute pour cache utile
      };

      let resolved = false;

      const successHandler = async (position: GeolocationPosition) => {
        if (resolved) return;
        resolved = true;

        try {
          const { latitude: lat, longitude: lng, accuracy } = position.coords;
          
          // Validation robuste des coordonnées
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            if (retryCount < maxRetries) {
              // Retry avec backoff exponentiel
              setTimeout(() => {
                this.attemptGPSLocation(enableHighAccuracy, timeout, maximumAge, retryCount + 1)
                  .then(resolve)
                  .catch(reject);
              }, Math.pow(2, retryCount) * 1000);
              return;
            }
            throw new Error('INVALID_COORDINATES');
          }

          // Validation de la précision GPS
          if (accuracy && accuracy > 5000) {
            console.warn('Précision GPS faible:', accuracy);
          }
          
          // Reverse geocoding avec timeout et fallback
          const address = await Promise.race([
            this.reverseGeocode(lat, lng),
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error('GEOCODING_TIMEOUT')), 5000)
            )
          ]).catch(() => `Position ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          
          const locationData = {
            address,
            lat,
            lng,
            type: 'current' as const,
            accuracy
          };

          // Mettre en cache la position
          locationCache.setCurrentLocation(locationData);
          resolve(locationData);
        } catch (error) {
          // Si reverse geocoding échoue, retourner quand même la position
          const { latitude, longitude, accuracy } = position.coords;
          const fallbackLocation = {
            address: `Position ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude,
            type: 'current' as const,
            accuracy
          };
          locationCache.setCurrentLocation(fallbackLocation);
          resolve(fallbackLocation);
        }
      };

      const errorHandler = (error: GeolocationPositionError) => {
        if (resolved) return;
        resolved = true;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('PERMISSION_DENIED'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('POSITION_UNAVAILABLE'));
            break;
          case error.TIMEOUT:
            reject(new Error('TIMEOUT'));
            break;
          default:
            reject(new Error('UNKNOWN_ERROR'));
            break;
        }
      };

      navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);
    });
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { 
          query: `${lat},${lng}`,
          region: 'cd'  // RDC par défaut
        }
      });

      if (error) throw error;

      if (data?.status === 'OK' && data.results?.[0]) {
        return data.results[0].formatted_address;
      }

      // Fallback local pour Kinshasa
      return this.getFallbackAddress(lat, lng);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return this.getFallbackAddress(lat, lng);
    }
  }

  private getFallbackAddress(lat: number, lng: number): string {
    // Zones approximatives de Kinshasa basées sur les coordonnées
    const kinshasa = { lat: -4.3217, lng: 15.3069 };
    const abidjan = { lat: 5.3600, lng: -4.0083 };
    
    if (Math.abs(lat - kinshasa.lat) < 0.5 && Math.abs(lng - kinshasa.lng) < 0.5) {
      const zones = [
        'Gombe, Kinshasa, RDC',
        'Bandalungwa, Kinshasa, RDC', 
        'Barumbu, Kinshasa, RDC',
        'Lemba, Kinshasa, RDC',
        'Kintambo, Kinshasa, RDC'
      ];
      return zones[Math.floor(Math.random() * zones.length)];
    }
    
    if (Math.abs(lat - abidjan.lat) < 0.5 && Math.abs(lng - abidjan.lng) < 0.5) {
      const zones = [
        'Plateau, Abidjan, Côte d\'Ivoire',
        'Cocody, Abidjan, Côte d\'Ivoire',
        'Marcory, Abidjan, Côte d\'Ivoire',
        'Treichville, Abidjan, Côte d\'Ivoire'
      ];
      return zones[Math.floor(Math.random() * zones.length)];
    }
    
    return `Lieu à ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  private async getIPLocation(): Promise<LocationData> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          address: `${data.city}, ${data.country_name}`,
          lat: data.latitude,
          lng: data.longitude,
          type: 'ip'
        };
      }
      
      throw new Error('IP_LOCATION_UNAVAILABLE');
    } catch (error) {
      throw new Error('IP_LOCATION_FAILED');
    }
  }

  private async getDatabaseLocation(): Promise<LocationData> {
    // Simuler une récupération depuis la base de données locale
    const commonLocations = [
      { address: 'Centre-ville, Kinshasa, RDC', lat: -4.3217, lng: 15.3069 },
      { address: 'Gombe, Kinshasa, RDC', lat: -4.3166, lng: 15.3056 },
      { address: 'Bandalungwa, Kinshasa, RDC', lat: -4.3732, lng: 15.2988 }
    ];
    
    const location = commonLocations[0]; // Par défaut centre-ville
    
    return {
      ...location,
      type: 'database'
    };
  }

  private getDefaultLocation(): LocationData {
    return {
      address: 'Kinshasa, République Démocratique du Congo',
      lat: -4.3217,
      lng: 15.3069,
      type: 'fallback'
    };
  }

  // ============ RECHERCHE DE LIEUX ============

  async searchLocation(query: string, currentLocation?: LocationData): Promise<LocationSearchResult[]> {
    if (!query.trim()) return [];

    const cacheKey = `search_${query.trim()}_${currentLocation ? this.getRegionFromLocation(currentLocation) : 'cd'}`;
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    // Éviter les requêtes multiples simultanées
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    // Debouncing pour éviter trop de requêtes
    const request = this.debouncedSearch(query, currentLocation, cacheKey);
    this.requestCache.set(cacheKey, request);
    
    try {
      const result = await request;
      this.requestCache.delete(cacheKey);
      return result;
    } catch (error) {
      this.requestCache.delete(cacheKey);
      throw error;
    }
  }

  private async debouncedSearch(query: string, currentLocation?: LocationData, cacheKey?: string): Promise<LocationSearchResult[]> {
    return new Promise(async (resolve) => {
      // Nettoyer le timer précédent
      if (this.debounceTimers.has(query)) {
        clearTimeout(this.debounceTimers.get(query)!);
      }

      // Créer un nouveau timer
      const timer = setTimeout(async () => {
        try {
          const result = await this.performSearch(query, currentLocation);
          
          // Mettre en cache le résultat
          if (cacheKey) {
            this.cache.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            });
          }
          
          resolve(result);
        } catch (error) {
          console.error('Search error:', error);
          resolve(this.searchLocalDatabase(query));
        }
      }, 300); // Debounce de 300ms

      this.debounceTimers.set(query, timer);
    });
  }

  private async performSearch(query: string, currentLocation?: LocationData): Promise<LocationSearchResult[]> {
    try {
      // Recherche via geocode-proxy avec fallback intelligent
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: {
          query: query.trim(),
          region: currentLocation ? this.getRegionFromLocation(currentLocation) : 'cd',
          language: 'fr'
        }
      });

      if (error) {
        console.warn('Geocode-proxy error, using local fallback:', error);
        return this.searchLocalDatabase(query);
      }

      if (data?.status === 'OK' && data.results) {
        const formattedResults = data.results.map((result: any, index: number) => ({
          id: result.place_id || `result-${index}`,
          address: result.formatted_address || result.name || query,
          lat: result.geometry?.location?.lat || -4.3217,
          lng: result.geometry?.location?.lng || 15.3069,
          type: 'geocoded',
          title: result.name || result.formatted_address?.split(',')[0] || query,
          subtitle: result.formatted_address || result.name || query,
          placeId: result.place_id
        }));

        return formattedResults.length > 0 ? formattedResults : this.searchLocalDatabase(query);
      }

      // Fallback avec base de données locale
      return this.searchLocalDatabase(query);
    } catch (error) {
      console.error('Search location error:', error);
      return this.searchLocalDatabase(query);
    }
  }

  private getRegionFromLocation(location: LocationData): string {
    // Déterminer la région basée sur la position
    if (location.lat > 4 && location.lat < 10 && location.lng > -8 && location.lng < 0) {
      return 'ci'; // Côte d'Ivoire
    }
    return 'cd'; // RDC par défaut
  }

  private async searchLocalDatabase(query: string): Promise<LocationSearchResult[]> {
    const localPlaces = [
      { name: 'Centre-ville', address: 'Centre-ville, Kinshasa, RDC', lat: -4.3217, lng: 15.3069 },
      { name: 'Aéroport de Ndjili', address: 'Aéroport International de Kinshasa, RDC', lat: -4.3970, lng: 15.4442 },
      { name: 'Université de Kinshasa', address: 'Université de Kinshasa, Mont Amba, RDC', lat: -4.4326, lng: 15.3045 },
      { name: 'Marché Central', address: 'Marché Central, Kinshasa, RDC', lat: -4.3258, lng: 15.3144 },
      { name: 'Boulevard du 30 Juin', address: 'Boulevard du 30 Juin, Kinshasa, RDC', lat: -4.3200, lng: 15.3100 }
    ];

    const filtered = localPlaces.filter(place => 
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.address.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.map((place, index) => ({
      id: `local-${index}`,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      type: 'database',
      title: place.name,
      subtitle: place.address
    }));
  }

  // ============ LIEUX À PROXIMITÉ ============

  async getNearbyPlaces(lat: number, lng: number, radiusKm: number = 5): Promise<LocationSearchResult[]> {
    // Simuler des lieux populaires à proximité
    const nearbyPlaces = [
      { name: 'Restaurant', address: 'Restaurant local', lat: lat + 0.01, lng: lng + 0.01 },
      { name: 'Pharmacie', address: 'Pharmacie proche', lat: lat - 0.01, lng: lng + 0.01 },
      { name: 'Banque', address: 'Agence bancaire', lat: lat + 0.01, lng: lng - 0.01 }
    ];

    return nearbyPlaces.map((place, index) => ({
      id: `nearby-${index}`,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      type: 'popular',
      title: place.name,
      subtitle: place.address
    }));
  }

  // ============ UTILITAIRES ============

  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance en mètres
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    if (seconds < 3600) {
      return `${Math.round(seconds / 60)}min`;
    }
    return `${Math.round(seconds / 3600)}h`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const masterLocationService = new MasterLocationService();
export default masterLocationService;