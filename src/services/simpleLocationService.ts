/**
 * 🌍 SERVICE DE GÉOLOCALISATION SIMPLIFIÉ
 * 
 * Service léger pour les fonctionnalités de base
 * Compatible avec le hook useSimpleLocation existant
 */

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type?: 'current' | 'geocoded' | 'popular' | 'recent' | 'ip' | 'fallback' | 'database' | 'default' | 'gps';
  placeId?: string;
  accuracy?: number;
  name?: string;
  subtitle?: string;
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title?: string;
  subtitle?: string;
  isPopular?: boolean;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  fallbackToDatabase?: boolean;
  fallbackToDefault?: boolean;
  interval?: number;
  distanceFilter?: number;
}

class SimpleLocationService {
  private currentCity = 'Kinshasa';
  private watchId: number | null = null;
  private popularPlaces: LocationSearchResult[] = [
    {
      id: '1',
      name: 'Aéroport International de N\'djili',
      address: 'Aéroport International de N\'djili, Kinshasa, RDC',
      lat: -4.3857,
      lng: 15.4444,
      type: 'popular',
      isPopular: true,
      title: 'Aéroport N\'djili',
      subtitle: 'Kinshasa'
    },
    {
      id: '2',
      name: 'Centre-ville de Kinshasa',
      address: 'Gombe, Kinshasa, République Démocratique du Congo',
      lat: -4.3217,
      lng: 15.3069,
      type: 'popular',
      isPopular: true,
      title: 'Centre-ville',
      subtitle: 'Gombe, Kinshasa'
    },
    {
      id: '3',
      name: 'Université de Kinshasa',
      address: 'Mont-Amba, Kinshasa, République Démocratique du Congo',
      lat: -4.4324,
      lng: 15.2973,
      type: 'popular',
      isPopular: true,
      title: 'UNIKIN',
      subtitle: 'Mont-Amba'
    }
  ];

  async getCurrentPosition(options?: GeolocationOptions): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      const opts: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 60000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            type: 'current',
            accuracy: position.coords.accuracy
          };
          resolve(locationData);
        },
        (error) => {
          // Fallback vers position par défaut
          const defaultPosition: LocationData = {
            address: 'Kinshasa Centre, République Démocratique du Congo',
            lat: -4.3217,
            lng: 15.3069,
            type: 'fallback'
          };
          
          if (options?.fallbackToDefault !== false) {
            resolve(defaultPosition);
          } else {
            reject(new Error(`Erreur géolocalisation: ${error.message}`));
          }
        },
        opts
      );
    });
  }

  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    if (!query || query.length < 2) {
      return this.getPopularPlaces();
    }

    // Recherche dans les lieux populaires
    const results = this.popularPlaces.filter(place =>
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.address.toLowerCase().includes(query.toLowerCase())
    );

    // Si aucun résultat, retourner les lieux populaires
    return results.length > 0 ? results : this.getPopularPlaces();
  }

  getPopularPlaces(): LocationSearchResult[] {
    return [...this.popularPlaces];
  }

  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  async startTracking(
    callback: (position: LocationData) => void,
    options?: GeolocationOptions & { interval?: number; distanceFilter?: number }
  ): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('Géolocalisation non supportée');
    }

    const opts: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 15000,
      maximumAge: options?.maximumAge ?? 5000
    };

    let lastPosition: GeolocationPosition | null = null;
    const distanceFilter = options?.distanceFilter ?? 10; // 10 mètres par défaut

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Filtre de distance
        if (lastPosition && distanceFilter > 0) {
          const distance = this.calculateDistance(
            { lat: lastPosition.coords.latitude, lng: lastPosition.coords.longitude },
            { lat: position.coords.latitude, lng: position.coords.longitude }
          );
          
          if (distance < distanceFilter) {
            return; // Ignorer cette mise à jour
          }
        }

        lastPosition = position;
        
        const locationData: LocationData = {
          address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          type: 'current',
          accuracy: position.coords.accuracy
        };

        callback(locationData);
      },
      (error) => {
        console.error('Erreur tracking:', error);
      },
      opts
    );
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  setCurrentCity(city: string): void {
    this.currentCity = city;
  }

  getCurrentCity(): string {
    return this.currentCity;
  }
}

export const simpleLocationService = new SimpleLocationService();