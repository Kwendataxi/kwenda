import { supabase } from '@/integrations/supabase/client';

export interface LocationResult {
  address: string;
  lat: number;
  lng: number;
  type?: 'geocoded' | 'popular' | 'fallback';
}

export interface RouteResult {
  distance: number; // meters
  duration: number; // seconds
  price: number;    // CDF
  mode: 'flash' | 'flex' | 'maxicharge';
}

// Lieux populaires de Kinshasa avec géolocalisation précise
const POPULAR_PLACES = [
  { name: 'Gombe Centre', lat: -4.3276, lng: 15.3154 },
  { name: 'Aéroport N\'djili', lat: -4.3857, lng: 15.4446 },
  { name: 'Marché Central', lat: -4.3217, lng: 15.3069 },
  { name: 'Université de Kinshasa', lat: -4.4339, lng: 15.3505 },
  { name: 'Place de la Poste', lat: -4.3232, lng: 15.3097 },
  { name: 'Boulevard du 30 Juin', lat: -4.3184, lng: 15.3136 },
  { name: 'Matongé', lat: -4.3891, lng: 15.2877 },
  { name: 'Lemba Terminus', lat: -4.3891, lng: 15.2614 },
  { name: 'Ngaliema', lat: -4.3506, lng: 15.2721 },
  { name: 'Kintambo', lat: -4.3298, lng: 15.2889 }
];

export class UnifiedLocationService {
  private static googleApiKey: string = '';

  // Récupération sécurisée de la clé API
  private static async getGoogleApiKey(): Promise<string> {
    if (this.googleApiKey) return this.googleApiKey;
    
    try {
      const { data, error } = await supabase.functions.invoke('get-google-maps-key');
      
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      
      this.googleApiKey = data.apiKey;
      return this.googleApiKey;
    } catch (error) {
      console.warn('Google API non disponible, mode fallback activé:', error);
      return '';
    }
  }

  // Recherche intelligente d'adresses
  static async searchLocation(query: string): Promise<LocationResult[]> {
    if (!query || query.length < 3) return [];

    const results: LocationResult[] = [];

    // 1. Recherche dans les lieux populaires en premier (plus rapide)
    const popularMatches = POPULAR_PLACES.filter(place => 
      place.name.toLowerCase().includes(query.toLowerCase())
    );
    
    results.push(...popularMatches.map(place => ({
      address: place.name,
      lat: place.lat,
      lng: place.lng,
      type: 'popular' as const
    })));

    // 2. Recherche Google Places si disponible
    try {
      const apiKey = await this.getGoogleApiKey();
      if (apiKey) {
        const googleResults = await this.searchGooglePlaces(query, apiKey);
        results.push(...googleResults);
      }
    } catch (error) {
      console.warn('Google Places search failed:', error);
    }

    // 3. Fallback si aucun résultat
    if (results.length === 0) {
      results.push({
        address: `${query} (approximatif)`,
        lat: -4.3217 + (Math.random() - 0.5) * 0.1,
        lng: 15.3069 + (Math.random() - 0.5) * 0.1,
        type: 'fallback'
      });
    }

    return results.slice(0, 5); // Limiter à 5 résultats
  }

  private static async searchGooglePlaces(query: string, apiKey: string): Promise<LocationResult[]> {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' Kinshasa')}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Google Places API error');
    
    const data = await response.json();
    
    return (data.results || []).slice(0, 3).map((place: any) => ({
      address: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      type: 'geocoded' as const
    }));
  }

  // Calcul unifié distance + prix
  static async calculateRoute(
    pickup: LocationResult,
    destination: LocationResult
  ): Promise<RouteResult[]> {
    // Calcul de distance (haversine pour fallback)
    const distance = this.calculateDistance(pickup, destination);
    
    // Estimation du temps de trajet (vitesse moyenne Kinshasa: 25 km/h)
    const duration = (distance / 1000) / 25 * 3600; // en secondes

    // Calcul des prix pour chaque mode
    const basePrices = {
      flash: 5000,      // Moto rapide
      flex: 3000,       // Standard
      maxicharge: 8000  // Camion
    };

    const pricePerKm = {
      flash: 500,
      flex: 300,
      maxicharge: 800
    };

    const distanceKm = distance / 1000;

    return [
      {
        distance,
        duration: Math.round(duration * 0.7), // Flash plus rapide
        price: Math.round(basePrices.flash + (distanceKm * pricePerKm.flash)),
        mode: 'flash'
      },
      {
        distance,
        duration: Math.round(duration),
        price: Math.round(basePrices.flex + (distanceKm * pricePerKm.flex)),
        mode: 'flex'
      },
      {
        distance,
        duration: Math.round(duration * 1.3), // Camion plus lent
        price: Math.round(basePrices.maxicharge + (distanceKm * pricePerKm.maxicharge)),
        mode: 'maxicharge'
      }
    ];
  }

  // Calcul distance haversine
  private static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Rayon terre en mètres
    const φ1 = point1.lat * Math.PI/180;
    const φ2 = point2.lat * Math.PI/180;
    const Δφ = (point2.lat - point1.lat) * Math.PI/180;
    const Δλ = (point2.lng - point1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Position utilisateur avec fallback
  static async getCurrentLocation(): Promise<LocationResult> {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          enableHighAccuracy: false
        });
      });

      return {
        address: 'Ma position actuelle',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        type: 'geocoded'
      };
    } catch (error) {
      // Fallback: centre de Kinshasa
      return {
        address: 'Kinshasa Centre',
        lat: -4.3217,
        lng: 15.3069,
        type: 'fallback'
      };
    }
  }

  // Formatage des durées
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    }
    return `${minutes}min`;
  }

  // Formatage des distances
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }
}