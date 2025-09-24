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
        `${this.currentCity.name}, ${this.currentCity.countryCode === 'CD' ? 'République Démocratique du Congo' : 'Côte d\'Ivoire'}`
      );
    }

    throw new Error('Impossible d\'obtenir la position');
  }

  /**
   * Rechercher des lieux avec cache et fallbacks améliorés
   */
  async searchLocations(
    query: string, 
    city: string = this.currentCity.name, 
    maxResults: number = 10
  ): Promise<LocationSearchResult[]> {
    const cacheKey = `search_${query}_${city}_${maxResults}`;
    
    // Vérifier le cache d'abord
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('📱 Using cached search results for:', query);
      return cached;
    }

    try {
      const results = await this.performSearch(query, city, maxResults);
      this.saveToCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('❌ Search failed, using fallback:', error);
      
      // Fallback robuste avec recherche locale offline
      return this.getFallbackSearchResults(query, city, maxResults);
    }
  }

  /**
   * Exécuter la recherche principale
   */
  private async performSearch(query: string, city: string, maxResults: number): Promise<LocationSearchResult[]> {
    const results: LocationSearchResult[] = [];

    // 1. Recherche dans la base de données Supabase
    try {
      const dbResults = await this.searchInDatabase(query, city, maxResults);
      results.push(...dbResults);
    } catch (dbError) {
      console.warn('Database search failed:', dbError);
    }

    // 2. Si pas assez de résultats, recherche Google Maps via proxy
    if (results.length < maxResults) {
      try {
        const googleResults = await this.searchWithGoogleMaps(query, city, maxResults - results.length);
        results.push(...googleResults);
      } catch (googleError) {
        console.warn('Google Maps search failed:', googleError);
      }
    }

    // 3. Tri par pertinence et limitation
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Recherche dans la base de données Supabase
   */
  private async searchInDatabase(query: string, city: string, maxResults: number): Promise<LocationSearchResult[]> {
    const { data, error } = await supabase
      .rpc('intelligent_places_search', {
        search_query: query,
        search_city: city,
        max_results: maxResults
      });

    if (error) throw error;

    return data?.map((item: any) => this.transformDatabaseResult(item)) || [];
  }

  /**
   * Recherche via Google Maps (via edge function proxy)
   */
  private async searchWithGoogleMaps(query: string, city: string, maxResults: number): Promise<LocationSearchResult[]> {
    const { data, error } = await supabase.functions.invoke('geocode-proxy', {
      body: {
        query: `${query}, ${city}`,
        type: 'search',
        maxResults
      }
    });

    if (error) throw error;

    return data?.results?.map((result: any, index: number) => 
      this.transformGoogleResult(result, index, city)
    ) || [];
  }

  /**
   * Obtenir les lieux populaires avec fallbacks
   */
  async getPopularLocations(city: string, maxResults: number = 8): Promise<LocationSearchResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('intelligent_places_search', {
          search_query: '',
          search_city: city,
          max_results: maxResults
        });

      if (error) throw error;

      return data?.map((item: any) => this.transformDatabaseResult(item)) || [];
    } catch (error) {
      console.error('❌ Failed to get popular locations, using fallback:', error);
      return this.getFallbackPopularPlaces(city);
    }
  }

  /**
   * Recherche locale de fallback quand les services externes échouent
   */
  private getFallbackSearchResults(query: string, city: string, maxResults: number = 10): LocationSearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Si query vide, retourner les lieux populaires
    if (!normalizedQuery) {
      return this.getFallbackPopularPlaces(city);
    }

    const fallbackPlaces = this.getFallbackPopularPlaces(city);
    
    // Filtrer les lieux selon la query
    return fallbackPlaces
      .filter(place => 
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.address.toLowerCase().includes(normalizedQuery) ||
        place.subtitle?.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, maxResults);
  }

  /**
   * Lieux populaires de fallback par ville (améliorés)
   */
  private getFallbackPopularPlaces(city: string): LocationSearchResult[] {
    const places = {
      'Kinshasa': [
        { name: 'Gombe Centre-ville', coords: { lat: -4.3175, lng: 15.3117 }, commune: 'Gombe', category: 'Centre commercial' },
        { name: 'Aéroport de N\'djili', coords: { lat: -4.3856, lng: 15.4446 }, commune: 'Ndjili', category: 'Transport' },
        { name: 'Marché Central', coords: { lat: -4.3217, lng: 15.3069 }, commune: 'Kinshasa', category: 'Commerce' },
        { name: 'Université de Kinshasa (UNIKIN)', coords: { lat: -4.4326, lng: 15.2662 }, commune: 'Lemba', category: 'Éducation' },
        { name: 'Stade des Martyrs', coords: { lat: -4.3425, lng: 15.3436 }, commune: 'Lingwala', category: 'Sport' },
        { name: 'Boulevard du 30 Juin', coords: { lat: -4.3200, lng: 15.3100 }, commune: 'Gombe', category: 'Avenue principale' },
        { name: 'Marché de la Liberté', coords: { lat: -4.3800, lng: 15.3200 }, commune: 'Masina', category: 'Commerce' },
        { name: 'Clinique Ngaliema', coords: { lat: -4.3900, lng: 15.2500 }, commune: 'Ngaliema', category: 'Santé' }
      ],
      'Lubumbashi': [
        { name: 'Centre-ville Lubumbashi', coords: { lat: -11.6792, lng: 27.4716 }, commune: 'Lubumbashi', category: 'Centre commercial' },
        { name: 'Aéroport Luano', coords: { lat: -11.5913, lng: 27.5306 }, commune: 'Annexe', category: 'Transport' },
        { name: 'Université de Lubumbashi', coords: { lat: -11.6600, lng: 27.4800 }, commune: 'Lubumbashi', category: 'Éducation' },
        { name: 'Marché Kenya', coords: { lat: -11.6700, lng: 27.4600 }, commune: 'Kenya', category: 'Commerce' }
      ],
      'Kolwezi': [
        { name: 'Centre-ville Kolwezi', coords: { lat: -10.7147, lng: 25.4665 }, commune: 'Kolwezi', category: 'Centre commercial' },
        { name: 'Mine de Mutanda', coords: { lat: -10.6500, lng: 25.5000 }, commune: 'Mutoshi', category: 'Industriel' }
      ],
      'Abidjan': [
        { name: 'Plateau Centre', coords: { lat: 5.3199, lng: -4.0200 }, commune: 'Plateau', category: 'Centre commercial' },
        { name: 'Aéroport Félix Houphouët-Boigny', coords: { lat: 5.2614, lng: -3.9263 }, commune: 'Port-Bouët', category: 'Transport' },
        { name: 'Cocody Université', coords: { lat: 5.3800, lng: -3.9800 }, commune: 'Cocody', category: 'Éducation' }
      ]
    };

    const cityPlaces = places[city] || places['Kinshasa'];
    
    return cityPlaces.map((place, index) => ({
      id: `fallback_${city}_${index}`,
      name: place.name,
      address: `${place.name}, ${place.commune}, ${city}`,
      coordinates: place.coords,
      type: 'popular' as const,
      subtitle: `${place.commune}, ${city}`,
      category: place.category,
      relevanceScore: 0.9 - (index * 0.05),
      popularityScore: 95 - (index * 5),
      badge: 'Populaire',
      confidence: 0.8
    }));
  }

  /**
   * Géocodage inverse pour obtenir une adresse à partir de coordonnées
   */
  async reverseGeocode(coordinates: UnifiedCoordinates): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-reverse', {
        body: {
          lat: coordinates.lat,
          lng: coordinates.lng
        }
      });

      if (error) throw error;

      return data?.address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      
      // Fallback basé sur la ville détectée
      const detectedCity = getCityByCoordinates(coordinates);
      return `${detectedCity.name}, ${detectedCity.countryCode === 'CD' ? 'RDC' : 'Côte d\'Ivoire'}`;
    }
  }

  /**
   * Calculer la distance entre deux points (formule de Haversine)
   */
  calculateDistance(point1: UnifiedCoordinates, point2: UnifiedCoordinates): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  }

  /**
   * Formater une distance en texte lisible
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  // Méthodes utilitaires privées
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
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const coords: UnifiedCoordinates = {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude)
        };

        if (validateCoordinates(coords)) {
          return createUnifiedLocation(
            'ip_location',
            'Position approximative',
            coords,
            `${data.city}, ${data.country_name}`
          );
        }
      }
    } catch (error) {
      console.warn('IP geolocation failed:', error);
    }
    
    return null;
  }

  private async getLastKnownLocation(): Promise<UnifiedLocation | null> {
    // TODO: Implémenter la récupération de la dernière position connue depuis la DB
    return null;
  }

  private transformDatabaseResult(item: any): LocationSearchResult {
    return {
      id: item.id || `db_${Date.now()}_${Math.random()}`,
      name: item.name || 'Lieu inconnu',
      address: item.formatted_address || `${item.name}, ${item.city}`,
      coordinates: {
        lat: parseFloat(item.latitude) || 0,
        lng: parseFloat(item.longitude) || 0
      },
      type: 'database' as const,
      subtitle: item.subtitle || `${item.commune}, ${item.city}`,
      category: item.category,
      relevanceScore: parseFloat(item.relevance_score) || 0,
      popularityScore: parseInt(item.popularity_score) || 0,
      distanceFromUser: item.distance_meters || undefined,
      badge: item.badge || undefined,
      confidence: 0.9
    };
  }

  private transformGoogleResult(result: any, index: number, city: string): LocationSearchResult {
    const coords = result.geometry?.location || { lat: 0, lng: 0 };
    
    return {
      id: `google_${Date.now()}_${index}`,
      name: result.name || 'Lieu Google',
      address: result.formatted_address || result.vicinity || '',
      coordinates: {
        lat: parseFloat(coords.lat) || 0,
        lng: parseFloat(coords.lng) || 0
      },
      type: 'google' as const,
      subtitle: city,
      category: result.types?.[0] || 'lieu',
      relevanceScore: 0.7 - (index * 0.1),
      popularityScore: result.rating ? Math.round(result.rating * 20) : 50,
      badge: result.rating ? '⭐' : undefined,
      confidence: 0.8
    };
  }

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

  public setCurrentCity(city: string): void {
    const cityConfig = SUPPORTED_CITIES[city.toLowerCase()];
    if (cityConfig) {
      this.currentCity = cityConfig;
      this.clearCache(); // Vider le cache lors du changement de ville
    }
  }

  public getCurrentCity(): CityConfig {
    return this.currentCity;
  }
}

// Export de l'instance singleton
export const enhancedLocationService = EnhancedLocationService.getInstance();