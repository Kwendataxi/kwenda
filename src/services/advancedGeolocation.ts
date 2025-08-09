// Service de géolocalisation avancée multi-villes avec fallback intelligent
import { CountryService } from './countryConfig';

interface CityBounds {
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: { lat: number; lng: number };
  landmarks: Array<{
    name: string;
    coordinates: { lat: number; lng: number };
    type: 'commercial' | 'residential' | 'industrial' | 'transport';
  }>;
}

// Configuration détaillée des 5 villes cibles
const CITY_CONFIGURATIONS: Record<string, CityBounds> = {
  kinshasa: {
    name: 'Kinshasa',
    bounds: {
      north: -4.20,
      south: -4.70,
      east: 15.50,
      west: 15.00
    },
    center: { lat: -4.4419, lng: 15.2663 },
    landmarks: [
      { name: 'Gombe', coordinates: { lat: -4.3199, lng: 15.3074 }, type: 'commercial' },
      { name: 'Kinshasa Centre', coordinates: { lat: -4.3297, lng: 15.3075 }, type: 'commercial' },
      { name: 'Limete', coordinates: { lat: -4.3835, lng: 15.2943 }, type: 'residential' },
      { name: 'Matete', coordinates: { lat: -4.4031, lng: 15.3413 }, type: 'residential' },
      { name: 'Kalamu', coordinates: { lat: -4.3789, lng: 15.3010 }, type: 'residential' },
      { name: 'Aéroport de N\'djili', coordinates: { lat: -4.3857, lng: 15.4446 }, type: 'transport' },
      { name: 'Marché Central', coordinates: { lat: -4.3225, lng: 15.3095 }, type: 'commercial' }
    ]
  },
  lubumbashi: {
    name: 'Lubumbashi',
    bounds: {
      north: -11.50,
      south: -11.80,
      east: 27.60,
      west: 27.30
    },
    center: { lat: -11.6609, lng: 27.4794 },
    landmarks: [
      { name: 'Centre-ville Lubumbashi', coordinates: { lat: -11.6609, lng: 27.4794 }, type: 'commercial' },
      { name: 'Université de Lubumbashi', coordinates: { lat: -11.6545, lng: 27.4636 }, type: 'commercial' },
      { name: 'Aéroport Luano', coordinates: { lat: -11.5913, lng: 27.5308 }, type: 'transport' },
      { name: 'Marché de la Liberté', coordinates: { lat: -11.6649, lng: 27.4753 }, type: 'commercial' },
      { name: 'Zone industrielle', coordinates: { lat: -11.6890, lng: 27.4521 }, type: 'industrial' }
    ]
  },
  kolwezi: {
    name: 'Kolwezi',
    bounds: {
      north: -10.60,
      south: -10.80,
      east: 25.60,
      west: 25.30
    },
    center: { lat: -10.7143, lng: 25.4731 },
    landmarks: [
      { name: 'Centre-ville Kolwezi', coordinates: { lat: -10.7143, lng: 25.4731 }, type: 'commercial' },
      { name: 'Aéroport de Kolwezi', coordinates: { lat: -10.7548, lng: 25.5056 }, type: 'transport' },
      { name: 'Zone minière', coordinates: { lat: -10.7200, lng: 25.4500 }, type: 'industrial' },
      { name: 'Marché central', coordinates: { lat: -10.7130, lng: 25.4750 }, type: 'commercial' }
    ]
  },
  likasi: {
    name: 'Likasi',
    bounds: {
      north: -10.90,
      south: -11.10,
      east: 26.80,
      west: 26.60
    },
    center: { lat: -10.9836, lng: 26.7312 },
    landmarks: [
      { name: 'Centre-ville Likasi', coordinates: { lat: -10.9836, lng: 26.7312 }, type: 'commercial' },
      { name: 'Panda', coordinates: { lat: -10.9900, lng: 26.7400 }, type: 'residential' },
      { name: 'Shituru', coordinates: { lat: -10.9750, lng: 26.7200 }, type: 'industrial' },
      { name: 'Marché de Likasi', coordinates: { lat: -10.9840, lng: 26.7320 }, type: 'commercial' }
    ]
  },
  abidjan: {
    name: 'Abidjan',
    bounds: {
      north: 5.50,
      south: 5.20,
      east: -3.80,
      west: -4.20
    },
    center: { lat: 5.3364, lng: -4.0267 },
    landmarks: [
      { name: 'Plateau', coordinates: { lat: 5.3208, lng: -4.0267 }, type: 'commercial' },
      { name: 'Cocody', coordinates: { lat: 5.3467, lng: -3.9831 }, type: 'residential' },
      { name: 'Adjamé', coordinates: { lat: 5.3669, lng: -4.0219 }, type: 'commercial' },
      { name: 'Yopougon', coordinates: { lat: 5.3364, lng: -4.0889 }, type: 'residential' },
      { name: 'Aéroport Félix Houphouët-Boigny', coordinates: { lat: 5.2614, lng: -3.9263 }, type: 'transport' },
      { name: 'Port d\'Abidjan', coordinates: { lat: 5.2947, lng: -4.0164 }, type: 'transport' },
      { name: 'Marché de Treichville', coordinates: { lat: 5.2922, lng: -4.0058 }, type: 'commercial' }
    ]
  }
};

export class AdvancedGeolocationService {
  private static instance: AdvancedGeolocationService;
  private watchId: number | null = null;
  private currentPosition: GeolocationPosition | null = null;
  private accuracy = 0;
  private lastKnownCity: string | null = null;

  static getInstance(): AdvancedGeolocationService {
    if (!this.instance) {
      this.instance = new AdvancedGeolocationService();
    }
    return this.instance;
  }

