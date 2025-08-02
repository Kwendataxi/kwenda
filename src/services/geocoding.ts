import { supabase } from '@/integrations/supabase/client';

export interface GeocodeResult {
  place_name: string;
  center: [number, number];
  place_type?: string[];
  properties?: any;
}

interface MapboxResponse {
  features: {
    place_name: string;
    center: [number, number];
    place_type?: string[];
    properties?: any;
  }[];
}

export class GeocodingService {
  private static mapboxToken: string | null = null;

  private static async getMapboxToken(): Promise<string> {
    if (this.mapboxToken) return this.mapboxToken;

    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) throw error;
      if (!data?.token) throw new Error('Token Mapbox non trouvé');
      
      this.mapboxToken = data.token;
      return this.mapboxToken;
    } catch (error) {
      console.error('Erreur lors de la récupération du token Mapbox:', error);
      throw new Error('Service de géocodage indisponible');
    }
  }

  static async searchPlaces(query: string, proximity?: { lng: number; lat: number }): Promise<GeocodeResult[]> {
    if (!query || query.length < 2) return [];

    try {
      const token = await this.getMapboxToken();
      
      // Coordonnées par défaut pour Kinshasa
      const defaultProximity = proximity || { lng: 15.2663, lat: -4.4419 };
      
      const url = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(query) + '.json');
      url.searchParams.set('access_token', token);
      url.searchParams.set('proximity', `${defaultProximity.lng},${defaultProximity.lat}`);
      url.searchParams.set('country', 'CD'); // Code pays pour RDC
      url.searchParams.set('limit', '5');
      url.searchParams.set('language', 'fr');
      url.searchParams.set('types', 'poi,address,place');

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur de géocodage: ${response.status}`);
      }

      const data: MapboxResponse = await response.json();
      
      return data.features.map(feature => ({
        place_name: feature.place_name,
        center: feature.center,
        place_type: feature.place_type,
        properties: feature.properties,
      }));
    } catch (error) {
      console.error('Erreur lors de la recherche de lieux:', error);
      
      // Fallback avec des suggestions locales pour Kinshasa
      if (query.toLowerCase().includes('kinshasa') || query.toLowerCase().includes('kin')) {
        return [
          {
            place_name: 'Kinshasa, République Démocratique du Congo',
            center: [15.2663, -4.4419]
          }
        ];
      }
      
      return [];
    }
  }

  static async reverseGeocode(lng: number, lat: number): Promise<string> {
    try {
      const token = await this.getMapboxToken();
      
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`);
      url.searchParams.set('access_token', token);
      url.searchParams.set('language', 'fr');
      url.searchParams.set('limit', '1');

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur de géocodage inverse: ${response.status}`);
      }

      const data: MapboxResponse = await response.json();
      
      if (data.features.length > 0) {
        return data.features[0].place_name;
      }
      
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
}