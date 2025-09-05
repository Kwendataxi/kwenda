/**
 * Service de recherche d'adresses intelligent pour Kwenda
 * Similaire à l'expérience Yango avec autocomplétion et scoring avancé
 */

import { supabase } from '@/integrations/supabase/client';
import { unifiedLocationService } from './unifiedLocationService';

export interface IntelligentSearchResult {
  id: string;
  name: string;
  name_fr?: string;
  name_local?: string;
  category: string;
  city: string;
  commune?: string;
  lat: number;
  lng: number;
  hierarchy_level: number;
  popularity_score: number;
  relevance_score: number;
  distance_km?: number;
  type: 'database' | 'google' | 'popular';
  badge?: string;
  subtitle?: string;
  aliases?: string[];
  address_components?: any;
  phone_number?: string;
  website?: string;
}

export interface SearchOptions {
  city?: string;
  country_code?: string;
  user_lat?: number;
  user_lng?: number;
  max_results?: number;
  min_hierarchy_level?: number;
  include_google_fallback?: boolean;
  cache_duration?: number;
  prioritizeCurrentCity?: boolean;
  includeGoogleFallback?: boolean;
}

class IntelligentAddressSearchService {
  private cache = new Map<string, { results: IntelligentSearchResult[]; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MIN_QUERY_LENGTH = 2;
  
  // City configurations for the three main cities
  private readonly CITY_CONFIGS = {
    'Kinshasa': {
      country_code: 'CD',
      center: { lat: -4.3217, lng: 15.3069 },
      communes: [
        'Bandalungwa', 'Barumbu', 'Gombe', 'Kalamu', 'Kasa-Vubu', 
        'Kimbanseke', 'Kinshasa', 'Kintambo', 'Kisenso', 'Lemba',
        'Limete', 'Lingwala', 'Makala', 'Maluku', 'Masina', 
        'Matete', 'Mont-Ngafula', 'Ndjili', 'Ngaba', 'Ngaliema',
        'Ngiri-Ngiri', 'Nsele', 'Selembao'
      ]
    },
    'Lubumbashi': {
      country_code: 'CD',
      center: { lat: -11.6792, lng: 27.4716 },
      communes: [
        'Annexe', 'Kampemba', 'Katuba', 'Kenya', 'Lubumbashi',
        'Ruashi', 'Rwashi'
      ]
    },
    'Kolwezi': {
      country_code: 'CD',
      center: { lat: -10.7147, lng: 25.4665 },
      communes: [
        'Dilala', 'Manika', 'Mutoshi'
      ]
    }
  };

  /**
   * Recherche intelligente avec autocomplétion
   */
  async search(
    query: string, 
    options: SearchOptions = {}
  ): Promise<IntelligentSearchResult[]> {
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
      return [];
    }
  }

  /**
   * Recherche principale avec base de données et fallback Google
   */
  private async performSearch(
    query: string, 
    options: SearchOptions
  ): Promise<IntelligentSearchResult[]> {
    const {
      city = 'Kinshasa',
      country_code = 'CD',
      user_lat,
      user_lng,
      max_results = 10,
      min_hierarchy_level = 1,
      include_google_fallback = true
    } = options;

    // 1. Recherche dans la base de données locale
    const dbResults = await this.searchInDatabase(
      query, 
      city, 
      country_code, 
      user_lat, 
      user_lng, 
      max_results,
      min_hierarchy_level
    );

    // 2. Si pas assez de résultats et Google fallback activé
    if (dbResults.length < max_results && include_google_fallback) {
      const googleResults = await this.searchWithGoogleFallback(
        query, 
        city, 
        max_results - dbResults.length
      );
      return [...dbResults, ...googleResults];
    }

    return dbResults;
  }

