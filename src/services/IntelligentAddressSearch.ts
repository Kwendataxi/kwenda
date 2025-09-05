/**
 * Service de recherche d'adresses intelligent avec autocomplétion avancée
 * Similaire à l'expérience Yango avec scoring et gestion des erreurs robuste
 */

import { createClient } from '@supabase/supabase-js';

// Interface pour les résultats de recherche enrichis
export interface IntelligentSearchResult {
  id: string;
  name: string;
  category: string;
  city: string;
  commune?: string;
  lat: number;
  lng: number;
  hierarchy_level: number;
  popularity_score: number;
  relevance_score: number;
  type: 'database' | 'google' | 'popular' | 'recent';
  subtitle?: string;
  badge?: string;
}

// Options de recherche avancées
export interface SearchOptions {
  city?: string;
  country_code?: string;
  user_lat?: number;
  user_lng?: number;
  max_results?: number;
  min_hierarchy_level?: number;
  include_google_fallback?: boolean;
}

class IntelligentAddressSearchService {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  private cache = new Map<string, { data: IntelligentSearchResult[], timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_QUERY_LENGTH = 2;

  // Configuration des villes disponibles
  private readonly CITIES_CONFIG = {
    'Kinshasa': {
      country_code: 'CD',
      center: { lat: -4.3317, lng: 15.3139 },
      communes: [
        'Bandalungwa', 'Barumbu', 'Gombe', 'Kalamu', 'Kasa-Vubu',
        'Kimbanseke', 'Kinshasa', 'Kintambo', 'Lemba', 'Limete',
        'Lingwala', 'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula',
        'Ndjili', 'Ngaba', 'Ngaliema', 'Ngiri-Ngiri', 'Nsele', 'Selembao'
      ]
    },
    'Lubumbashi': {
      country_code: 'CD',
      center: { lat: -11.6792, lng: 27.4716 },
      communes: ['Annexe', 'Kampemba', 'Katuba', 'Kenya', 'Lubumbashi', 'Ruashi', 'Rwashi']
    },
    'Kolwezi': {
      country_code: 'CD',
      center: { lat: -10.7147, lng: 25.4665 },
      communes: ['Dilala', 'Manika', 'Mutoshi']
    }
  };

  /**
   * Recherche intelligente avec autocomplétion
   */
  async search(query: string, options: SearchOptions = {}): Promise<IntelligentSearchResult[]> {
    if (!query || query.length < this.MIN_QUERY_LENGTH) {
      return this.getPopularPlaces(options);
    }

    const cacheKey = this.getCacheKey(query, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const results = await this.performSearch(query, options);
      this.saveToCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Intelligent search error:', error);
      return this.getPopularPlaces(options);
    }
  }

  /**
   * Recherche principale avec base de données et fallback Google
   */
  private async performSearch(query: string, options: SearchOptions): Promise<IntelligentSearchResult[]> {
    const {
      city = 'Kinshasa',
      country_code = 'CD',
      user_lat,
      user_lng,
      max_results = 10,
      min_hierarchy_level = 1,
      include_google_fallback = false
    } = options;

    // 1. Recherche dans la base de données locale
    const dbResults = await this.searchInDatabase(
      query, city, country_code, user_lat, user_lng, max_results, min_hierarchy_level
    );

    // 2. Si pas assez de résultats et Google fallback activé
    if (dbResults.length < max_results && include_google_fallback) {
      const googleResults = await this.searchWithGoogleFallback(query, city, max_results - dbResults.length);
      return [...dbResults, ...googleResults];
    }

    return dbResults;
  }

