/**
 * Service de géolocalisation ultra-robuste et performant
 * Remplace complètement MasterLocationService avec une architecture moderne
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
  badge?: string;
  distance_meters?: number;
  relevance_score?: number;
}

export interface UltraLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
  city?: string;
}

// Coordonnées précises par défaut avec zones étendues
const CITY_COORDINATES = {
  'Kinshasa': { 
    lat: -4.3217, 
    lng: 15.3069,
    zones: [
      { name: 'Gombe', lat: -4.3079, lng: 15.3129 },
      { name: 'Kalamu', lat: -4.3431, lng: 15.2931 },
      { name: 'Limete', lat: -4.3800, lng: 15.2900 }
    ]
  },
  'Lubumbashi': { 
    lat: -11.6708, 
    lng: 27.4794,
    zones: [
      { name: 'Centre-ville', lat: -11.6708, lng: 27.4794 },
      { name: 'Kenya', lat: -11.6800, lng: 27.4850 }
    ]
  },
  'Kolwezi': { 
    lat: -10.7158, 
    lng: 25.4664,
    zones: [
      { name: 'Centre', lat: -10.7158, lng: 25.4664 }
    ]
  },
  'Abidjan': { 
    lat: 5.3600, 
    lng: -4.0083,
    zones: [
      { name: 'Plateau', lat: 5.3247, lng: -4.0147 },
      { name: 'Cocody', lat: 5.3472, lng: -3.9861 }
    ]
  }
} as const;

class UltraLocationService {
  private cache = new Map<string, any>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private currentCity = 'Kinshasa';

  setCurrentCity(city: string) {
    this.currentCity = city;
  }

  /**
   * Obtention de position ultra-robuste avec 6 niveaux de fallback
   */
  async getCurrentPosition(options: UltraLocationOptions = {}): Promise<LocationData> {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 300000,
      fallbackToIP = true,
      fallbackToDatabase = true,
      fallbackToDefault = true,
      city = this.currentCity
    } = options;

    console.log('🔍 UltraLocationService: Recherche position avec options:', options);

    // NIVEAU 1: Cache intelligent
    const cached = this.getFromCache(`position_${city}`);
    if (cached && this.isLocationValid(cached)) {
      console.log('✅ Position depuis cache ultra-rapide');
      return cached;
    }

    // NIVEAU 2: GPS haute précision avec retry
    try {
      const gpsLocation = await this.attemptGPSLocationWithRetry({
        enableHighAccuracy,
        timeout,
        maximumAge
      });
      
      if (gpsLocation && this.isLocationValid(gpsLocation)) {
        this.setCache(`position_${city}`, gpsLocation);
        console.log('✅ Position GPS haute précision obtenue');
        return gpsLocation;
      }
    } catch (error) {
      console.warn('⚠️ GPS échoué, passage au fallback IP');
    }

    // NIVEAU 3: Géolocalisation IP multi-services
    if (fallbackToIP) {
      try {
        const ipLocation = await this.attemptMultiIPLocation();
        if (ipLocation && this.isLocationValid(ipLocation)) {
          this.setCache(`position_${city}`, ipLocation);
          console.log('✅ Position IP multi-services obtenue');
          return ipLocation;
        }
      } catch (error) {
        console.warn('⚠️ IP Geolocation échouée, passage à la base de données');
      }
    }

    // NIVEAU 4: Base de données intelligente enrichie
    if (fallbackToDatabase) {
      try {
        const dbLocation = await this.attemptIntelligentDatabaseLocation(city);
        if (dbLocation && this.isLocationValid(dbLocation)) {
          console.log('✅ Position base de données intelligente obtenue');
          return dbLocation;
        }
      } catch (error) {
        console.warn('⚠️ Base de données échouée, passage aux coordonnées par défaut');
      }
    }

    // NIVEAU 5: Coordonnées par défaut avec zone aléatoire intelligente
    if (fallbackToDefault) {
      const defaultLocation = this.getSmartDefaultLocation(city);
      console.log('✅ Position par défaut intelligente générée');
      return defaultLocation;
    }

    throw new Error('Impossible de déterminer votre position malgré tous les fallbacks');
  }

  /**
   * GPS avec retry intelligent et gestion des erreurs améliorée
   */
  private async attemptGPSLocationWithRetry(options: any): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('📱 Géolocalisation non supportée par ce navigateur');
        resolve(null);
        return;
      }

      let attempts = 0;
      const maxAttempts = 3;

      const tryGeolocation = () => {
        attempts++;
        console.log(`🎯 Tentative GPS ${attempts}/${maxAttempts}`);

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: lat, longitude: lng, accuracy } = position.coords;
            
            // Validation ultra-stricte
            if (!this.validateCoordinates(lat, lng)) {
              if (attempts < maxAttempts) {
                setTimeout(tryGeolocation, 1000);
                return;
              }
              resolve(null);
              return;
            }

            try {
              const address = await this.reverseGeocodeWithFallback(lat, lng);
              const location: LocationData = {
                address: address || `Position GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                lat,
                lng,
                type: 'current',
                accuracy: accuracy || 0
              };

              console.log('🎯 GPS réussi:', location);
              resolve(location);
            } catch (error) {
              console.warn('⚠️ Reverse geocoding échoué, utilisation coordonnées brutes');
              resolve({
                address: `Position actuelle (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                lat,
                lng,
                type: 'current',
                accuracy: accuracy || 0
              });
            }
          },
          (error) => {
            console.warn(`❌ Erreur GPS tentative ${attempts}:`, error.message);
            if (attempts < maxAttempts) {
              // Retry avec options dégradées
              const degradedOptions = {
                ...options,
                enableHighAccuracy: attempts === 1 ? false : options.enableHighAccuracy,
                timeout: Math.min(options.timeout * attempts, 15000)
              };
              setTimeout(() => tryGeolocation(), 1500 * attempts);
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
   * Géolocalisation IP avec plusieurs services en parallèle
   */
  private async attemptMultiIPLocation(): Promise<LocationData | null> {
    const services = [
      () => this.tryIPAPI(),
      () => this.tryIPInfo(),
      () => this.tryIPGeolocationAPI()
    ];

    try {
      // Lancer tous les services en parallèle avec timeout
      const promises = services.map(service => 
        Promise.race([
          service(),
          new Promise<LocationData | null>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
        ]).catch(() => null)
      );

      const results = await Promise.all(promises);
      
      // Retourner le premier résultat valide
      for (const result of results) {
        if (result && this.isLocationValid(result)) {
          console.log('🌐 IP Geolocation multi-service réussie');
          return result;
        }
      }
    } catch (error) {
      console.warn('❌ Tous les services IP ont échoué');
    }

    return null;
  }

  private async tryIPAPI(): Promise<LocationData | null> {
    try {
      const response = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(2500) });
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          address: `${data.city || 'Ville'}, ${data.country_name || 'Pays'}`,
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          type: 'ip',
          accuracy: 50000
        };
      }
    } catch (error) {
      console.warn('IPAPI service failed:', error);
    }
    return null;
  }

  private async tryIPInfo(): Promise<LocationData | null> {
    try {
      const response = await fetch('https://ipinfo.io/json', { signal: AbortSignal.timeout(2500) });
      const data = await response.json();
      
      if (data.loc) {
        const [lat, lng] = data.loc.split(',').map(parseFloat);
        return {
          address: `${data.city || 'Ville'}, ${data.country || 'Pays'}`,
          lat,
          lng,
          type: 'ip',
          accuracy: 50000
        };
      }
    } catch (error) {
      console.warn('IPInfo service failed:', error);
    }
    return null;
  }

  private async tryIPGeolocationAPI(): Promise<LocationData | null> {
    try {
      const response = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=demo', { signal: AbortSignal.timeout(2500) });
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          address: `${data.city || 'Ville'}, ${data.country_name || 'Pays'}`,
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          type: 'ip',
          accuracy: 50000
        };
      }
    } catch (error) {
      console.warn('IPGeolocation service failed:', error);
    }
    return null;
  }

  /**
   * Base de données intelligente utilisant la nouvelle fonction enrichie
   */
  private async attemptIntelligentDatabaseLocation(city: string): Promise<LocationData | null> {
    try {
      console.log('🗄️ Recherche dans la base de données enrichie pour:', city);
      
      const { data, error } = await supabase.rpc('intelligent_places_search_enhanced', {
        search_query: '',
        search_city: city,
        max_results: 5
      });

      if (error) {
        console.warn('Erreur base de données:', error);
        return null;
      }

      if (data && data.length > 0) {
        // Sélectionner un lieu populaire aléatoire parmi les 3 premiers
        const randomPlace = data[Math.floor(Math.random() * Math.min(3, data.length))];
        
        return {
          address: randomPlace.formatted_address || randomPlace.name,
          lat: randomPlace.latitude,
          lng: randomPlace.longitude,
          type: 'database',
          name: randomPlace.name,
          subtitle: randomPlace.subtitle,
          accuracy: 1000
        };
      }
    } catch (error) {
      console.warn('Erreur base de données intelligente:', error);
    }

    return null;
  }

  /**
   * Position par défaut intelligente avec variabilité
   */
  private getSmartDefaultLocation(city: string): LocationData {
    const cityData = CITY_COORDINATES[city as keyof typeof CITY_COORDINATES] || CITY_COORDINATES.Kinshasa;
    
    // Sélectionner une zone aléatoire pour plus de réalisme
    const zones = cityData.zones || [{ name: 'Centre', lat: cityData.lat, lng: cityData.lng }];
    const randomZone = zones[Math.floor(Math.random() * zones.length)];
    
    // Ajouter une petite variation pour éviter des positions identiques
    const lat = randomZone.lat + (Math.random() - 0.5) * 0.01;
    const lng = randomZone.lng + (Math.random() - 0.5) * 0.01;

    return {
      address: `${randomZone.name}, ${city}`,
      lat,
      lng,
      type: 'fallback',
      accuracy: 5000,
      name: randomZone.name
    };
  }

  /**
   * Recherche de lieux ultra-rapide avec la nouvelle fonction
   */
  async searchLocation(query: string, currentLocation?: LocationData): Promise<LocationSearchResult[]> {
    if (!query.trim()) return [];

    const cacheKey = `search_${query.toLowerCase()}_${this.currentCity}`;
    
    // Cache ultra-rapide
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('⚡ Résultats depuis cache ultra-rapide');
      return cached;
    }

    // Debouncing intelligent
    const timerId = `search_${query}`;
    if (this.debounceTimers.has(timerId)) {
      clearTimeout(this.debounceTimers.get(timerId));
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          console.log('🔍 Recherche enrichie pour:', query);
          
          const { data, error } = await supabase.rpc('intelligent_places_search_enhanced', {
            search_query: query,
            search_city: this.currentCity,
            user_latitude: currentLocation?.lat || null,
            user_longitude: currentLocation?.lng || null,
            max_results: 10
          });

          if (error) {
            console.warn('Erreur recherche:', error);
            resolve(this.fallbackLocalSearch(query));
            return;
          }

          const results: LocationSearchResult[] = (data || []).map((place: any) => ({
            id: place.id,
            address: place.formatted_address,
            lat: place.latitude,
            lng: place.longitude,
            type: 'database' as const,
            title: place.name,
            subtitle: place.subtitle,
            name: place.name,
            badge: place.badge,
            isPopular: place.popularity_score > 80,
            distance_meters: place.distance_meters,
            relevance_score: place.relevance_score
          }));

          this.setCache(cacheKey, results);
          console.log(`✅ ${results.length} résultats trouvés`);
          resolve(results);
        } catch (error) {
          console.error('Erreur recherche:', error);
          resolve(this.fallbackLocalSearch(query));
        }
      }, 200); // Debounce plus court pour plus de réactivité

      this.debounceTimers.set(timerId, timer);
    });
  }

  /**
   * Recherche locale de fallback améliorée
   */
  private fallbackLocalSearch(query: string): LocationSearchResult[] {
    const cityData = CITY_COORDINATES[this.currentCity as keyof typeof CITY_COORDINATES] || CITY_COORDINATES.Kinshasa;
    
    const localPlaces = [
      { name: 'Centre-ville', category: 'district', coords: cityData },
      ...cityData.zones.map(zone => ({ name: zone.name, category: 'quartier', coords: zone }))
    ];

    return localPlaces
      .filter(place => place.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map((place, index) => ({
        id: `fallback-${index}`,
        address: `${place.name}, ${this.currentCity}`,
        lat: place.coords.lat,
        lng: place.coords.lng,
        type: 'database' as const,
        title: place.name,
        subtitle: `${place.category}, ${this.currentCity}`,
        name: place.name,
        accuracy: 1
      }));
  }

  /**
   * Reverse geocoding avec multiples fallbacks
   */
  private async reverseGeocodeWithFallback(lat: number, lng: number): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { lat, lng, type: 'reverse' }
      });

      if (!error && data?.results?.[0]) {
        return data.results[0].formatted_address;
      }
    } catch (error) {
      console.warn('Reverse geocoding API échoué');
    }

    // Fallback: Déterminer la ville la plus proche
    return this.getClosestCityAddress(lat, lng);
  }

  private getClosestCityAddress(lat: number, lng: number): string {
    let closestCity = this.currentCity;
    let minDistance = Infinity;

    Object.entries(CITY_COORDINATES).forEach(([city, coords]) => {
      const distance = this.calculateDistance(
        { lat, lng },
        { lat: coords.lat, lng: coords.lng }
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    });

    return `Près de ${closestCity} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }

  // =============== UTILITAIRES ===============

  private validateCoordinates(lat: number, lng: number): boolean {
    return !isNaN(lat) && !isNaN(lng) && 
           lat !== 0 && lng !== 0 &&
           Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  }

  private isLocationValid(location: any): boolean {
    return location && 
           location.address && 
           this.validateCoordinates(location.lat, location.lng);
  }

  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds} sec`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    return `${Math.round(seconds / 3600)} h`;
  }

  // =============== GESTION DU CACHE ===============

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
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
    console.log('🧹 Cache UltraLocationService nettoyé');
  }
}

export const ultraLocationService = new UltraLocationService();
export default ultraLocationService;