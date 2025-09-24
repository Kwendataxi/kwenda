/**
 * Service de géolocalisation unifié et amélioré pour Kwenda
 * Remplace les anciens services avec une approche unifiée
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  UnifiedLocation, 
  UnifiedCoordinates, 
  LocationSearchResult, 
  GeolocationOptions,
  CityConfig,
  getCurrentCity,
  getCityByCoordinates,
  validateCoordinates,
  createUnifiedLocation,
  SUPPORTED_CITIES
} from '@/types/unifiedLocation';

class EnhancedLocationService {
  private static instance: EnhancedLocationService;
  private currentCity: CityConfig = getCurrentCity();
  private cache = new Map<string, { data: LocationSearchResult[], timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): EnhancedLocationService {
    if (!EnhancedLocationService.instance) {
      EnhancedLocationService.instance = new EnhancedLocationService();
    }
    return EnhancedLocationService.instance;
  }

  /**
   * Obtenir la position actuelle avec fallbacks robustes
   */
  async getCurrentPosition(options: GeolocationOptions = {}): Promise<UnifiedLocation> {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 300000, // 5 minutes
      fallbackToIP = true,
      fallbackToDatabase = true,
      fallbackToDefault = true
    } = options;

    try {
      // 1. Essayer GPS natif
      const position = await this.getGPSPosition({
        enableHighAccuracy,
        timeout,
        maximumAge
      });

      const coords: UnifiedCoordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      if (validateCoordinates(coords)) {
        const address = await this.reverseGeocode(coords);
        const detectedCity = getCityByCoordinates(coords);
        
        return createUnifiedLocation(
          'current_location',
          'Ma position actuelle',
          coords,
          address
        );
      }
    } catch (gpsError) {
      console.warn('GPS failed:', gpsError);
    }

    // 2. Fallback IP géolocalisation
    if (fallbackToIP) {
      try {
        const ipLocation = await this.getIPLocation();
        if (ipLocation) return ipLocation;
      } catch (ipError) {
        console.warn('IP geolocation failed:', ipError);
      }
    }

    // 3. Fallback base de données (dernière position connue)
    if (fallbackToDatabase) {
      try {
        const dbLocation = await this.getLastKnownLocation();
        if (dbLocation) return dbLocation;
      } catch (dbError) {
        console.warn('Database fallback failed:', dbError);
      }
    }

    // 4. Fallback par défaut (centre-ville de la ville courante)
    if (fallbackToDefault) {
      return createUnifiedLocation(
        'default_location',
        `Centre-ville ${this.currentCity.name}`,
        this.currentCity.defaultCoordinates,
        `Centre-ville ${this.currentCity.name}, ${this.currentCity.countryCode === 'CD' ? 'RDC' : 'Côte d\'Ivoire'}`
      );
    }

    throw new Error('Impossible de déterminer la position');
  }

  /**
   * Recherche intelligente unifiée
   */
  async searchLocations(
    query: string, 
    city: string = this.currentCity.name,
    maxResults: number = 10
  ): Promise<LocationSearchResult[]> {
    if (!query || query.length < 2) {
      return this.getPopularLocations(city, maxResults);
    }

    const cacheKey = `${query}_${city}_${maxResults}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const results = await this.performSearch(query, city, maxResults);
      this.saveToCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return this.getPopularLocations(city, maxResults);
    }
  }

  /**
   * Recherche principale avec priorisation
   */
  private async performSearch(query: string, city: string, maxResults: number): Promise<LocationSearchResult[]> {
    const allResults: LocationSearchResult[] = [];

    // 1. Recherche dans la base de données Supabase
    const dbResults = await this.searchInDatabase(query, city, Math.ceil(maxResults * 0.7));
    allResults.push(...dbResults);

    // 2. Recherche Google Maps si pas assez de résultats
    if (allResults.length < maxResults) {
      const googleResults = await this.searchWithGoogleMaps(query, city, maxResults - allResults.length);
      allResults.push(...googleResults);
    }

    // 3. Trier par pertinence
    return allResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Recherche dans la base de données Supabase
   */
  private async searchInDatabase(query: string, city: string, maxResults: number): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('intelligent_places_search', {
          search_query: query,
          search_city: city,
          max_results: maxResults
        });

      if (error) {
        console.error('Database search error:', error);
        return [];
      }

      return (data || []).map(this.transformDatabaseResult);
    } catch (error) {
      console.error('Database search failed:', error);
      return [];
    }
  }

  /**
   * Recherche via Google Maps avec proxy
   */
  private async searchWithGoogleMaps(query: string, city: string, maxResults: number): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: {
          query: `${query}, ${city}`,
          region: city === 'Abidjan' ? 'ci' : 'cd'
        }
      });

      if (error || !data?.results) {
        console.warn('Google Maps search failed:', error);
        return [];
      }

      return data.results.slice(0, maxResults).map((result: any, index: number) => 
        this.transformGoogleResult(result, index, city)
      );
    } catch (error) {
      console.error('Google Maps search error:', error);
      return [];
    }
  }

  /**
   * Lieux populaires par ville
   */
  async getPopularLocations(city: string, maxResults: number = 8): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('intelligent_places')
        .select('*')
        .eq('city', city)
        .eq('is_active', true)
        .gte('popularity_score', 30)
        .order('popularity_score', { ascending: false })
        .limit(maxResults);

      if (error) {
        console.error('Popular places error:', error);
        return this.getFallbackPopularPlaces(city);
      }

      const results = (data || []).map(this.transformDatabaseResult);
      return results.length > 0 ? results : this.getFallbackPopularPlaces(city);
    } catch (error) {
      console.error('Popular places failed:', error);
      return this.getFallbackPopularPlaces(city);
    }
  }

  /**
   * Géocodage inverse unifié
   */
  async reverseGeocode(coordinates: UnifiedCoordinates): Promise<string> {
    if (!validateCoordinates(coordinates)) {
      throw new Error('Coordonnées invalides');
    }

    try {
      const { data, error } = await supabase.functions.invoke('geocode-reverse', {
        body: {
          lat: coordinates.lat,
          lng: coordinates.lng
        }
      });

      if (error || !data?.address) {
        console.warn('Reverse geocoding failed:', error);
        return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
      }

      return data.address;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
    }
  }

  /**
   * Calcul de distance entre deux points
   */
  calculateDistance(point1: UnifiedCoordinates, point2: UnifiedCoordinates): number {
    if (!validateCoordinates(point1) || !validateCoordinates(point2)) {
      return 0;
    }

    const R = 6371000; // Rayon de la Terre en mètres
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

  /**
   * Formatage de distance
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  // Méthodes privées utilitaires

  private async getGPSPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  private async getIPLocation(): Promise<UnifiedLocation | null> {
    try {
      // Utiliser un service de géolocalisation IP
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const coords: UnifiedCoordinates = {
          lat: data.latitude,
          lng: data.longitude
        };

        return createUnifiedLocation(
          'ip_location',
          data.city || 'Position approximative',
          coords,
          `${data.city || ''}, ${data.country_name || ''}`
        );
      }
    } catch (error) {
      console.error('IP geolocation failed:', error);
    }
    return null;
  }

  private async getLastKnownLocation(): Promise<UnifiedLocation | null> {
    // Implémenter la récupération de la dernière position en base
    return null;
  }

  private transformDatabaseResult = (item: any): LocationSearchResult => ({
    id: item.id || `db_${Date.now()}`,
    name: item.name || 'Lieu sans nom',
    address: item.formatted_address || item.name,
    coordinates: { lat: item.latitude || 0, lng: item.longitude || 0 },
    subtitle: item.subtitle || `${item.commune || ''}, ${item.city || ''}`.replace(/^,\s*/, ''),
    type: 'database',
    city: item.city,
    commune: item.commune,
    category: item.category,
    confidence: (item.relevance_score || 50) / 100,
    verified: item.is_verified || false,
    badge: item.badge,
    relevanceScore: item.relevance_score || 50,
    popularityScore: item.popularity_score || 0,
    distanceFromUser: item.distance_meters || undefined
  });

  private transformGoogleResult = (result: any, index: number, city: string): LocationSearchResult => ({
    id: `google_${result.place_id || index}`,
    name: result.formatted_address || result.name,
    address: result.formatted_address,
    coordinates: {
      lat: result.geometry?.location?.lat || 0,
      lng: result.geometry?.location?.lng || 0
    },
    subtitle: 'Trouvé via Google Maps',
    type: 'google',
    city: city,
    category: 'location',
    confidence: 0.8 - index * 0.1,
    verified: false,
    badge: 'Google',
    relevanceScore: 70 - index * 5,
    popularityScore: 50 - index * 5
  });

  private getFallbackPopularPlaces(city: string): LocationSearchResult[] {
    const cityConfig = SUPPORTED_CITIES[city.toLowerCase()];
    if (!cityConfig) return [];

    const fallbackPlaces = {
      'Kinshasa': [
        { name: 'Aéroport International Ndjili', coords: { lat: -4.3851, lng: 15.4446 }, commune: 'Ndjili' },
        { name: 'Centre-ville Gombe', coords: { lat: -4.3167, lng: 15.3167 }, commune: 'Gombe' },
        { name: 'Marché Central', coords: { lat: -4.3217, lng: 15.3069 }, commune: 'Kinshasa' },
        { name: 'Université de Kinshasa', coords: { lat: -4.4333, lng: 15.3000 }, commune: 'Lemba' }
      ],
      'Lubumbashi': [
        { name: 'Aéroport Luano', coords: { lat: -11.5913, lng: 27.5309 }, commune: 'Annexe' },
        { name: 'Centre-ville', coords: { lat: -11.6792, lng: 27.4716 }, commune: 'Lubumbashi' }
      ],
      'Kolwezi': [
        { name: 'Centre-ville', coords: { lat: -10.7147, lng: 25.4665 }, commune: 'Kolwezi' }
      ],
      'Abidjan': [
        { name: 'Plateau', coords: { lat: 5.3364, lng: -4.0267 }, commune: 'Plateau' },
        { name: 'Cocody', coords: { lat: 5.3617, lng: -3.9833 }, commune: 'Cocody' }
      ]
    };

    const places = fallbackPlaces[city as keyof typeof fallbackPlaces] || [];
    
    return places.map((place, index) => ({
      id: `fallback_${city}_${index}`,
      name: place.name,
      address: `${place.name}, ${place.commune}, ${city}`,
      coordinates: place.coords,
      subtitle: `${place.commune}, ${city}`,
      type: 'popular' as const,
      city: city,
      commune: place.commune,
      category: 'landmark',
      confidence: 0.9,
      verified: true,
      badge: 'Populaire',
      relevanceScore: 80 - index * 5,
      popularityScore: 90 - index * 5
    }));
  }

  // Gestion du cache
  private getFromCache(key: string): LocationSearchResult[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private saveToCache(key: string, data: LocationSearchResult[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  // Gestion de la ville courante
  setCurrentCity(city: string): void {
    const cityConfig = SUPPORTED_CITIES[city.toLowerCase()];
    if (cityConfig) {
      this.currentCity = cityConfig;
      this.clearCache(); // Vider le cache car la ville a changé
    }
  }

  getCurrentCity(): CityConfig {
    return this.currentCity;
  }
}

// Instance exportée
export const enhancedLocationService = EnhancedLocationService.getInstance();