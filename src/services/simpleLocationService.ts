/**
 * Service de géolocalisation ultra-simplifié et robuste
 * Remplace tous les autres services pour une approche unifiée
 */

// Type declarations for Capacitor
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  type: 'gps' | 'cached' | 'default' | 'capacitor';
  accuracy?: number;
  source?: 'capacitor' | 'browser' | 'ip' | 'cache';
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  interval?: number; // For continuous tracking (milliseconds)
  distanceFilter?: number; // Minimum distance change (meters)
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
  private watchId: string | number | null = null;
  private isCapacitorAvailable: boolean = false;

  static getInstance(): SimpleLocationService {
    if (!this.instance) {
      this.instance = new SimpleLocationService();
    }
    return this.instance;
  }

  constructor() {
    this.loadCachedPosition();
    this.checkCapacitorAvailability();
  }

  private checkCapacitorAvailability(): void {
    try {
      // Check if Capacitor is available
      this.isCapacitorAvailable = typeof window !== 'undefined' && 
        window.Capacitor !== undefined && 
        typeof window.Capacitor.isNativePlatform === 'function';
      
      console.log(`📱 Capacitor disponible: ${this.isCapacitorAvailable}`);
    } catch (error) {
      this.isCapacitorAvailable = false;
    }
  }

  /**
   * Obtenir la position actuelle avec fallback automatique
   */
  async getCurrentPosition(options?: GeolocationOptions): Promise<LocationData> {
    try {
      // 1. Vérifier le cache d'abord (sauf si on demande une position fraîche)
      if (this.cachedPosition && !options?.enableHighAccuracy && options?.maximumAge !== 0) {
        const age = Date.now() - (this.cachedPosition as any).timestamp;
        if (age < (options?.maximumAge ?? 300000)) { // Utiliser maximumAge ou 5 minutes par défaut
          console.log('📍 Position récupérée du cache');
          return this.cachedPosition;
        }
      }

      // 2. Tenter Capacitor Geolocation d'abord (plus précis sur mobile)
      if (this.isCapacitorAvailable) {
        const capacitorPosition = await this.getCapacitorPosition(options);
        if (capacitorPosition) {
          this.cachePosition(capacitorPosition);
          console.log('📱 Position Capacitor obtenue:', capacitorPosition.address);
          return capacitorPosition;
        }
      }

      // 3. Fallback vers géolocalisation GPS navigateur
      const gpsPosition = await this.getBrowserGPSPosition(options);
      if (gpsPosition) {
        this.cachePosition(gpsPosition);
        console.log('🎯 Position GPS obtenue:', gpsPosition.address);
        return gpsPosition;
      }

      // 4. Fallback vers géolocalisation IP
      const ipPosition = await this.getIPBasedLocation();
      if (ipPosition) {
        this.cachePosition(ipPosition);
        console.log('🌐 Position IP obtenue:', ipPosition.address);
        return ipPosition;
      }

    } catch (error) {
      console.warn('⚠️ Erreur géolocalisation:', error);
    }

    // 5. Dernier recours: position par défaut
    const defaultPos = this.getDefaultPosition();
    console.log('📍 Position par défaut utilisée:', defaultPos.address);
    return defaultPos;
  }

  /**
   * Rechercher des lieux universellement
   */
  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    if (!query.trim()) {
      return this.getPopularPlaces();
    }

    try {
      // Import supabase client dynamically
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Obtenir la position actuelle pour améliorer la recherche
      let currentPos = this.cachedPosition;
      if (!currentPos) {
        try {
          currentPos = await this.getCurrentPosition();
        } catch (e) {
          // Ignore error, use default
        }
      }
      
      // Utiliser l'Edge Function pour la recherche globale
      const { data, error } = await supabase.functions.invoke('places-search', {
        body: { 
          query: query.trim(),
          lat: currentPos?.lat,
          lng: currentPos?.lng,
          radius: 50000 // 50km radius
        }
      });
      
      if (error) {
        console.warn('Places search API error:', error);
        return this.getFallbackSearchResults(query);
      }
      
      if (data?.success && data?.results) {
        console.log(`🔍 Found ${data.results.length} places for "${query}"`);
        return data.results;
      }
      
    } catch (error) {
      console.warn('Places search failed:', error);
    }

    // Fallback to local search + popular places
    return this.getFallbackSearchResults(query);
  }

  /**
   * Résultats de fallback pour la recherche
   */
  private getFallbackSearchResults(query: string): LocationSearchResult[] {
    const normalizedQuery = query.toLowerCase();
    
    // Filtrer les lieux populaires selon la recherche
    const filtered = POPULAR_PLACES.filter(place => 
      place.title.toLowerCase().includes(normalizedQuery) ||
      place.subtitle?.toLowerCase().includes(normalizedQuery) ||
      place.address.toLowerCase().includes(normalizedQuery)
    );

    // Ajouter suggestion générique
    const currentDefault = this.getDefaultPosition();
    filtered.unshift({
      id: `search-${Date.now()}`,
      title: query,
      subtitle: 'Rechercher cette adresse',
      address: query,
      lat: currentDefault.lat + (Math.random() - 0.5) * 0.01,
      lng: currentDefault.lng + (Math.random() - 0.5) * 0.01,
      type: 'default' as const
    });

    return filtered.slice(0, 8);
  }

  /**
   * Obtenir les lieux populaires (mix global + locaux)
   */
  getPopularPlaces(): LocationSearchResult[] {
    // Retourner les lieux populaires de la ville actuelle + quelques suggestions globales
    const localPlaces = POPULAR_PLACES.filter(place => 
      place.subtitle?.includes(this.currentCity) || 
      place.address.includes(this.currentCity)
    ).slice(0, 4);

    const globalSuggestions = POPULAR_PLACES.filter(place => 
      !place.subtitle?.includes(this.currentCity) && 
      !place.address.includes(this.currentCity)
    ).slice(0, 2);

    return [...localPlaces, ...globalSuggestions];
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
   * Commencer le suivi en temps réel
   */
  async startTracking(
    callback: (position: LocationData) => void,
    options?: GeolocationOptions
  ): Promise<void> {
    const trackingOptions = {
      enableHighAccuracy: true,
      interval: 5000, // 5 secondes par défaut
      distanceFilter: 10, // 10 mètres minimum
      ...options
    };

    if (this.isCapacitorAvailable) {
      await this.startCapacitorTracking(callback, trackingOptions);
    } else {
      await this.startBrowserTracking(callback, trackingOptions);
    }
  }

  /**
   * Arrêter le suivi
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      if (this.isCapacitorAvailable) {
        this.stopCapacitorTracking();
      } else {
        this.stopBrowserTracking();
      }
      this.watchId = null;
      console.log('🛑 Suivi de position arrêté');
    }
  }

  /**
   * Définir la ville actuelle
   */
  setCurrentCity(city: string): void {
    this.currentCity = city;
  }

  // Méthodes privées
  
  /**
   * Obtenir position via Capacitor (natif mobile)
   */
  private async getCapacitorPosition(options?: GeolocationOptions): Promise<LocationData | null> {
    try {
      // Import dynamique pour éviter les erreurs SSR
      const { Geolocation } = await import('@capacitor/geolocation');
      
      // Vérifier les permissions
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') {
          console.warn('🚫 Permissions géolocalisation refusées');
          return null;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 60000
      });

      // Géocodage inverse pour obtenir l'adresse
      let address = `Position GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
      
      try {
        const geocoded = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (geocoded) address = geocoded;
      } catch (e) {
        console.warn('Géocodage inverse échoué:', e);
      }

      return {
        address,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        type: 'capacitor',
        accuracy: position.coords.accuracy,
        source: 'capacitor'
      };
    } catch (error) {
      console.warn('❌ Erreur Capacitor Geolocation:', error);
      return null;
    }
  }

  /**
   * Suivi en temps réel via Capacitor
   */
  private async startCapacitorTracking(
    callback: (position: LocationData) => void,
    options: GeolocationOptions
  ): Promise<void> {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      
      this.watchId = await Geolocation.watchPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000
      }, async (position, err) => {
        if (err) {
          console.warn('❌ Erreur tracking Capacitor:', err);
          return;
        }
        
        if (position) {
          // Géocodage inverse
          let address = `Position GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
          
          try {
            const geocoded = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
            if (geocoded) address = geocoded;
          } catch (e) {
            // Ignore geocoding errors during tracking
          }

          const locationData: LocationData = {
            address,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            type: 'capacitor',
            accuracy: position.coords.accuracy,
            source: 'capacitor'
          };

          callback(locationData);
        }
      });

      console.log('📱 Suivi Capacitor démarré');
    } catch (error) {
      console.warn('❌ Erreur démarrage tracking Capacitor:', error);
    }
  }

  /**
   * Arrêter le suivi Capacitor
   */
  private async stopCapacitorTracking(): Promise<void> {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      if (this.watchId !== null) {
        await Geolocation.clearWatch({ id: this.watchId as string });
      }
    } catch (error) {
      console.warn('❌ Erreur arrêt tracking Capacitor:', error);
    }
  }

  /**
   * Suivi en temps réel via navigateur
   */
  private startBrowserTracking(
    callback: (position: LocationData) => void,
    options: GeolocationOptions
  ): void {
    if (!navigator.geolocation) {
      console.warn('🚫 Géolocalisation navigateur non supportée');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        // Géocodage inverse
        let address = `Position GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`;
        
        try {
          const geocoded = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
          if (geocoded) address = geocoded;
        } catch (e) {
          // Ignore geocoding errors during tracking
        }

        const locationData: LocationData = {
          address,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          type: 'gps',
          accuracy: position.coords.accuracy,
          source: 'browser'
        };

        callback(locationData);
      },
      (error) => {
        console.warn('❌ Erreur tracking navigateur:', error.message);
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 60000
      }
    );

    console.log('🌐 Suivi navigateur démarré');
  }

  /**
   * Arrêter le suivi navigateur
   */
  private stopBrowserTracking(): void {
    if (navigator.geolocation && this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId as number);
    }
  }

  /**
   * Fallback géolocalisation navigateur améliorée
   */
  private async getBrowserGPSPosition(options?: GeolocationOptions): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('🚫 Géolocalisation non supportée');
        resolve(null);
        return;
      }

      const timeout = options?.timeout ?? 15000; // Augmenté à 15 secondes
      console.log(`⏰ Tentative GPS avec timeout de ${timeout}ms`);

      const timeoutId = setTimeout(() => {
        console.log('⏰ Timeout GPS après', timeout, 'ms');
        resolve(null);
      }, timeout);

      // Demander les permissions explicitement
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'denied') {
            console.log('🚫 Permissions GPS refusées');
            clearTimeout(timeoutId);
            resolve(null);
            return;
          }
        }).catch(() => {
          // Ignore permission errors, continue with geolocation
        });
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          console.log('✅ Position GPS obtenue:', position.coords.latitude, position.coords.longitude);
          
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
            accuracy: position.coords.accuracy,
            source: 'browser'
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn('❌ Erreur GPS:', error.message, 'Code:', error.code);
          
          // Log détaillé des erreurs
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.log('🚫 Permission refusée - demander à l\'utilisateur d\'autoriser');
              break;
            case error.POSITION_UNAVAILABLE:
              console.log('📍 Position indisponible - problème réseau/satellites');
              break;
            case error.TIMEOUT:
              console.log('⏰ Timeout GPS - augmenter le délai ou utiliser IP');
              break;
          }
          
          resolve(null);
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: timeout,
          maximumAge: options?.maximumAge ?? 300000 // 5 minutes
        }
      );
    });
  }

  private async getIPBasedLocation(): Promise<LocationData | null> {
    try {
      console.log('🌐 Tentative géolocalisation IP via Edge Function...');
      
      // Import supabase client dynamically
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Utiliser notre Edge Function fiable
      const { data, error } = await supabase.functions.invoke('ip-geolocation');
      
      if (error) {
        console.warn('❌ Edge Function IP géolocalisation échouée:', error);
        return null;
      }
      
      if (data?.success && data?.data) {
        console.log('✅ Géolocalisation IP réussie:', data.data.address);
        return {
          address: data.data.address,
          lat: data.data.lat,
          lng: data.data.lng,
          type: 'cached',
          source: data.data.source,
          accuracy: data.data.accuracy
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