  /**
   * Recherche dans la base de données optimisée
   */
  private async searchInDatabase(
    query: string, city: string, country_code: string,
    user_lat?: number, user_lng?: number, max_results: number = 10, min_hierarchy_level: number = 1
  ): Promise<IntelligentSearchResult[]> {
    try {
      const { data, error } = await this.supabase
        .from('intelligent_places')
        .select('*')
        .eq('city', city)
        .eq('country_code', country_code)
        .gte('hierarchy_level', min_hierarchy_level)
        .or(`name.ilike.%${query}%,alt_names.ilike.%${query}%,commune.ilike.%${query}%`)
        .order('popularity_score', { ascending: false })
        .limit(max_results);

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
   * Recherche via Google API avec proxy Supabase
   */
  private async searchWithGoogleFallback(query: string, city: string, max_results: number): Promise<IntelligentSearchResult[]> {
    try {
      const { data, error } = await this.supabase.functions.invoke('geocode-proxy', {
        body: {
          address: `${query}, ${city}`,
          region: 'CD',
          language: 'fr'
        }
      });

      if (error || !data?.results) {
        console.error('Google geocoding error:', error);
        return [];
      }

      return data.results.slice(0, max_results).map((result: any, index: number) => ({
        id: `google_${result.place_id || index}`,
        name: result.formatted_address || query,
        category: 'location',
        city: city,
        lat: result.geometry?.location?.lat || 0,
        lng: result.geometry?.location?.lng || 0,
        hierarchy_level: 2,
        popularity_score: 40 - index * 5,
        relevance_score: 60 - index * 5,
        type: 'google' as const,
        subtitle: `Trouvé via Google Maps`,
        badge: 'Maps'
      }));
    } catch (error) {
      console.error('Google fallback failed:', error);
      return [];
    }
  }

  /**
   * Récupération des lieux populaires
   */
  async getPopularPlaces(options: SearchOptions = {}): Promise<IntelligentSearchResult[]> {
    const { city = 'Kinshasa', country_code = 'CD', max_results = 8 } = options;

    try {
      const { data, error } = await this.supabase
        .from('intelligent_places')
        .select('*')
        .eq('city', city)
        .eq('country_code', country_code)
        .gte('hierarchy_level', 2)
        .order('popularity_score', { ascending: false })
        .limit(max_results);

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
   * Lieux populaires de fallback hardcodés
   */
  private getFallbackPopularPlaces(city: string): IntelligentSearchResult[] {
    const fallbackPlaces = {
      'Kinshasa': [
        { name: 'Aéroport International Ndjili', lat: -4.3851, lng: 15.4446, commune: 'Ndjili', category: 'transport' },
        { name: 'Centre-ville Gombe', lat: -4.3167, lng: 15.3167, commune: 'Gombe', category: 'center' },
        { name: 'Marché Central', lat: -4.3217, lng: 15.3069, commune: 'Kinshasa', category: 'shopping' },
        { name: 'Université de Kinshasa', lat: -4.4333, lng: 15.3000, commune: 'Lemba', category: 'education' },
        { name: 'Stade des Martyrs', lat: -4.3333, lng: 15.3167, commune: 'Lingwala', category: 'sports' },
        { name: 'Grand Marché', lat: -4.3250, lng: 15.3100, commune: 'Kinshasa', category: 'shopping' },
        { name: 'Hôpital Général', lat: -4.3200, lng: 15.3150, commune: 'Gombe', category: 'hospital' },
        { name: 'Bandalungwa', lat: -4.3833, lng: 15.3000, commune: 'Bandalungwa', category: 'residential' }
      ]
    };

    const places = fallbackPlaces[city as keyof typeof fallbackPlaces] || fallbackPlaces['Kinshasa'];
    
    return places.map((place, index) => ({
      id: `fallback_${index}`,
      name: place.name,
      category: place.category,
      city: city,
      commune: place.commune,
      lat: place.lat,
      lng: place.lng,
      hierarchy_level: 3,
      popularity_score: 90 - index * 5,
      relevance_score: 90 - index * 5,
      type: 'popular' as const,
      subtitle: `${place.commune}, ${city}`,
      badge: 'Populaire'
    }));
  }

  /**
   * Transformation des résultats de base de données
   */
  private transformDatabaseResult = (item: any): IntelligentSearchResult => {
    return {
      id: item.id || item.place_id || `db_${Date.now()}_${Math.random()}`,
      name: item.name || 'Lieu sans nom',
      category: item.category || 'location',
      city: item.city || 'Kinshasa',
      commune: item.commune || '',
      lat: item.latitude || item.lat || 0,
      lng: item.longitude || item.lng || 0,
      hierarchy_level: item.hierarchy_level || 1,
      popularity_score: item.popularity_score || 0,
      relevance_score: item.relevance_score || 50,
      type: 'database' as const,
      subtitle: `${item.commune || ''}, ${item.city || 'Kinshasa'}`.replace(/^,\s*/, ''),
      badge: this.getBadgeForHierarchy(item.hierarchy_level || 1)
    };
  };

  /**
   * Badge selon niveau hiérarchique
   */
  private getBadgeForHierarchy(level: number): string {
    const badges = {
      1: 'Quartier',
      2: 'Zone',
      3: 'Important',
      4: 'Majeur',
      5: 'Emblématique'
    };
    return badges[level as keyof typeof badges] || 'Lieu';
  }

  /**
   * Gestion du cache
   */
  private getCacheKey(query: string, options: SearchOptions): string {
    return `${query}_${options.city || 'Kinshasa'}_${options.max_results || 10}`;
  }

  private getFromCache(key: string): IntelligentSearchResult[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private saveToCache(key: string, data: IntelligentSearchResult[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Historique de recherche (placeholder pour implémentation future)
   */
  async getRecentSearches(): Promise<IntelligentSearchResult[]> {
    return [];
  }

  async saveSearchToHistory(result: IntelligentSearchResult): Promise<void> {
    // À implémenter : sauvegarde en localStorage ou base de données
  }
}

// Instance exportée
export const intelligentAddressSearch = new IntelligentAddressSearchService();