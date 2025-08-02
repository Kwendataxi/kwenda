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

  // Coordonnées des villes de RDC
  private static readonly CITY_COORDINATES = {
    kinshasa: { lng: 15.2663, lat: -4.4419 },
    lubumbashi: { lng: 27.4794, lat: -11.6609 },
    kolwezi: { lng: 25.4731, lat: -10.7143 }
  };

  private static detectCity(coordinates?: { lng: number; lat: number }): 'kinshasa' | 'lubumbashi' | 'kolwezi' {
    if (!coordinates) return 'kinshasa';
    
    const distances = Object.entries(this.CITY_COORDINATES).map(([city, coords]) => ({
      city: city as 'kinshasa' | 'lubumbashi' | 'kolwezi',
      distance: Math.sqrt(
        Math.pow(coordinates.lng - coords.lng, 2) + 
        Math.pow(coordinates.lat - coords.lat, 2)
      )
    }));
    
    return distances.sort((a, b) => a.distance - b.distance)[0].city;
  }

  static async searchPlaces(query: string, proximity?: { lng: number; lat: number }): Promise<GeocodeResult[]> {
    if (!query || query.length < 2) return [];

    try {
      const token = await this.getMapboxToken();
      
      // Détecter la ville actuelle et utiliser ses coordonnées par défaut
      const currentCity = this.detectCity(proximity);
      const defaultProximity = proximity || this.CITY_COORDINATES[currentCity];
      
      const url = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(query) + '.json');
      url.searchParams.set('access_token', token);
      url.searchParams.set('proximity', `${defaultProximity.lng},${defaultProximity.lat}`);
      url.searchParams.set('country', 'CD'); // Code pays pour RDC
      url.searchParams.set('limit', '8'); // Augmenté pour plus de résultats
      url.searchParams.set('language', 'fr');
      // Types étendus pour plus de précision
      url.searchParams.set('types', 'poi,address,place,locality,neighborhood,district');
      // Bbox étendue pour couvrir les 3 villes principales
      url.searchParams.set('bbox', '15.0,-12.0,28.0,-3.0');
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
      
      // Fallback enrichi avec des lieux connus des 3 villes
      const currentCity = this.detectCity(proximity);
      const fallbackPlaces = this.getFallbackPlaces(currentCity);
      
      return fallbackPlaces.filter(place => 
        place.place_name.toLowerCase().includes(query.toLowerCase())
      ) as GeocodeResult[];
    }
  }

  private static getFallbackPlaces(city: 'kinshasa' | 'lubumbashi' | 'kolwezi') {
    const places = {
      kinshasa: [
        { place_name: 'Kinshasa, République Démocratique du Congo', center: [15.2663, -4.4419] },
        { place_name: 'Gombe, Kinshasa', center: [15.2866, -4.4114] },
        { place_name: 'Kalamu, Kinshasa', center: [15.2943, -4.4447] },
        { place_name: 'Lemba, Kinshasa', center: [15.2544, -4.4267] },
        { place_name: 'Limete, Kinshasa', center: [15.2791, -4.4158] },
        { place_name: 'Ngaliema, Kinshasa', center: [15.2411, -4.4019] },
        { place_name: 'Kintambo, Kinshasa', center: [15.2567, -4.4086] },
        { place_name: 'Matete, Kinshasa', center: [15.2891, -4.4356] }
      ],
      lubumbashi: [
        { place_name: 'Lubumbashi, République Démocratique du Congo', center: [27.4794, -11.6609] },
        { place_name: 'Kenya, Lubumbashi', center: [27.4653, -11.6402] },
        { place_name: 'Kampemba, Lubumbashi', center: [27.4891, -11.6756] },
        { place_name: 'Kamalondo, Lubumbashi', center: [27.4612, -11.6512] },
        { place_name: 'Katuba, Lubumbashi', center: [27.5234, -11.6891] },
        { place_name: 'Ruashi, Lubumbashi', center: [27.4234, -11.6123] },
        { place_name: 'Annexe, Lubumbashi', center: [27.4567, -11.6334] }
      ],
      kolwezi: [
        { place_name: 'Kolwezi, République Démocratique du Congo', center: [25.4731, -10.7143] },
        { place_name: 'Centre-ville, Kolwezi', center: [25.4689, -10.7101] },
        { place_name: 'Mutanda, Kolwezi', center: [25.4812, -10.7234] },
        { place_name: 'Dilala, Kolwezi', center: [25.4567, -10.7089] },
        { place_name: 'Manika, Kolwezi', center: [25.4891, -10.7312] }
      ]
    };
    
    return places[city];
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