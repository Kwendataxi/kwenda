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
      const userLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : (country.language || 'fr');

      // Determine effective proximity
      const defaultProximity = this.getDefaultProximity(proximity);

      // Helper to check if a point is inside a bbox [minLng, minLat, maxLng, maxLat]
      const isInBbox = (lng: number, lat: number, bbox: [number, number, number, number]) => (
        lng >= bbox[0] && lng <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]
      );

      // Create a small local bbox (~0.5°) around proximity when available
      const localBbox: [number, number, number, number] = [
        defaultProximity.lng - 0.5,
        defaultProximity.lat - 0.5,
        defaultProximity.lng + 0.5,
        defaultProximity.lat + 0.5,
      ];

      // Pass 1: proximity + local bbox, include country filter only if proximity is inside current country bbox
      const pass1 = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(query) + '.json');
      pass1.searchParams.set('access_token', token);
      pass1.searchParams.set('proximity', `${defaultProximity.lng},${defaultProximity.lat}`);
      pass1.searchParams.set('bbox', `${localBbox[0]},${localBbox[1]},${localBbox[2]},${localBbox[3]}`);
      if (isInBbox(defaultProximity.lng, defaultProximity.lat, country.bbox)) {
        pass1.searchParams.set('country', country.mapboxCountryCode);
      }
      pass1.searchParams.set('limit', '8');
      pass1.searchParams.set('language', userLang);
      pass1.searchParams.set('types', 'poi,address,place,locality,neighborhood,district');
      pass1.searchParams.set('fuzzyMatch', 'true');
      pass1.searchParams.set('routing', 'true');

      const responses: GeocodeResult[] = [];

      const fetchAndPush = async (url: URL) => {
        const res = await fetch(url);
        if (!res.ok) return;
        const data: MapboxResponse = await res.json();
        const items = data.features.map(f => ({
          place_name: f.place_name,
          center: f.center,
          place_type: f.place_type,
          properties: f.properties,
        }));
        // Merge unique by place_name
        const byName = new Map<string, GeocodeResult>();
        [...responses, ...items].forEach(r => byName.set(r.place_name, r as GeocodeResult));
        const merged = Array.from(byName.values());
        responses.splice(0, responses.length, ...merged);
      };

      await fetchAndPush(pass1);

      // Pass 2: broaden by removing country and bbox but keep proximity
      if (responses.length < 3) {
        const pass2 = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(query) + '.json');
        pass2.searchParams.set('access_token', token);
        pass2.searchParams.set('proximity', `${defaultProximity.lng},${defaultProximity.lat}`);
        pass2.searchParams.set('limit', '8');
        pass2.searchParams.set('language', userLang);
        pass2.searchParams.set('types', 'poi,address,place,locality,neighborhood,district');
        pass2.searchParams.set('fuzzyMatch', 'true');
        await fetchAndPush(pass2);
      }

      // Pass 3: global search without proximity if still few results
      if (responses.length < 3) {
        const pass3 = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(query) + '.json');
        pass3.searchParams.set('access_token', token);
        pass3.searchParams.set('limit', '8');
        pass3.searchParams.set('language', userLang);
        pass3.searchParams.set('types', 'poi,address,place,locality,neighborhood,district');
        pass3.searchParams.set('fuzzyMatch', 'true');
        await fetchAndPush(pass3);
      }

      // Sort by text match and proximity
      let results = responses.sort((a, b) => {
        const aExact = a.place_name.toLowerCase().includes(query.toLowerCase());
        const bExact = b.place_name.toLowerCase().includes(query.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        const distanceA = Math.hypot(a.center[0] - defaultProximity.lng, a.center[1] - defaultProximity.lat);
        const distanceB = Math.hypot(b.center[0] - defaultProximity.lng, b.center[1] - defaultProximity.lat);
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
      const userLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : (CountryService.getCurrentCountry().language || 'fr');
      url.searchParams.set('language', userLang);
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