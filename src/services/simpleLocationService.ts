/**
 * Service de géolocalisation ultra-simplifié et robuste
 * Remplace tous les autres services pour une approche unifiée
 */

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type: 'gps' | 'cached' | 'default';
  accuracy?: number;
}

export interface LocationSearchResult extends LocationData {
  id: string;
  title: string;
  subtitle?: string;
}

// Coordonnées par défaut fiables pour chaque ville
const DEFAULT_LOCATIONS = {
  'Kinshasa': { 
    address: 'Kinshasa Centre, République Démocratique du Congo',
    lat: -4.3217, 
    lng: 15.3069 
  },
  'Lubumbashi': { 
    address: 'Lubumbashi Centre, République Démocratique du Congo',
    lat: -11.6708, 
    lng: 27.4794 
  },
  'Kolwezi': { 
    address: 'Kolwezi Centre, République Démocratique du Congo',
    lat: -10.7158, 
    lng: 25.4664 
  },
  'Abidjan': { 
    address: 'Abidjan Plateau, Côte d\'Ivoire',
    lat: 5.3600, 
    lng: -4.0083 
  }
} as const;

// Lieux populaires pré-définis pour recherche rapide
const POPULAR_PLACES: LocationSearchResult[] = [
  // Kinshasa
  { id: 'kin-1', title: 'Aéroport de N\'djili', subtitle: 'Kinshasa', address: 'Aéroport International de N\'djili, Kinshasa', lat: -4.3856, lng: 15.4446, type: 'default' },
  { id: 'kin-2', title: 'Centre-ville', subtitle: 'Gombe, Kinshasa', address: 'Boulevard du 30 Juin, Gombe, Kinshasa', lat: -4.3297, lng: 15.3153, type: 'default' },
  { id: 'kin-3', title: 'Marché Central', subtitle: 'Kinshasa', address: 'Marché Central, Kinshasa', lat: -4.3167, lng: 15.3000, type: 'default' },
  { id: 'kin-4', title: 'Université de Kinshasa', subtitle: 'Mont-Amba', address: 'Université de Kinshasa, Mont-Amba', lat: -4.4339, lng: 15.3777, type: 'default' },
  
  // Lubumbashi
  { id: 'lub-1', title: 'Aéroport de Luano', subtitle: 'Lubumbashi', address: 'Aéroport International de Luano, Lubumbashi', lat: -11.5913, lng: 27.5309, type: 'default' },
  { id: 'lub-2', title: 'Centre-ville', subtitle: 'Lubumbashi', address: 'Avenue Mobutu, Lubumbashi', lat: -11.6708, lng: 27.4794, type: 'default' },
  
  // Kolwezi
  { id: 'kol-1', title: 'Centre-ville', subtitle: 'Kolwezi', address: 'Avenue de la Mine, Kolwezi', lat: -10.7158, lng: 25.4664, type: 'default' },
  
  // Abidjan
  { id: 'abi-1', title: 'Aéroport Félix Houphouët-Boigny', subtitle: 'Abidjan', address: 'Aéroport International Félix Houphouët-Boigny', lat: 5.2539, lng: -3.9263, type: 'default' },
  { id: 'abi-2', title: 'Plateau', subtitle: 'Abidjan', address: 'Plateau, Abidjan', lat: 5.3236, lng: -4.0083, type: 'default' }
];

class SimpleLocationService {
  private static instance: SimpleLocationService;
  private cachedPosition: LocationData | null = null;
  private currentCity: string = 'Kinshasa';

  static getInstance(): SimpleLocationService {
    if (!this.instance) {
      this.instance = new SimpleLocationService();
    }
    return this.instance;
  }

  constructor() {
    this.loadCachedPosition();
  }

  /**
   * Obtenir la position actuelle avec fallback automatique
   */
  async getCurrentPosition(): Promise<LocationData> {
    try {
      // Tenter la géolocalisation GPS
      const position = await this.getGPSPosition();
      if (position) {
        this.cachePosition(position);
        return position;
      }
    } catch (error) {
      console.log('GPS non disponible, utilisation de la position par défaut');
    }

    // Fallback vers position par défaut
    return this.getDefaultPosition();
  }

  /**
   * Rechercher des lieux
   */
  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    if (!query.trim()) {
      return this.getPopularPlaces();
    }

    const normalizedQuery = query.toLowerCase();
    
    // Filtrer les lieux populaires selon la recherche
    const filtered = POPULAR_PLACES.filter(place => 
      place.title.toLowerCase().includes(normalizedQuery) ||
      place.subtitle?.toLowerCase().includes(normalizedQuery) ||
      place.address.toLowerCase().includes(normalizedQuery)
    );

    // Ajouter quelques suggestions génériques si peu de résultats
    if (filtered.length < 3) {
      const currentDefault = this.getDefaultPosition();
      filtered.push({
        id: `search-${Date.now()}`,
        title: query,
        subtitle: this.currentCity,
        address: `${query}, ${this.currentCity}`,
        lat: currentDefault.lat + (Math.random() - 0.5) * 0.01,
        lng: currentDefault.lng + (Math.random() - 0.5) * 0.01,
        type: 'default' as const
      });
    }

    return filtered.slice(0, 8);
  }

  /**
   * Obtenir les lieux populaires
   */
  getPopularPlaces(): LocationSearchResult[] {
    return POPULAR_PLACES.filter(place => 
      place.subtitle?.includes(this.currentCity) || 
      place.address.includes(this.currentCity)
    ).slice(0, 6);
  }

  /**
   * Calculer la distance entre deux points
   */
  calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  }

  /**
   * Formater la distance
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Définir la ville actuelle
   */
  setCurrentCity(city: string): void {
    this.currentCity = city;
  }

  // Méthodes privées
  private async getGPSPosition(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      const timeoutId = setTimeout(() => resolve(null), 5000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          resolve({
            address: `Position GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            type: 'gps',
            accuracy: position.coords.accuracy
          });
        },
        () => {
          clearTimeout(timeoutId);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 4000,
          maximumAge: 300000
        }
      );
    });
  }

  private getDefaultPosition(): LocationData {
    const defaultCoords = DEFAULT_LOCATIONS[this.currentCity as keyof typeof DEFAULT_LOCATIONS] || DEFAULT_LOCATIONS.Kinshasa;
    
    return {
      address: defaultCoords.address,
      lat: defaultCoords.lat,
      lng: defaultCoords.lng,
      type: 'default'
    };
  }

  private cachePosition(position: LocationData): void {
    this.cachedPosition = position;
    try {
      localStorage.setItem('kwenda_position', JSON.stringify({
        ...position,
        timestamp: Date.now()
      }));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  private loadCachedPosition(): void {
    try {
      const cached = localStorage.getItem('kwenda_position');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Utiliser le cache seulement s'il a moins de 1 heure
        if (Date.now() - parsed.timestamp < 3600000) {
          this.cachedPosition = parsed;
        }
      }
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton
export const simpleLocationService = SimpleLocationService.getInstance();