  // Obtenir la position avec précision maximale et fallback intelligent
  async getCurrentPosition(options: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    fallbackToIP?: boolean;
  } = {}): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    city?: string;
    landmark?: string;
  }> {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
      fallbackToIP: true,
      ...options
    };

    try {
      // Tenter d'obtenir la position GPS précise
      const position = await this.getHighAccuracyPosition(defaultOptions);
      
      const result = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      // Détecter la ville et les landmarks
      const cityInfo = this.detectCityAndLandmark(result.latitude, result.longitude);
      
      return {
        ...result,
        ...cityInfo
      };

    } catch (error) {
      console.warn('GPS failed, trying fallback methods:', error);
      
      if (defaultOptions.fallbackToIP) {
        return await this.fallbackToIPGeolocation();
      }
      
      throw error;
    }
  }

  // Position GPS haute précision
  private getHighAccuracyPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = position;
          this.accuracy = position.coords.accuracy;
          resolve(position);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: options.timeout || 15000,
          maximumAge: options.maximumAge || 60000
        }
      );
    });
  }

  // Fallback vers géolocalisation IP
  private async fallbackToIPGeolocation(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    city?: string;
    landmark?: string;
  }> {
    try {
      // Utiliser plusieurs services de géolocalisation IP
      const services = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://httpbin.org/ip'
      ];

      for (const serviceUrl of services) {
        try {
          const response = await fetch(serviceUrl);
          const data = await response.json();
          
          let lat, lng;
          if (data.latitude && data.longitude) {
            lat = data.latitude;
            lng = data.longitude;
          } else if (data.lat && data.lon) {
            lat = data.lat;
            lng = data.lon;
          } else {
            continue;
          }

          const cityInfo = this.detectCityAndLandmark(lat, lng);
          
          return {
            latitude: lat,
            longitude: lng,
            accuracy: 10000, // IP accuracy is low
            ...cityInfo
          };
        } catch (error) {
          console.warn(`IP geolocation service failed: ${serviceUrl}`, error);
        }
      }
      
      // Si tout échoue, utiliser Kinshasa par défaut
      return {
        latitude: -4.4419,
        longitude: 15.2663,
        accuracy: 50000,
        city: 'kinshasa',
        landmark: 'Centre-ville estimé'
      };
      
    } catch (error) {
      throw new Error('All geolocation methods failed');
    }
  }

  // Détecter la ville et le landmark le plus proche
  detectCityAndLandmark(latitude: number, longitude: number): {
    city?: string;
    landmark?: string;
  } {
    let closestCity: string | null = null;
    let closestLandmark: string | null = null;
    let minCityDistance = Infinity;
    let minLandmarkDistance = Infinity;

    // Vérifier chaque ville
    for (const [cityKey, cityConfig] of Object.entries(CITY_CONFIGURATIONS)) {
      // Vérifier si dans les bounds de la ville
      const { bounds } = cityConfig;
      if (
        latitude <= bounds.north &&
        latitude >= bounds.south &&
        longitude <= bounds.east &&
        longitude >= bounds.west
      ) {
        const cityDistance = this.calculateDistance(
          latitude, longitude,
          cityConfig.center.lat, cityConfig.center.lng
        );
        
        if (cityDistance < minCityDistance) {
          minCityDistance = cityDistance;
          closestCity = cityKey;
        }

        // Chercher le landmark le plus proche dans cette ville
        for (const landmark of cityConfig.landmarks) {
          const landmarkDistance = this.calculateDistance(
            latitude, longitude,
            landmark.coordinates.lat, landmark.coordinates.lng
          );
          
          if (landmarkDistance < minLandmarkDistance) {
            minLandmarkDistance = landmarkDistance;
            closestLandmark = landmark.name;
          }
        }
      }
    }

    // Si aucune ville détectée exactement, trouver la plus proche
    if (!closestCity) {
      for (const [cityKey, cityConfig] of Object.entries(CITY_CONFIGURATIONS)) {
        const distance = this.calculateDistance(
          latitude, longitude,
          cityConfig.center.lat, cityConfig.center.lng
        );
        
        if (distance < minCityDistance) {
          minCityDistance = distance;
          closestCity = cityKey;
        }
      }
    }

    this.lastKnownCity = closestCity;
    
    return {
      city: closestCity || undefined,
      landmark: closestLandmark || undefined
    };
  }

  // Surveillance continue de la position
  startWatching(callback: (position: {
    latitude: number;
    longitude: number;
    accuracy: number;
    city?: string;
    landmark?: string;
  }) => void): void {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = position;
        this.accuracy = position.coords.accuracy;
        
        const cityInfo = this.detectCityAndLandmark(
          position.coords.latitude,
          position.coords.longitude
        );
        
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          ...cityInfo
        });
      },
      (error) => {
        console.error('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Obtenir les landmarks d'une ville
  getCityLandmarks(city: string): Array<{
    name: string;
    coordinates: { lat: number; lng: number };
    type: string;
  }> {
    return CITY_CONFIGURATIONS[city]?.landmarks || [];
  }

  // Calculer distance entre deux points
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Obtenir la dernière ville connue
  getLastKnownCity(): string | null {
    return this.lastKnownCity;
  }

  // Estimer la précision actuelle
  getCurrentAccuracy(): number {
    return this.accuracy;
  }

  // Vérifier si la géolocalisation est de bonne qualité
  isHighAccuracy(): boolean {
    return this.accuracy <= 100; // Moins de 100m
  }
}

export const advancedGeoLocation = AdvancedGeolocationService.getInstance();