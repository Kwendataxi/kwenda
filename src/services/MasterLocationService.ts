/**
 * Service unifié de géolocalisation - Master Location Service
 * Point central pour toutes les opérations de localisation dans Kwenda
 */

import { supabase } from '@/integrations/supabase/client';

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'ip' | 'fallback' | 'database';
  placeId?: string;
  accuracy?: number;
  name?: string;
  subtitle?: string;
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title?: string;
  subtitle?: string;
  isPopular?: boolean;
}

export interface UseMasterLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
}

// Coordonnées par défaut pour chaque ville
const DEFAULT_COORDINATES = {
  'Kinshasa': { lat: -4.3217, lng: 15.3069 },
  'Lubumbashi': { lat: -11.6708, lng: 27.4794 },
  'Kolwezi': { lat: -10.7158, lng: 25.4664 },
  'Abidjan': { lat: 5.3600, lng: -4.0083 }
} as const;

class MasterLocationService {
  private cache = new Map<string, any>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Obtenir la position actuelle de l'utilisateur avec fallbacks
   */
  async getCurrentPosition(options: UseMasterLocationOptions = {}): Promise<LocationData> {
    const {
      enableHighAccuracy = true,
      timeout = 15000,
      maximumAge = 300000, // 5 minutes
      fallbackToIP = true,
      fallbackToDatabase = true,
      fallbackToDefault = true
    } = options;

    // Vérifier le cache en premier
    const cached = this.getFromCache('current_position');
    if (cached) {
      console.log('📍 Position depuis cache:', cached);
      return cached;
    }

    try {
      // 1. Essayer GPS natif
      const gpsLocation = await this.attemptGPSLocation({
        enableHighAccuracy,
        timeout,
        maximumAge
      });
      
      if (gpsLocation) {
        this.setCache('current_position', gpsLocation);
        return gpsLocation;
      }
    } catch (error) {
      console.warn('GPS failed:', error);
    }

    // 2. Fallback IP géolocalisation
    if (fallbackToIP) {
      try {
        const ipLocation = await this.attemptIPLocation();
        if (ipLocation) {
          this.setCache('current_position', ipLocation);
          return ipLocation;
        }
      } catch (error) {
        console.warn('IP geolocation failed:', error);
      }
    }

    // 3. Fallback base de données (lieux populaires)
    if (fallbackToDatabase) {
      try {
        const dbLocation = await this.attemptDatabaseLocation();
        if (dbLocation) {
          return dbLocation;
        }
      } catch (error) {
        console.warn('Database fallback failed:', error);
      }
    }

    // 4. Fallback coordonnées par défaut
    if (fallbackToDefault) {
      return {
        address: 'Kinshasa, République Démocratique du Congo',
        lat: DEFAULT_COORDINATES.Kinshasa.lat,
        lng: DEFAULT_COORDINATES.Kinshasa.lng,
        type: 'fallback',
        accuracy: 10000
      };
    }

    throw new Error('Impossible de déterminer votre position');
  }

  /**
   * Tentative de géolocalisation GPS native
   */
  private async attemptGPSLocation(options: any): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      let attempts = 0;
      const maxAttempts = 2;