  /**
   * Recherche dans la base de données enrichie avec priorisation par ville
   */
  private async searchInDatabase(
    query: string,
    city: string,
    country_code: string,
    user_lat?: number,
    user_lng?: number,
    max_results: number = 10,
    min_hierarchy_level: number = 1
  ): Promise<IntelligentSearchResult[]> {
    try {
      console.log(`🔍 Recherche prioritaire pour ${city}:`, query);
      
      // Recherche prioritaire dans la ville de l'utilisateur
      const { data: cityResults, error: cityError } = await supabase.rpc('intelligent_places_search', {
        search_query: query,
        search_city: city,
        user_latitude: user_lat || null,
        user_longitude: user_lng || null,
        max_results: Math.ceil(max_results * 0.7), // 70% des résultats de la ville
        include_nearby: true
      });

      if (cityError) throw cityError;
      
      let allResults = (cityResults || []).map(this.transformDatabaseResult);
      
      // Si pas assez de résultats, chercher dans les autres villes
      if (allResults.length < max_results) {
        const otherCities = Object.keys(this.CITY_CONFIGS).filter(c => c !== city);
        
        for (const otherCity of otherCities) {
          if (allResults.length >= max_results) break;
          
          const { data: otherResults } = await supabase.rpc('intelligent_places_search', {
            search_query: query,
            search_city: otherCity,
            user_latitude: null,
            user_longitude: null,
            max_results: max_results - allResults.length,
            include_nearby: false
          });
          
          if (otherResults && otherResults.length > 0) {
            const transformedOther = otherResults.map(this.transformDatabaseResult);
            allResults = [...allResults, ...transformedOther];
          }
        }
      }
      
      console.log(`✅ Trouvé ${allResults.length} résultats (${cityResults?.length || 0} dans ${city})`);
      return allResults.slice(0, max_results);
      
    } catch (error) {
      console.error('Database search error:', error);
      return [];
    }
  }

  /**
   * Recherche avec Google Maps en fallback
   */
  private async searchWithGoogleFallback(
    query: string,
    city: string,
    max_results: number
  ): Promise<IntelligentSearchResult[]> {
    try {
      const cityConfig = this.CITY_CONFIGS[city as keyof typeof this.CITY_CONFIGS];
      if (!cityConfig) return [];

      // Utiliser le proxy Supabase pour éviter les erreurs CORS
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { 
          query: `${query}, ${city}`, 
          latitude: cityConfig.center.lat, 
          longitude: cityConfig.center.lng 
        }
      });

      if (error) throw error;

      const results = data?.results || [];
      
