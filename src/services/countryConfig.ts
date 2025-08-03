export interface City {
  name: string;
  coordinates: { lat: number; lng: number };
}

export interface TransportType {
  id: string;
  name: string;
  type: 'taxi' | 'bus' | 'moto' | 'car' | 'shared';
  baseFare: number;
  perKmRate: number;
  capacity: number;
  availability: boolean;
  features: string[];
  description: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  language: string;
  timezone: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  majorCities: City[];
  transportTypes: TransportType[];
  addressFormat: {
    format: string;
    components: string[];
  };
  mapboxCountryCode: string;
  defaultProximity?: { lat: number; lng: number };
}

// Country configurations
const COUNTRIES: Record<string, CountryConfig> = {
  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    currency: 'XOF',
    currencySymbol: 'CFA',
    language: 'fr',
    timezone: 'Africa/Abidjan',
    bbox: [-8.5, 4.0, -2.5, 10.5],
    mapboxCountryCode: 'ci',
    majorCities: [
      { name: 'Abidjan', coordinates: { lat: 5.3364, lng: -4.0267 } },
      { name: 'Yamoussoukro', coordinates: { lat: 6.8276, lng: -5.2893 } },
      { name: 'Bouaké', coordinates: { lat: 7.6843, lng: -5.0295 } },
      { name: 'San Pedro', coordinates: { lat: 4.7369, lng: -6.6361 } },
      { name: 'Korhogo', coordinates: { lat: 9.4580, lng: -5.6297 } }
    ],
    defaultProximity: { lat: 5.3364, lng: -4.0267 }, // Abidjan
    transportTypes: [
      {
        id: 'woro-woro',
        name: 'Wôrô-wôrô',
        type: 'shared',
        baseFare: 200,
        perKmRate: 100,
        capacity: 18,
        availability: true,
        features: ['Économique', 'Partagé', 'Lignes fixes'],
        description: 'Transport en commun traditionnel d\'Abidjan'
      },
      {
        id: 'taxi-compteur',
        name: 'Taxi compteur',
        type: 'taxi',
        baseFare: 1000,
        perKmRate: 500,
        capacity: 4,
        availability: true,
        features: ['Climatisé', 'Compteur', 'Privé'],
        description: 'Taxi officiel avec compteur'
      },
      {
        id: 'moto-taxi',
        name: 'Moto-taxi',
        type: 'moto',
        baseFare: 300,
        perKmRate: 200,
        capacity: 1,
        availability: true,
        features: ['Rapide', 'Économique', 'Trafic'],
        description: 'Transport rapide en moto'
      },
      {
        id: 'gbaka',
        name: 'Gbaka',
        type: 'bus',
        baseFare: 150,
        perKmRate: 75,
        capacity: 25,
        availability: true,
        features: ['Très économique', 'Partagé', 'Populaire'],
        description: 'Minibus de transport populaire'
      }
    ],
    addressFormat: {
      format: '{street}, {district}, {city}',
      components: ['street', 'district', 'city', 'country']
    }
  },
  
  FR: {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    language: 'fr',
    timezone: 'Europe/Paris',
    bbox: [-5.0, 42.0, 9.0, 51.0],
    mapboxCountryCode: 'fr',
    majorCities: [
      { name: 'Paris', coordinates: { lat: 48.8566, lng: 2.3522 } },
      { name: 'Lyon', coordinates: { lat: 45.7640, lng: 4.8357 } },
      { name: 'Marseille', coordinates: { lat: 43.2965, lng: 5.3698 } },
      { name: 'Toulouse', coordinates: { lat: 43.6047, lng: 1.4442 } },
      { name: 'Nice', coordinates: { lat: 43.7102, lng: 7.2620 } }
    ],
    defaultProximity: { lat: 48.8566, lng: 2.3522 }, // Paris
    transportTypes: [
      {
        id: 'taxi',
        name: 'Taxi',
        type: 'taxi',
        baseFare: 700,
        perKmRate: 150,
        capacity: 4,
        availability: true,
        features: ['Confort', 'Rapide', 'Disponible 24h/7'],
        description: 'Taxi traditionnel français'
      },
      {
        id: 'vtc',
        name: 'VTC',
        type: 'car',
        baseFare: 500,
        perKmRate: 120,
        capacity: 4,
        availability: true,
        features: ['Réservation', 'Confort', 'Prix fixe'],
        description: 'Véhicule de transport avec chauffeur'
      }
    ],
    addressFormat: {
      format: '{number} {street}, {postalCode} {city}',
      components: ['number', 'street', 'postalCode', 'city', 'country']
    }
  },

  CD: {
    code: 'CD',
    name: 'République Démocratique du Congo',
    currency: 'CDF',
    currencySymbol: 'FC',
    language: 'fr',
    timezone: 'Africa/Kinshasa',
    bbox: [12.0, -13.0, 31.0, 5.5],
    mapboxCountryCode: 'cd',
    majorCities: [
      { name: 'Kinshasa', coordinates: { lat: -4.4419, lng: 15.2663 } },
      { name: 'Lubumbashi', coordinates: { lat: -11.6609, lng: 27.4794 } },
      { name: 'Mbuji-Mayi', coordinates: { lat: -6.1364, lng: 23.5886 } },
      { name: 'Kisangani', coordinates: { lat: 0.5167, lng: 25.2167 } },
      { name: 'Kolwezi', coordinates: { lat: -10.7143, lng: 25.4731 } }
    ],
    defaultProximity: { lat: -4.4419, lng: 15.2663 }, // Kinshasa
    transportTypes: [
      {
        id: 'taxi-bus',
        name: 'Taxi-bus',
        type: 'shared',
        baseFare: 300,
        perKmRate: 150,
        capacity: 20,
        availability: true,
        features: ['Économique', 'Partagé', 'Urbain'],
        description: 'Transport en commun de Kinshasa'
      },
      {
        id: 'moto-taxi',
        name: 'Moto-taxi',
        type: 'moto',
        baseFare: 200,
        perKmRate: 100,
        capacity: 1,
        availability: true,
        features: ['Rapide', 'Économique', 'Flexible'],
        description: 'Transport rapide en moto'
      }
    ],
    addressFormat: {
      format: '{street}, {commune}, {city}',
      components: ['street', 'commune', 'city', 'country']
    }
  },

  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    language: 'en',
    timezone: 'America/New_York',
    bbox: [-125.0, 25.0, -66.0, 49.0],
    mapboxCountryCode: 'us',
    majorCities: [
      { name: 'New York', coordinates: { lat: 40.7128, lng: -74.0060 } },
      { name: 'Los Angeles', coordinates: { lat: 34.0522, lng: -118.2437 } },
      { name: 'Chicago', coordinates: { lat: 41.8781, lng: -87.6298 } },
      { name: 'Houston', coordinates: { lat: 29.7604, lng: -95.3698 } },
      { name: 'Miami', coordinates: { lat: 25.7617, lng: -80.1918 } }
    ],
    defaultProximity: { lat: 40.7128, lng: -74.0060 }, // New York
    transportTypes: [
      {
        id: 'taxi',
        name: 'Taxi',
        type: 'taxi',
        baseFare: 250,
        perKmRate: 200,
        capacity: 4,
        availability: true,
        features: ['Licensed', '24/7', 'Metered'],
        description: 'Traditional yellow cab'
      },
      {
        id: 'rideshare',
        name: 'Rideshare',
        type: 'car',
        baseFare: 200,
        perKmRate: 150,
        capacity: 4,
        availability: true,
        features: ['App-based', 'Upfront pricing', 'Tracking'],
        description: 'Uber/Lyft style service'
      }
    ],
    addressFormat: {
      format: '{number} {street}, {city}, {state} {zip}',
      components: ['number', 'street', 'city', 'state', 'zip', 'country']
    }
  }
};