      const tryGeolocation = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: lat, longitude: lng, accuracy } = position.coords;
            
            // Validation des coordonnées
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
              attempts++;
              if (attempts < maxAttempts) {
                setTimeout(tryGeolocation, 1000);
                return;
              }
              resolve(null);
              return;
            }

            try {
              const address = await this.reverseGeocode(lat, lng);
              resolve({
                address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                lat,
                lng,
                type: 'current',
                accuracy
              });
            } catch (error) {
              resolve({
                address: `Position actuelle (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                lat,
                lng,
                type: 'current',
                accuracy
              });
            }
          },
          (error) => {
            console.warn('Geolocation error:', error);
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(tryGeolocation, 1000);
            } else {
              resolve(null);
            }
          },
          {
            enableHighAccuracy: options.enableHighAccuracy,
            timeout: options.timeout,
            maximumAge: options.maximumAge
          }
        );
      };

      tryGeolocation();
    });
  }

  /**
   * Géocodage inverse pour obtenir l'adresse
   */
  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: {
          lat,
          lng,
          type: 'reverse'
        }
      });

      if (error || !data?.results?.[0]) {
        return this.getFallbackAddress(lat, lng);
      }

      return data.results[0].formatted_address || this.getFallbackAddress(lat, lng);
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return this.getFallbackAddress(lat, lng);
    }
  }

  /**
   * Adresse de fallback basée sur les coordonnées
   */
  private getFallbackAddress(lat: number, lng: number): string {
    // Déterminer la ville la plus proche
    let closestCity = 'Kinshasa';
    let minDistance = Infinity;

    Object.entries(DEFAULT_COORDINATES).forEach(([city, coords]) => {
      const distance = this.calculateDistance(
        { lat, lng },
        { lat: coords.lat, lng: coords.lng }
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    });

    return `Près de ${closestCity}, ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  /**
   * Tentative de géolocalisation par IP
   */
  private async attemptIPLocation(): Promise<LocationData | null> {
    try {
      // Service de géolocalisation par IP simple
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          address: `${data.city || 'Ville inconnue'}, ${data.country_name || 'Pays inconnu'}`,
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          type: 'ip',
          accuracy: 50000 // Précision IP généralement faible
        };
      }
    } catch (error) {
      console.warn('IP geolocation failed:', error);
    }
    return null;
  }

  /**
   * Fallback base de données - retourne un lieu populaire
   */
  private async attemptDatabaseLocation(): Promise<LocationData | null> {
    const popularPlaces = [
      {
        address: 'Boulevard du 30 Juin, Gombe, Kinshasa',
        lat: -4.3166,
        lng: 15.3056,
        name: 'Gombe - Centre-ville'
      },
      {
        address: 'Avenue Kasavubu, Kalamu, Kinshasa',
        lat: -4.3431,
        lng: 15.2931,
        name: 'Kalamu'
      }
    ];

    const randomPlace = popularPlaces[Math.floor(Math.random() * popularPlaces.length)];
    return {
      ...randomPlace,
      type: 'database',
      accuracy: 1000
    };
  }

  /**
   * Recherche de lieux avec debouncing
   */
  async searchLocation(query: string, currentLocation?: LocationData): Promise<LocationSearchResult[]> {
    if (!query.trim()) return [];

    const cacheKey = `search_${query.toLowerCase()}`;
    
    // Vérifier le cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Debouncing
    const timerId = `search_${query}`;
    if (this.debounceTimers.has(timerId)) {
      clearTimeout(this.debounceTimers.get(timerId));
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          const results = await this.performSearch(query, currentLocation);
          this.setCache(cacheKey, results);
          resolve(results);
        } catch (error) {
          console.error('Search error:', error);
          resolve(this.searchLocalDatabase(query));
        }
      }, 300);

      this.debounceTimers.set(timerId, timer);
    });
  }

  /**
   * Recherche via l'API externe
   */
  private async performSearch(query: string, currentLocation?: LocationData): Promise<LocationSearchResult[]> {
    const { data, error } = await supabase.functions.invoke('geocode-proxy', {
      body: {
        query,
        region: 'cd', // République Démocratique du Congo
        language: 'fr',
        location: currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined
      }
    });

    if (error || !data?.results) {
      throw new Error('Search failed');
    }

    return data.results.map((result: any, index: number) => ({
      id: result.place_id || `search-${index}`,
      address: result.formatted_address || result.name || query,
      lat: result.geometry?.location?.lat || 0,
      lng: result.geometry?.location?.lng || 0,
      type: 'geocoded' as const,
      placeId: result.place_id,
      title: result.name || result.formatted_address?.split(',')[0],
      subtitle: result.vicinity || result.formatted_address,
      accuracy: 1
    }));
  }

  /**
   * Recherche locale de fallback
   */
  private async searchLocalDatabase(query: string): Promise<LocationSearchResult[]> {
    const localPlaces = [
      { name: 'Gombe', address: 'Gombe, Kinshasa', lat: -4.3166, lng: 15.3056, category: 'district' },
      { name: 'Kalamu', address: 'Kalamu, Kinshasa', lat: -4.3431, lng: 15.2931, category: 'district' },
      { name: 'Limete', address: 'Limete, Kinshasa', lat: -4.3800, lng: 15.2900, category: 'district' },
      { name: 'Kintambo', address: 'Kintambo, Kinshasa', lat: -4.3298, lng: 15.2823, category: 'district' },
      { name: 'Lingwala', address: 'Lingwala, Kinshasa', lat: -4.3100, lng: 15.3200, category: 'district' },
      { name: 'Bandalungwa', address: 'Bandalungwa, Kinshasa', lat: -4.3600, lng: 15.2700, category: 'district' },
      { name: 'Université de Kinshasa', address: 'Mont Amba, Kinshasa', lat: -4.4326, lng: 15.3045, category: 'university' },
      { name: 'Marché Central', address: 'Avenue de la Paix, Kinshasa', lat: -4.3258, lng: 15.3144, category: 'market' },
      { name: 'Aéroport de Ndjili', address: 'N\'djili, Kinshasa', lat: -4.3970, lng: 15.4442, category: 'airport' }
    ];

    const filtered = localPlaces.filter(place => 
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.address.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, 8).map((place, index) => ({
      id: `local-${index}`,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      type: 'database' as const,
      title: place.name,
      subtitle: place.address,
      accuracy: 1
    }));
  }

  /**
   * Recherche de lieux à proximité
   */
  async getNearbyPlaces(lat: number, lng: number, radiusKm: number = 2): Promise<LocationSearchResult[]> {
    // Simulation de lieux populaires à proximité
    const nearbyTypes = ['restaurant', 'pharmacy', 'bank', 'gas_station', 'hospital'];
    
    return nearbyTypes.map((type, index) => ({
      id: `nearby-${index}`,
      address: `${type} à proximité`,
      lat: lat + (Math.random() - 0.5) * 0.01,
      lng: lng + (Math.random() - 0.5) * 0.01,
      type: 'popular' as const,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} proche`,
      subtitle: 'À proximité de votre position',
      accuracy: 1
    }));
  }

  /**
   * Calcul de distance entre deux points (Haversine)
   */
  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Formatage de distance
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Formatage de durée
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} min`;
    }
    return `${Math.round(seconds / 3600)} h`;
  }

  // ============ GESTION DU CACHE ============

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(): void {
    this.cache.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

export const masterLocationService = new MasterLocationService();
export default masterLocationService;