import { Geolocation, Position } from '@capacitor/geolocation';
import { CountryService } from './countryConfig';
import { IPGeolocationService } from './ipGeolocation';

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'ip' | 'fallback';
  placeId?: string;
  accuracy?: number;
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title?: string;
  subtitle?: string;
}

// Check if Capacitor is available
const isCapacitorAvailable = () => {
  return typeof window !== 'undefined' && 
         (window as any).Capacitor && 
         (window as any).Capacitor.isNativePlatform &&
         (window as any).Capacitor.isNativePlatform();
};

// Check if we're in a secure context (HTTPS or localhost)
const isSecureContext = () => {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

class UnifiedLocationService {
  private static instance: UnifiedLocationService;
  private cache = new Map<string, { result: LocationSearchResult[]; timestamp: number }>();
  private positionCache: { position: LocationData; timestamp: number; wasRealGPS: boolean } | null = null;

  static getInstance(): UnifiedLocationService {
    if (!this.instance) {
      this.instance = new UnifiedLocationService();
    }
    return this.instance;
  }

  constructor() {
    this.loadCachedPosition();
  }

  // === GÉOLOCALISATION GPS ===

  async getCurrentPosition(options: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    fallbackToIP?: boolean;
    fallbackToDefault?: boolean;
  } = {}): Promise<LocationData> {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000, // 30 secondes pour GPS
      maximumAge: 300000, // 5 minutes
      fallbackToIP: true,
      fallbackToDefault: true,
      ...options
    };

    console.log('🌍 Unified Location Service: Demande de position GPS...');

    try {
      // Étape 1: Tenter GPS
      const position = await this.getGPSPosition(defaultOptions);
      console.log('✅ Position GPS obtenue:', position);
      return position;
    } catch (gpsError) {
      console.warn('⚠️ GPS échoué:', gpsError);

      // Étape 2: Utiliser cache récent si disponible
      if (this.positionCache && this.isCacheValid(this.positionCache.timestamp, 1800000)) { // 30 min
        console.log('📍 Utilisation cache position');
        return this.positionCache.position;
      }

      // Étape 3: Fallback vers IP si autorisé
      if (defaultOptions.fallbackToIP) {
        try {
          const ipPosition = await this.getIPPosition();
          console.log('🌐 Position IP obtenue:', ipPosition);
          return ipPosition;
        } catch (ipError) {
          console.warn('⚠️ IP géolocalisation échouée:', ipError);
        }
      }

      // Étape 4: Position par défaut si autorisée
      if (defaultOptions.fallbackToDefault) {
        console.log('🏙️ Utilisation position par défaut');
        return this.getDefaultPosition();
      }

      throw new Error('Toutes les méthodes de géolocalisation ont échoué');
    }
  }

  private async getGPSPosition(options: any): Promise<LocationData> {
    // Vérifications préliminaires
    if (!isSecureContext() && !isCapacitorAvailable()) {
      throw new Error('HTTPS_REQUIRED');
    }

    let position: Position | GeolocationPosition;

    if (isCapacitorAvailable()) {
      // Mobile/Native
      console.log('📱 Utilisation Capacitor Geolocation');
      
      // Demander permissions
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        throw new Error('PERMISSION_DENIED');
      }

      position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: options.timeout,
        maximumAge: options.maximumAge,
      });
    } else {
      // Browser
      console.log('🌐 Utilisation navigator.geolocation');
      
      if (!navigator.geolocation) {
        throw new Error('GEOLOCATION_NOT_SUPPORTED');
      }

      position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            const errorMap: { [key: number]: string } = {
              1: 'PERMISSION_DENIED',
              2: 'POSITION_UNAVAILABLE',
              3: 'TIMEOUT'
            };
            reject(new Error(errorMap[error.code] || 'UNKNOWN_ERROR'));
          },
          {
            enableHighAccuracy: options.enableHighAccuracy,
            timeout: options.timeout,
            maximumAge: options.maximumAge,
          }
        );
      });
    }

    const isRealGPS = position.coords.accuracy !== null && position.coords.accuracy < 100;
    
    const locationData: LocationData = {
      address: 'Position actuelle',
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      type: 'current',
      accuracy: position.coords.accuracy
    };

    // Mise en cache
    this.positionCache = {
      position: locationData,
      timestamp: Date.now(),
      wasRealGPS: isRealGPS
    };
    this.saveCachedPosition();

    // Géocodage inverse pour l'adresse
    try {
      const address = await this.reverseGeocode(locationData.lat, locationData.lng);
      locationData.address = address;
    } catch (e) {
      console.warn('Géocodage inverse échoué:', e);
    }

    return locationData;
  }

  private async getIPPosition(): Promise<LocationData> {
    try {
      const ipLocation = await IPGeolocationService.getLocationFromIP();
      if (ipLocation) {
        const locationData: LocationData = {
          address: 'Position estimée (IP)',
          lat: ipLocation.latitude,
          lng: ipLocation.longitude,
          type: 'ip',
          accuracy: 10000 // IP accuracy is low
        };

        // Mise en cache IP
        this.positionCache = {
          position: locationData,
          timestamp: Date.now(),
          wasRealGPS: false
        };

        return locationData;
      }
      throw new Error('IP location unavailable');
    } catch (error) {
      throw new Error('IP_GEOLOCATION_FAILED');
    }
  }

  private getDefaultPosition(): LocationData {
    const country = CountryService.getCurrentCountry();
    const mainCity = country.majorCities[0];
    
    return {
      address: `${mainCity.name} (centre-ville)`,
      lat: mainCity.coordinates.lat,
      lng: mainCity.coordinates.lng,
      type: 'fallback',
      accuracy: 50000 // Large radius for fallback
    };
  }

  // === RECHERCHE D'ADRESSES ===

  async searchLocation(query: string, userLocation?: LocationData): Promise<LocationSearchResult[]> {
    if (!query.trim()) return [];

    const cacheKey = `search_${query}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp, 300000)) { // 5 minutes
      return cached.result;
    }

    try {
      console.log('🔍 Recherche:', query);
      
      // 1. Lieux populaires locaux d'abord
      const popularResults = this.searchPopularPlaces(query);
      
      // 2. Recherche via API Google
      const apiResults = await this.searchViaGoogleAPI(query, userLocation);
      
      // 3. Combiner et dédupliquer
      const allResults = [...popularResults, ...apiResults];
      const uniqueResults = this.deduplicateResults(allResults);
      
      // Mise en cache
      this.cache.set(cacheKey, {
        result: uniqueResults,
        timestamp: Date.now()
      });
      
      return uniqueResults;
    } catch (error) {
      console.error('Erreur recherche:', error);
      
      // Fallback vers lieux populaires seulement
      return this.searchPopularPlaces(query);
    }
  }

  private searchPopularPlaces(query: string): LocationSearchResult[] {
    const country = CountryService.getCurrentCountry();
    
    // Construire une liste de lieux populaires basiques pour chaque ville
    const popularPlaces = [
      { name: 'Aéroport', coordinates: { lat: -4.3857, lng: 15.4446 }, city: 'Kinshasa' },
      { name: 'Centre-ville', coordinates: { lat: -4.3250, lng: 15.3222 }, city: 'Kinshasa' },
      { name: 'Gombe', coordinates: { lat: -4.3199, lng: 15.3074 }, city: 'Kinshasa' },
      { name: 'Limete', coordinates: { lat: -4.3835, lng: 15.2943 }, city: 'Kinshasa' },
      { name: 'Marché Central', coordinates: { lat: -4.3225, lng: 15.3095 }, city: 'Kinshasa' },
    ];

    const filteredPlaces = popularPlaces.filter(place => 
      place.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 3);

    return filteredPlaces.map(place => ({
      id: `popular_${place.name}`,
      address: place.name,
      title: place.name,
      subtitle: place.city,
      lat: place.coordinates.lat,
      lng: place.coordinates.lng,
      type: 'popular' as const
    }));
  }

  private async searchViaGoogleAPI(query: string, userLocation?: LocationData): Promise<LocationSearchResult[]> {
    try {
      // Import supabase dynamically to avoid SSR issues
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { 
          address: query,
          location: userLocation ? `${userLocation.lat},${userLocation.lng}` : undefined
        }
      });

      if (error) throw error;
      
      return (data.results || []).slice(0, 5).map((result: any, index: number) => ({
        id: `google_${index}`,
        address: result.formatted_address,
        title: result.formatted_address.split(',')[0],
        subtitle: result.formatted_address.split(',').slice(1).join(',').trim(),
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        type: 'geocoded' as const,
        placeId: result.place_id
      }));
    } catch (error) {
      console.error('Google API search failed:', error);
      return [];
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Import supabase dynamically to avoid SSR issues
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { 
          latlng: `${lat},${lng}`
        }
      });

      if (error) throw error;
      
      return data.results?.[0]?.formatted_address || 'Position détectée';
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return 'Position détectée';
    }
  }

  // === UTILITAIRES ===

  private deduplicateResults(results: LocationSearchResult[]): LocationSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.lat.toFixed(4)}_${result.lng.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private isCacheValid(timestamp: number, maxAge: number): boolean {
    return Date.now() - timestamp < maxAge;
  }

  private loadCachedPosition(): void {
    try {
      const cached = localStorage.getItem('unified_position_cache');
      if (cached) {
        this.positionCache = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load cached position:', error);
    }
  }

  private saveCachedPosition(): void {
    try {
      if (this.positionCache) {
        localStorage.setItem('unified_position_cache', JSON.stringify(this.positionCache));
      }
    } catch (error) {
      console.warn('Failed to save cached position:', error);
    }
  }

  // === CALCULS ===

  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  }
}

export const unifiedLocationService = UnifiedLocationService.getInstance();