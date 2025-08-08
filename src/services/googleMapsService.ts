export interface GeocodeResult {
  place_name: string;
  center: [number, number]; // [lng, lat]
  place_type?: string;
  properties?: any;
}

export interface GooglePlaceResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name?: string;
  types: string[];
  place_id: string;
}

export class GoogleMapsService {
  private static apiKey: string = '';

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static async getApiKey(): Promise<string> {
    if (this.apiKey) return this.apiKey;
    
    try {
      const response = await fetch('https://wddlktajnhwhyquwcdgf.supabase.co/functions/v1/get-google-maps-key', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.supabase?.supabaseKey || ''}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch API key');
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      this.apiKey = data.apiKey;
      return this.apiKey;
    } catch (error) {
      console.error('Erreur lors de la récupération de la clé API Google Maps:', error);
      throw new Error('Clé API Google Maps non disponible');
    }
  }

  static async searchPlaces(query: string, proximity?: { lng: number; lat: number }): Promise<GeocodeResult[]> {
    try {
      const apiKey = await this.getApiKey();
      
      // Construction de l'URL avec géobiais si proximité fournie
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      
      if (proximity) {
        url += `&location=${proximity.lat},${proximity.lng}&radius=50000`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.warn('Erreur API Google Places:', data.status);
        return this.getFallbackPlaces(query);
      }

      return data.results.map((place: GooglePlaceResult) => ({
        place_name: place.formatted_address,
        center: [place.geometry.location.lng, place.geometry.location.lat],
        place_type: place.types[0] || 'address',
        properties: {
          place_id: place.place_id,
          name: place.name
        }
      }));
    } catch (error) {
      console.error('Erreur lors de la recherche de lieux:', error);
      return this.getFallbackPlaces(query);
    }
  }

  static async reverseGeocode(lng: number, lat: number): Promise<string> {
    try {
      const apiKey = await this.getApiKey();
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  static async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distance: number; duration: number; distanceText: string; durationText: string }> {
    try {
      const apiKey = await this.getApiKey();
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        return {
          distance: element.distance.value, // en mètres
          duration: element.duration.value, // en secondes
          distanceText: element.distance.text,
          durationText: element.duration.text
        };
      }

      throw new Error('Impossible de calculer la distance');
    } catch (error) {
      console.error('Erreur lors du calcul de distance:', error);
      
      // Calcul de distance approximatif en fallback
      const R = 6371e3; // Rayon de la Terre en mètres
      const φ1 = origin.lat * Math.PI/180;
      const φ2 = destination.lat * Math.PI/180;
      const Δφ = (destination.lat-origin.lat) * Math.PI/180;
      const Δλ = (destination.lng-origin.lng) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const distance = R * c;
      const approximateDuration = distance / 50000 * 3600; // 50 km/h moyenne

      return {
        distance: Math.round(distance),
        duration: Math.round(approximateDuration),
        distanceText: `${(distance / 1000).toFixed(1)} km`,
        durationText: `${Math.round(approximateDuration / 60)} min`
      };
    }
  }

  private static getFallbackPlaces(query: string): GeocodeResult[] {
    const kinshAsaPlaces = [
      {
        place_name: "Gombe, Kinshasa",
        center: [-4.4419, 15.2663] as [number, number],
        place_type: "district"
      },
      {
        place_name: "Lemba, Kinshasa", 
        center: [-4.4286, 15.2441] as [number, number],
        place_type: "district"
      },
      {
        place_name: "Ngaliema, Kinshasa",
        center: [-4.4058, 15.2441] as [number, number], 
        place_type: "district"
      },
      {
        place_name: "Matete, Kinshasa",
        center: [-4.4286, 15.3147] as [number, number],
        place_type: "district"
      },
      {
        place_name: "Masina, Kinshasa",
        center: [-4.3848, 15.3441] as [number, number],
        place_type: "district"
      }
    ];

    if (!query || query.length < 2) {
      return kinshAsaPlaces;
    }

    const filtered = kinshAsaPlaces.filter(place => 
      place.place_name.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.length > 0 ? filtered : kinshAsaPlaces;
  }
}