export class CountryService {
  private static currentCountry: CountryConfig = COUNTRIES.CI; // Default to Côte d'Ivoire
  private static detectionCallbacks: ((country: CountryConfig) => void)[] = [];

  static getCurrentCountry(): CountryConfig {
    return this.currentCountry;
  }

  static setCurrentCountry(countryCode: string): void {
    const country = COUNTRIES[countryCode.toUpperCase()];
    if (country) {
      this.currentCountry = country;
      console.log('Country set to:', country.name);
      
      // Notify all listeners
      this.detectionCallbacks.forEach(callback => callback(country));
    } else {
      console.warn('Unknown country code:', countryCode);
    }
  }

  static onCountryChange(callback: (country: CountryConfig) => void): () => void {
    this.detectionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.detectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.detectionCallbacks.splice(index, 1);
      }
    };
  }

  static async autoDetectAndSetCountry(latitude: number, longitude: number): Promise<void> {
    try {
      // Find the country that contains these coordinates
      for (const [code, config] of Object.entries(COUNTRIES)) {
        const [minLng, minLat, maxLng, maxLat] = config.bbox;
        if (longitude >= minLng && longitude <= maxLng && 
            latitude >= minLat && latitude <= maxLat) {
          this.setCurrentCountry(code);
          return;
        }
      }
      
      console.log('Coordinates not in any configured country, keeping current:', this.currentCountry.name);
    } catch (error) {
      console.warn('Failed to auto-detect country from coordinates:', error);
    }
  }

  static getAllCountries(): CountryConfig[] {
    return Object.values(COUNTRIES);
  }

  static getCountryByCode(code: string): CountryConfig | undefined {
    return COUNTRIES[code.toUpperCase()];
  }

  static findNearestCity(latitude: number, longitude: number): City | null {
    const country = this.getCurrentCountry();
    let nearestCity: City | null = null;
    let minDistance = Infinity;

    for (const city of country.majorCities) {
      const distance = this.calculateDistance(
        latitude, longitude,
        city.coordinates.lat, city.coordinates.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    return nearestCity;
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}