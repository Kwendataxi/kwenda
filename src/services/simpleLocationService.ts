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
      // 1. Vérifier le cache d'abord
      if (this.cachedPosition) {
        const age = Date.now() - (this.cachedPosition as any).timestamp;
        if (age < 300000) { // 5 minutes
          console.log('📍 Position récupérée du cache');
          return this.cachedPosition;
        }
      }

      // 2. Tenter la géolocalisation GPS réelle
      const gpsPosition = await this.getGPSPosition();
      if (gpsPosition) {
        this.cachePosition(gpsPosition);
        console.log('🎯 Position GPS obtenue:', gpsPosition.address);
        return gpsPosition;
      }

      // 3. Fallback vers géolocalisation IP
      const ipPosition = await this.getIPBasedLocation();
      if (ipPosition) {
        this.cachePosition(ipPosition);
        console.log('🌐 Position IP obtenue:', ipPosition.address);
        return ipPosition;
      }

    } catch (error) {
      console.warn('⚠️ Erreur géolocalisation:', error);
    }

    // 4. Dernier recours: position par défaut
    const defaultPos = this.getDefaultPosition();
    console.log('📍 Position par défaut utilisée:', defaultPos.address);
    return defaultPos;
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
        console.log('🚫 Géolocalisation non supportée');
        resolve(null);
        return;
      }

      const timeoutId = setTimeout(() => {
        console.log('⏰ Timeout GPS');
        resolve(null);
      }, 8000);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          
          // Géocodage inverse pour obtenir l'adresse
          let address = `Position GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
          
          try {
            const geocoded = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
            if (geocoded) address = geocoded;
          } catch (e) {
            console.warn('Géocodage inverse échoué:', e);
          }

          resolve({
            address,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            type: 'gps',
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn('❌ Erreur GPS:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 180000 // 3 minutes
        }
      );
    });
  }

  private async getIPBasedLocation(): Promise<LocationData | null> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          address: `${data.city}, ${data.country_name}`,
          lat: data.latitude,
          lng: data.longitude,
          type: 'cached'
        };
      }
    } catch (error) {
      console.warn('❌ Erreur géolocalisation IP:', error);
    }
    return null;
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      // Import supabase client dynamically to avoid circular imports
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Utiliser l'Edge Function Supabase pour le géocodage
      const { data, error } = await supabase.functions.invoke('geocode-reverse', {
        body: { lat, lng }
      });
      
      if (error) {
        console.warn('Edge Function error:', error);
        return null;
      }
      
      if (data?.success && data?.address) {
        return data.address;
      }
    } catch (error) {
      console.warn('Géocodage inverse échoué:', error);
    }
    return null;
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