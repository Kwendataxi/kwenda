/**
 * MasterLocationService - Service de géolocalisation unifié et robuste
 * Remplace tous les services de géolocalisation existants
 * Système de fallbacks intelligent: GPS → IP → Base locale → Manuel
 */

import { Geolocation, Position } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { CountryService } from './countryConfig';
import { IPGeolocationService } from './ipGeolocation';

// ============ TYPES ET INTERFACES ============

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'ip' | 'fallback' | 'database';
  placeId?: string;
  accuracy?: number;
  commune?: string;
  city?: string;
  country?: string;
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title: string;
  subtitle?: string;
  relevanceScore?: number;
  isPopular?: boolean;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
}

interface CachedPosition {
  position: LocationData;
  timestamp: number;
  wasRealGPS: boolean;
  accuracy: number;
}

// ============ SERVICE PRINCIPAL ============

class MasterLocationService {
  private static instance: MasterLocationService;
  private cache = new Map<string, { result: LocationSearchResult[]; timestamp: number }>();
  private positionCache: CachedPosition | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly POSITION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): MasterLocationService {
    if (!this.instance) {
      this.instance = new MasterLocationService();
    }
    return this.instance;
  }

  constructor() {
    this.loadCachedPosition();
  }

  // ============ GÉOLOCALISATION GPS UNIFIÉE ============

  async getCurrentPosition(options: LocationOptions = {}): Promise<LocationData> {
    const defaultOptions: LocationOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 300000,
      fallbackToIP: true,
      fallbackToDatabase: true,
      fallbackToDefault: true,
      ...options
    };

    console.log('🚀 MasterLocationService: Début géolocalisation intelligente');

    try {
      // Étape 1: GPS en priorité
      const position = await this.attemptGPSLocation(defaultOptions);
      console.log('✅ GPS obtenu:', position);
      return position;
    } catch (gpsError) {
      console.warn('⚠️ GPS échoué:', gpsError);

      // Étape 2: Cache GPS récent si disponible
      if (this.positionCache && this.isCacheValid(this.positionCache.timestamp, this.POSITION_CACHE_DURATION) && this.positionCache.wasRealGPS) {
        console.log('📍 Utilisation cache GPS');
        return this.positionCache.position;
      }

      // Étape 3: IP géolocalisation
      if (defaultOptions.fallbackToIP) {
        try {
          const ipPosition = await this.getIPPosition();
          console.log('🌐 Position IP obtenue:', ipPosition);
          return ipPosition;
        } catch (ipError) {
          console.warn('⚠️ IP géolocalisation échouée:', ipError);
        }
      }

      // Étape 4: Base de données locale intelligente
      if (defaultOptions.fallbackToDatabase) {
        try {
          const dbPosition = await this.getDatabasePosition();
          console.log('💾 Position base de données:', dbPosition);
          return dbPosition;
        } catch (dbError) {
          console.warn('⚠️ Base de données échouée:', dbError);
        }
      }

      // Étape 5: Position par défaut en dernier recours
      if (defaultOptions.fallbackToDefault) {
        console.log('🏙️ Position par défaut');
        return this.getDefaultPosition();
      }

      throw new Error('Toutes les méthodes de géolocalisation ont échoué');
    }
  }

  private async attemptGPSLocation(options: LocationOptions): Promise<LocationData> {
    // Vérifications de sécurité
    if (!this.isSecureContext() && !this.isCapacitorAvailable()) {
      throw new Error('HTTPS_REQUIRED');
    }

    let position: Position | GeolocationPosition;

    if (this.isCapacitorAvailable()) {
      // Mobile/Native avec Capacitor
      console.log('📱 Capacitor Geolocation');
      
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
      console.log('🌐 Browser Geolocation');
      
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
      address: 'Position actuelle (GPS)',
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      type: 'current',
      accuracy: position.coords.accuracy
    };

    // Cache avec métadonnées
    this.positionCache = {
      position: locationData,
      timestamp: Date.now(),
      wasRealGPS: isRealGPS,
      accuracy: position.coords.accuracy || 0
    };
    this.saveCachedPosition();

    // Géocodage inverse intelligent
    try {
      const enrichedAddress = await this.reverseGeocodeIntelligent(locationData.lat, locationData.lng);
      locationData.address = enrichedAddress.address;
      locationData.commune = enrichedAddress.commune;
      locationData.city = enrichedAddress.city;
      locationData.country = enrichedAddress.country;
    } catch (e) {
      console.warn('Géocodage inverse échoué:', e);
    }

    return locationData;
  }

  private async getIPPosition(): Promise<LocationData> {
    const ipLocation = await IPGeolocationService.getLocationFromIP();
    if (!ipLocation) {
      throw new Error('IP_LOCATION_UNAVAILABLE');
    }

    const locationData: LocationData = {
      address: 'Position estimée via IP',
      lat: ipLocation.latitude,
      lng: ipLocation.longitude,
      type: 'ip',
      accuracy: 10000
    };

    // Cache IP
    this.positionCache = {
      position: locationData,
      timestamp: Date.now(),
      wasRealGPS: false,
      accuracy: 10000
    };

    return locationData;
  }

  private async getDatabasePosition(): Promise<LocationData> {
    // Utiliser la détection de pays pour choisir une position intelligente
    const country = CountryService.getCurrentCountry();
    const mainCity = country.majorCities[0];
    
    // Chercher un lieu populaire dans la base de données
    try {
      const { data, error } = await supabase
        .from('places_database')
        .select('*')
        .eq('country_code', country.code)
        .eq('city', mainCity.name)
        .eq('is_popular', true)
        .limit(1)
        .single();

      if (error) throw error;

      return {
        address: `${data.name_fr}, ${data.city}`,
        lat: Number(data.latitude),
        lng: Number(data.longitude),
        type: 'database',
        accuracy: data.accuracy || 1000,
        commune: data.commune,
        city: data.city,
        country: data.country_code
      };
    } catch (error) {
      throw new Error('DATABASE_LOCATION_FAILED');
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
      accuracy: 50000,
      city: mainCity.name,
      country: country.code
    };
  }

  // ============ RECHERCHE INTELLIGENTE ============

  async searchLocation(query: string, userLocation?: LocationData): Promise<LocationSearchResult[]> {
    if (!query.trim()) return [];

    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.timestamp, this.CACHE_DURATION)) {
      return cached.result;
    }

    try {
      console.log('🔍 Recherche intelligente:', query);
      
      // 1. Base de données locale en priorité
      const dbResults = await this.searchInDatabase(query, userLocation);
      
      // 2. Google API si nécessaire et si moins de 3 résultats locaux
      let apiResults: LocationSearchResult[] = [];
      if (dbResults.length < 3) {
        apiResults = await this.searchViaGoogleAPI(query, userLocation);
      }
      
      // 3. Combiner et dédupliquer intelligemment
      const allResults = this.combineAndRankResults(dbResults, apiResults, userLocation);
      
      // Cache
      this.cache.set(cacheKey, {
        result: allResults,
        timestamp: Date.now()
      });
      
      return allResults;
    } catch (error) {
      console.error('Erreur recherche:', error);
      
      // Fallback vers base locale seulement
      return await this.searchInDatabase(query, userLocation);
    }
  }

  private async searchInDatabase(query: string, userLocation?: LocationData): Promise<LocationSearchResult[]> {
    try {
      const country = CountryService.getCurrentCountry();
      
      const { data, error } = await supabase.rpc('search_places', {
        search_query: query,
        user_country_code: country.code,
        user_city: userLocation?.city || country.majorCities[0].name,
        max_results: 8
      });

      if (error) throw error;

      return (data || []).map((place: any) => ({
        id: `db_${place.id}`,
        address: place.name_fr,
        title: place.name_fr,
        subtitle: place.commune ? `${place.commune}, ${place.city}` : place.city,
        lat: Number(place.latitude),
        lng: Number(place.longitude),
        type: 'database' as const,
        placeId: place.id,
        relevanceScore: place.relevance_score,
        isPopular: place.is_popular,
        commune: place.commune,
        city: place.city,
        country: place.country_code
      }));
    } catch (error) {
      console.error('Erreur recherche base de données:', error);
      return [];
    }
  }

  private async searchViaGoogleAPI(query: string, userLocation?: LocationData): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { 
          query: query,
          location: userLocation ? `${userLocation.lat},${userLocation.lng}` : undefined
        }
      });

      if (error) throw error;
      
      return (data || []).slice(0, 5).map((result: any, index: number) => ({
        id: `google_${index}`,
        address: result.formatted_address,
        title: result.formatted_address.split(',')[0],
        subtitle: result.formatted_address.split(',').slice(1).join(',').trim(),
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        type: 'geocoded' as const,
        placeId: result.place_id,
        relevanceScore: 60 - (index * 5) // Score dégressif pour Google
      }));
    } catch (error) {
      console.error('Google API search failed:', error);
      return [];
    }
  }

  private combineAndRankResults(
    dbResults: LocationSearchResult[], 
    apiResults: LocationSearchResult[], 
    userLocation?: LocationData
  ): LocationSearchResult[] {
    // Combiner les résultats
    const allResults = [...dbResults, ...apiResults];
    
    // Dédupliquer par proximité géographique
    const uniqueResults = this.deduplicateByProximity(allResults, 500); // 500m
    
    // Trier par pertinence et proximité
    return uniqueResults
      .sort((a, b) => {
        // Priorité base de données
        if (a.type === 'database' && b.type !== 'database') return -1;
        if (b.type === 'database' && a.type !== 'database') return 1;
        
        // Puis par score de pertinence
        const scoreA = a.relevanceScore || 0;
        const scoreB = b.relevanceScore || 0;
        
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // Puis par popularité
        if (a.isPopular && !b.isPopular) return -1;
        if (b.isPopular && !a.isPopular) return 1;
        
        return 0;
      })
      .slice(0, 8);
  }

  // ============ GÉOCODAGE INVERSE INTELLIGENT ============

  private async reverseGeocodeIntelligent(lat: number, lng: number): Promise<{
    address: string;
    commune?: string;
    city?: string;
    country?: string;
  }> {
    try {
      // 1. Chercher dans la base locale d'abord
      const localResult = await this.reverseGeocodeFromDatabase(lat, lng);
      if (localResult) return localResult;

      // 2. Fallback vers Google API
      return await this.reverseGeocodeFromGoogle(lat, lng);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return { address: 'Position détectée' };
    }
  }

  private async reverseGeocodeFromDatabase(lat: number, lng: number): Promise<{
    address: string;
    commune?: string;
    city?: string;
    country?: string;
  } | null> {
    try {
      // Chercher le lieu le plus proche dans un rayon de 1km
      const { data, error } = await supabase
        .from('places_database')
        .select('*')
        .eq('is_active', true)
        .order('is_popular', { ascending: false })
        .limit(10);

      if (error || !data) return null;

      // Calculer les distances et trouver le plus proche
      let closest = null;
      let minDistance = Infinity;

      for (const place of data) {
        const distance = this.calculateDistance(
          { lat, lng },
          { lat: Number(place.latitude), lng: Number(place.longitude) }
        );
        
        if (distance < minDistance && distance < 1000) { // moins de 1km
          minDistance = distance;
          closest = place;
        }
      }

      if (!closest) return null;

      return {
        address: `Près de ${closest.name_fr}`,
        commune: closest.commune,
        city: closest.city,
        country: closest.country_code
      };
    } catch (error) {
      return null;
    }
  }

  private async reverseGeocodeFromGoogle(lat: number, lng: number): Promise<{
    address: string;
    commune?: string;
    city?: string;
    country?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('geocode-proxy', {
      body: { latlng: `${lat},${lng}` }
    });

    if (error) throw error;
    
    return {
      address: data.results?.[0]?.formatted_address || 'Position détectée'
    };
  }

  // ============ UTILITAIRES ============

  private deduplicateByProximity(results: LocationSearchResult[], proximityMeters: number): LocationSearchResult[] {
    const filtered: LocationSearchResult[] = [];
    
    for (const result of results) {
      const isDuplicate = filtered.some(existing => 
        this.calculateDistance(
          { lat: result.lat, lng: result.lng },
          { lat: existing.lat, lng: existing.lng }
        ) < proximityMeters
      );
      
      if (!isDuplicate) {
        filtered.push(result);
      }
    }
    
    return filtered;
  }

  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000; // Earth's radius in meters
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

  private isCacheValid(timestamp: number, maxAge: number): boolean {
    return Date.now() - timestamp < maxAge;
  }

  private isCapacitorAvailable(): boolean {
    return typeof window !== 'undefined' && 
           (window as any).Capacitor && 
           (window as any).Capacitor.isNativePlatform &&
           (window as any).Capacitor.isNativePlatform();
  }

  private isSecureContext(): boolean {
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  private loadCachedPosition(): void {
    try {
      const cached = localStorage.getItem('master_position_cache');
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
        localStorage.setItem('master_position_cache', JSON.stringify(this.positionCache));
      }
    } catch (error) {
      console.warn('Failed to save cached position:', error);
    }
  }

  // ============ MÉTHODES PUBLIQUES ADDITIONNELLES ============

  async getNearbyPlaces(lat: number, lng: number, radiusKm: number = 5): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('places_database')
        .select('*')
        .eq('is_active', true)
        .limit(20);

      if (error) throw error;

      return (data || [])
        .map((place: any) => {
          const distance = this.calculateDistance(
            { lat, lng },
            { lat: Number(place.latitude), lng: Number(place.longitude) }
          );
          
          return {
            id: `nearby_${place.id}`,
            address: place.name_fr,
            title: place.name_fr,
            subtitle: `${this.formatDistance(distance)} • ${place.commune || place.city}`,
            lat: Number(place.latitude),
            lng: Number(place.longitude),
            type: 'database' as const,
            placeId: place.id,
            isPopular: place.is_popular,
            distance
          };
        })
        .filter(place => place.distance <= radiusKm * 1000)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.positionCache = null;
    localStorage.removeItem('master_position_cache');
  }
}

// Instance singleton
export const masterLocationService = MasterLocationService.getInstance();
export default masterLocationService;