import { supabase } from '@/integrations/supabase/client';
import type { LocationData, SearchResult, Coordinates } from '@/types/location';

// Cache intelligent pour éviter les requêtes répétées
class LocationCache {
  private cache = new Map<string, SearchResult[]>();
  private maxAge = 5 * 60 * 1000; // 5 minutes
  private timestamps = new Map<string, number>();

  set(key: string, results: SearchResult[]): void {
    this.cache.set(key, results);
    this.timestamps.set(key, Date.now());
  }

  get(key: string): SearchResult[] | null {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.maxAge) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }
}

// Lieux populaires pour fallback instantané
const POPULAR_PLACES: LocationData[] = [
  { address: "Aéroport N'djili, Kinshasa", lat: -4.3856, lng: 15.4441, type: 'popular' },
  { address: "Gare Centrale, Kinshasa", lat: -4.3297, lng: 15.3131, type: 'popular' },
  { address: "Université de Kinshasa", lat: -4.4034, lng: 15.2993, type: 'popular' },
  { address: "Marché Central, Kinshasa", lat: -4.3169, lng: 15.3082, type: 'popular' },
  { address: "Stade des Martyrs, Kinshasa", lat: -4.3728, lng: 15.2663, type: 'popular' },
  { address: "Boulevard du 30 Juin, Kinshasa", lat: -4.3200, lng: 15.3100, type: 'popular' },
  { address: "Centre-ville Kinshasa", lat: -4.3250, lng: 15.3222, type: 'popular' },
  { address: "Bandalungwa, Kinshasa", lat: -4.3891, lng: 15.2664, type: 'popular' }
];

class SmartLocationService {
  private cache = new LocationCache();
  private abortController: AbortController | null = null;

  /**
   * Recherche intelligente avec cache et fallbacks
   */
  async searchLocation(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return this.getPopularPlaces();
    }

    const normalizedQuery = query.trim().toLowerCase();
    
    // Vérifier le cache d'abord
    const cached = this.cache.get(normalizedQuery);
    if (cached) {
      return cached;
    }

    // Annuler la requête précédente si elle existe
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      // 1. Recherche dans les lieux populaires
      const popularResults = this.searchPopularPlaces(normalizedQuery);
      
      // 2. Recherche via API si pas assez de résultats
      let apiResults: SearchResult[] = [];
      if (popularResults.length < 3) {
        apiResults = await this.searchViaAPI(query, this.abortController.signal);
      }

      // 3. Combiner et dédupliquer
      const allResults = [...popularResults, ...apiResults];
      const uniqueResults = this.deduplicateResults(allResults);
      
      // Mettre en cache
      this.cache.set(normalizedQuery, uniqueResults);
      
      return uniqueResults;
    } catch (error) {
      console.warn('Erreur recherche location:', error);
      // Fallback vers lieux populaires
      return this.searchPopularPlaces(normalizedQuery);
    }
  }

  /**
   * Obtenir la position actuelle avec fallback
   */
  async getCurrentLocation(): Promise<LocationData> {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Géolocalisation non disponible'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { 
            timeout: 10000, 
            enableHighAccuracy: true,
            maximumAge: 60000 
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Géocodage inverse pour obtenir l'adresse
      try {
        const address = await this.reverseGeocode({ lat: latitude, lng: longitude });
        return {
          address,
          lat: latitude,
          lng: longitude,
          type: 'current'
        };
      } catch {
        return {
          address: "Position actuelle",
          lat: latitude,
          lng: longitude,
          type: 'current'
        };
      }
    } catch (error) {
      console.warn('Impossible d\'obtenir la position:', error);
      // Fallback vers centre de Kinshasa
      return {
        address: "Centre-ville, Kinshasa",
        lat: -4.3250,
        lng: 15.3222,
        type: 'popular'
      };
    }
  }

  /**
   * Calcul de distance Haversine
   */
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.degToRad(point2.lat - point1.lat);
    const dLng = this.degToRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(point1.lat)) * Math.cos(this.degToRad(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Formatage des distances
   */
  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  /**
   * Formatage des durées
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  }

  // Méthodes privées
  private getPopularPlaces(): SearchResult[] {
    return POPULAR_PLACES.map((place, index) => ({
      id: `popular-${index}`,
      ...place
    }));
  }

  private searchPopularPlaces(query: string): SearchResult[] {
    return POPULAR_PLACES
      .filter(place => 
        place.address.toLowerCase().includes(query) ||
        place.address.toLowerCase().replace(/[^a-z0-9]/g, '').includes(query.replace(/[^a-z0-9]/g, ''))
      )
      .map((place, index) => ({
        id: `popular-${index}`,
        ...place
      }));
  }

  private async searchViaAPI(query: string, signal: AbortSignal): Promise<SearchResult[]> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { query },
        // Note: Supabase client doesn't support AbortSignal directly
      });

      if (error) {
        throw error;
      }

      if (!data?.results || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((result: any, index: number) => ({
        id: `api-${index}`,
        address: result.formatted_address || result.description || '',
        lat: result.geometry?.location?.lat || 0,
        lng: result.geometry?.location?.lng || 0,
        type: 'geocoded' as const,
        placeId: result.place_id
      })).filter((result: SearchResult) => 
        result.lat !== 0 && result.lng !== 0 && result.address
      );
    } catch (error) {
      if (signal?.aborted) {
        return [];
      }
      throw error;
    }
  }

  private async reverseGeocode(coords: Coordinates): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-proxy', {
        body: { 
          latlng: `${coords.lat},${coords.lng}`,
          mode: 'reverse'
        }
      });

      if (error || !data?.results?.[0]) {
        throw new Error('Géocodage inverse échoué');
      }

      return data.results[0].formatted_address || 'Adresse inconnue';
    } catch (error) {
      console.warn('Erreur géocodage inverse:', error);
      return 'Position actuelle';
    }
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.lat.toFixed(4)}-${result.lng.toFixed(4)}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Export singleton
export const smartLocationService = new SmartLocationService();