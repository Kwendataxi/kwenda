import { supabase } from '@/integrations/supabase/client';
import { CountryService } from '@/services/countryConfig';
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

  // Helpers dynamiques basés sur le pays courant
  private static getDefaultProximity(proximity?: { lng: number; lat: number }): { lng: number; lat: number } {
    if (proximity) return proximity;
    try {
      const country = CountryService.getCurrentCountry();
      // Essayer de trouver la ville majeure la plus proche du centre de la bbox
      const candidateCity = country.defaultProximity
        ? null
        : CountryService.findNearestCity(
            (country.bbox[1] + country.bbox[3]) / 2,
            (country.bbox[0] + country.bbox[2]) / 2
          );
      if (country.defaultProximity) return { lng: country.defaultProximity.lng, lat: country.defaultProximity.lat };
      if (candidateCity) return { lng: candidateCity.coordinates.lng, lat: candidateCity.coordinates.lat };
      // Fallback: centre de la bbox
      return { lng: (country.bbox[0] + country.bbox[2]) / 2, lat: (country.bbox[1] + country.bbox[3]) / 2 };
    } catch {
      // Fallback Kinshasa
      return { lng: 15.2663, lat: -4.4419 };
    }
  }

  static async searchPlaces(query: string, proximity?: { lng: number; lat: number }): Promise<GeocodeResult[]> {
    if (!query || query.length < 2) return [];

    try {
      const token = await this.getMapboxToken();
      
      const country = CountryService.getCurrentCountry();
      const defaultProximity = this.getDefaultProximity(proximity);
      
      const url = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(query) + '.json');
      url.searchParams.set('access_token', token);
      url.searchParams.set('proximity', `${defaultProximity.lng},${defaultProximity.lat}`);
      url.searchParams.set('country', country.mapboxCountryCode);
      url.searchParams.set('limit', '8');
      url.searchParams.set('language', country.language || 'fr');
      // Types étendus pour plus de précision
      url.searchParams.set('types', 'poi,address,place,locality,neighborhood,district');
      // Bbox du pays courant pour de meilleurs résultats
      url.searchParams.set('bbox', `${country.bbox[0]},${country.bbox[1]},${country.bbox[2]},${country.bbox[3]}`);
      // Forcer la recherche fuzzy pour une meilleure correspondance
      url.searchParams.set('fuzzyMatch', 'true');
      url.searchParams.set('routing', 'true');

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur de géocodage: ${response.status}`);
      }

      const data: MapboxResponse = await response.json();
      
      // Trier les résultats par pertinence et proximité
      const results = data.features
        .map(feature => ({
          place_name: feature.place_name,
          center: feature.center,
          place_type: feature.place_type,
          properties: feature.properties,
        }))
        .sort((a, b) => {
          // Prioriser les résultats qui contiennent le terme de recherche exactement
          const aExactMatch = a.place_name.toLowerCase().includes(query.toLowerCase());
          const bExactMatch = b.place_name.toLowerCase().includes(query.toLowerCase());
          
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          
          // Calculer la distance à partir de Kinshasa centre
          const distanceA = Math.sqrt(
            Math.pow(a.center[0] - defaultProximity.lng, 2) + 
            Math.pow(a.center[1] - defaultProximity.lat, 2)
          );
          const distanceB = Math.sqrt(
            Math.pow(b.center[0] - defaultProximity.lng, 2) + 
            Math.pow(b.center[1] - defaultProximity.lat, 2)
          );
          
          return distanceA - distanceB;
        });

      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche de lieux:', error);
      
      // Fallback dynamique basé sur le pays courant
      const fallbackPlaces = this.getFallbackPlaces();
      
      return fallbackPlaces.filter(place => 
        place.place_name.toLowerCase().includes(query.toLowerCase())
      ) as GeocodeResult[];
    }
  }

  private static getFallbackPlaces() {
    try {
      const country = CountryService.getCurrentCountry();
      const places = country.majorCities.map(city => ({
        place_name: `${city.name}, ${country.name}`,
        center: [city.coordinates.lng, city.coordinates.lat]
      }));
      return places;
    } catch {
      // Fallback minimal si CountryService indisponible
      return [
        { place_name: 'Kinshasa, République Démocratique du Congo', center: [15.2663, -4.4419] },
        { place_name: 'Lubumbashi, République Démocratique du Congo', center: [27.4794, -11.6609] },
        { place_name: 'Kolwezi, République Démocratique du Congo', center: [25.4731, -10.7143] }
      ];
    }
  }

  static async reverseGeocode(lng: number, lat: number): Promise<string> {
    try {
      const token = await this.getMapboxToken();
      
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`);
      url.searchParams.set('access_token', token);
      url.searchParams.set('language', CountryService.getCurrentCountry().language || 'fr');
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