      return results.slice(0, max_results).map((result: any, index: number) => ({
        id: `google_${Date.now()}_${index}`,
        name: result.formatted_address || result.name || query,
        category: 'location',
        city,
        lat: result.geometry?.location?.lat || cityConfig.center.lat,
        lng: result.geometry?.location?.lng || cityConfig.center.lng,
        hierarchy_level: 5,
        popularity_score: 0,
        relevance_score: Math.max(50 - index * 5, 10),
        type: 'google' as const,
        badge: 'Google Maps',
        subtitle: `${city}, République Démocratique du Congo`
      }));
    } catch (error) {
      console.error('Google fallback search error:', error);
      return [];
    }
  }

  /**
   * Suggestions populaires par défaut avec nouvelle fonction RPC
   */
  private async getPopularPlaces(options: SearchOptions = {}): Promise<IntelligentSearchResult[]> {
    const { city = 'Kinshasa', max_results = 6 } = options;
    
    try {
      console.log('🌟 Fetching popular places for:', city);
      
      // Utiliser la nouvelle fonction RPC sans paramètre de recherche pour les lieux populaires
      const { data, error } = await supabase.rpc('intelligent_places_search', {
        search_query: '',
        search_city: city,
        user_latitude: null,
        user_longitude: null,
        max_results,
        include_nearby: false
      });

      if (error) {
        console.error('Popular places fetch error:', error);
        return this.getFallbackPopularPlaces(city);
      }

      if (!data || data.length === 0) {
        console.log('📭 No popular places in enhanced database, using fallback');
        return this.getFallbackPopularPlaces(city);
      }

      console.log(`✅ Found ${data.length} popular places`);
      
      // Transformer avec le nouveau format enrichi
      return data.map((place: any) => ({
        id: place.id || crypto.randomUUID(),
        name: place.name,
        category: place.category || 'general',
        city: place.city,
        commune: place.commune || '',
        quartier: place.quartier || '',
        avenue: place.avenue || '',
        lat: place.latitude,
        lng: place.longitude,
        hierarchy_level: place.hierarchy_level || 3,
        popularity_score: place.popularity_score || 0,
        relevance_score: place.relevance_score || 0,
        type: 'database' as const,
        badge: place.badge || 'Populaire',
        subtitle: place.subtitle || place.formatted_address || `${place.commune || place.city}`
      }));
    } catch (error) {
      console.error('Popular places exception:', error);
      return this.getFallbackPopularPlaces(city);
    }
  }

  /**
   * Lieux populaires de fallback
   */
  private getFallbackPopularPlaces(city: string): IntelligentSearchResult[] {
    const popularPlaces = {
      'Kinshasa': [
        { name: 'Aéroport International Ndjili', category: 'transport', commune: 'Ndjili' },
        { name: 'Centre-ville Gombe', category: 'commercial', commune: 'Gombe' },
        { name: 'Marché Central', category: 'commercial', commune: 'Kinshasa' },
        { name: 'Université de Kinshasa', category: 'education', commune: 'Lemba' },
        { name: 'Stade des Martyrs', category: 'sport', commune: 'Lingwala' },
        { name: 'Hôpital Général de Kinshasa', category: 'health', commune: 'Gombe' }
      ],
      'Lubumbashi': [
        { name: 'Aéroport International Luano', category: 'transport', commune: 'Lubumbashi' },
        { name: 'Université de Lubumbashi', category: 'education', commune: 'Lubumbashi' },
        { name: 'Centre-ville Lubumbashi', category: 'commercial', commune: 'Lubumbashi' },
        { name: 'Stade TP Mazembe', category: 'sport', commune: 'Kamalondo' }
      ],
      'Kolwezi': [
        { name: 'Aéroport de Kolwezi', category: 'transport', commune: 'Kolwezi' },
        { name: 'Centre minier COMIDE', category: 'industry', commune: 'Mutoshi' },
        { name: 'Marché de Kolwezi', category: 'commercial', commune: 'Dilala' }
      ]
    };

    const places = popularPlaces[city as keyof typeof popularPlaces] || [];
    const cityConfig = this.CITY_CONFIGS[city as keyof typeof this.CITY_CONFIGS];
    
    return places.map((place, index) => ({
      id: `popular_${city}_${index}`,
      name: place.name,
      category: place.category,
      city,
      commune: place.commune,
      lat: cityConfig?.center.lat || 0,
      lng: cityConfig?.center.lng || 0,
      hierarchy_level: 5,
      popularity_score: 100 - index * 10,
      relevance_score: 90 - index * 5,
      type: 'popular' as const,
      badge: 'Populaire',
      subtitle: `${place.commune}, ${city}`
    }));
  }

  /**
   * Transformation des résultats de base de données
   */
  private transformDatabaseResult = (item: any): IntelligentSearchResult => {
    const badge = this.getHierarchyBadge(item.hierarchy_level);
    const subtitle = this.buildSubtitle(item);

    return {
      id: item.id,
      name: item.name,
      name_fr: item.name_fr,
      name_local: item.name_local,
      category: item.category || 'location',
      city: item.city,
      commune: item.commune,
      lat: parseFloat(item.latitude),
      lng: parseFloat(item.longitude),
      hierarchy_level: item.hierarchy_level,
      popularity_score: item.popularity_score,
      relevance_score: parseFloat(item.relevance_score),
      distance_km: item.distance_km ? parseFloat(item.distance_km) : undefined,
      type: 'database',
      badge,
      subtitle,
      aliases: item.aliases,
      address_components: item.address_components,
      phone_number: item.phone_number,
      website: item.website
    };
  };

  /**
   * Badge selon le niveau hiérarchique
   */
  private getHierarchyBadge(level: number): string {
    switch (level) {
      case 1: return 'Ville';
      case 2: return 'Commune';
      case 3: return 'Quartier';
      case 4: return 'Rue';
      case 5: return 'Lieu';
      default: return 'Lieu';
    }
  }

  /**
   * Construction du sous-titre
   */
  private buildSubtitle(item: any): string {
    const parts: string[] = [];
    
    if (item.commune && item.commune !== item.city) {
      parts.push(item.commune);
    }
    
    if (item.city) {
      parts.push(item.city);
    }
    
    if (item.distance_km !== null && item.distance_km !== undefined) {
      const distance = parseFloat(item.distance_km);
      if (distance < 1) {
        parts.push(`${Math.round(distance * 1000)}m`);
      } else {
        parts.push(`${distance.toFixed(1)}km`);
      }
    }
    
    return parts.join(', ');
  }

  /**
   * Gestion du cache
   */
  private getCacheKey(query: string, options: SearchOptions): string {
    return `${query}_${options.city || 'Kinshasa'}_${options.max_results || 10}`;
  }

  private getFromCache(key: string): IntelligentSearchResult[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.results;
  }

  private saveToCache(key: string, results: IntelligentSearchResult[]): void {
    this.cache.set(key, {
      results,
      timestamp: Date.now()
    });
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtenir des suggestions basées sur l'historique
   */
  async getRecentSearches(userId?: string, limit: number = 5): Promise<IntelligentSearchResult[]> {
    // TODO: Implémenter la récupération de l'historique utilisateur
    return [];
  }

  /**
   * Enregistrer une recherche dans l'historique
   */
  async saveSearchToHistory(result: IntelligentSearchResult, userId?: string): Promise<void> {
    // TODO: Implémenter la sauvegarde de l'historique
    console.log('Saving search to history:', result.name);
  }
}

export const intelligentAddressSearch = new IntelligentAddressSearchService();