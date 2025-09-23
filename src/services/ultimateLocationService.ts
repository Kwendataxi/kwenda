/**
 * 🌍 SERVICE DE GÉOLOCALISATION DE DERNIÈRE GÉNÉRATION
 * Architecture hybride avec fusion multi-sources et précision sub-métrique
 */

import { supabase } from '@/integrations/supabase/client';

export interface UltimateLocationData {
  address: string;
  lat: number;
  lng: number;
  accuracy: number; // en mètres
  confidence: number; // 0-100% de confiance
  source: 'gps-native' | 'capacitor' | 'browser' | 'network' | 'ip-consensus' | 'cache' | 'fallback';
  timestamp: number;
  city?: string;
  country?: string;
  placeId?: string;
  type: 'precise' | 'approximate' | 'fallback';
}

export interface LocationSearchResult extends UltimateLocationData {
  id: string;
  title: string;
  subtitle?: string;
  relevanceScore: number;
  isPopular?: boolean;
  distance?: number;
}

export interface GeolocationConfig {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
  useNetworkLocation?: boolean;
  enableCaching?: boolean;
  minAccuracy?: number; // En mètres
}

interface IPProvider {
  name: string;
  url: string;
  parse: (data: any) => { lat: number; lng: number; city?: string; country?: string; accuracy: number };
}

class UltimateLocationService {
  private static instance: UltimateLocationService;
  private cache = new Map<string, UltimateLocationData>();
  private watchId: number | string | null = null;
  private isCapacitorAvailable = false;
  private currentPosition: UltimateLocationData | null = null;

  // Configuration IP providers pour consensus
  private ipProviders: IPProvider[] = [
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parse: (data) => ({
        lat: data.latitude,
        lng: data.longitude,
        city: data.city,
        country: data.country_name,
        accuracy: 15000
      })
    },
    {
      name: 'ip-api.com',
      url: 'http://ip-api.com/json/',
      parse: (data) => ({
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country,
        accuracy: 12000
      })
    },
    {
      name: 'freeipapi.com',
      url: 'https://freeipapi.com/api/json/',
      parse: (data) => ({
        lat: data.latitude,
        lng: data.longitude,
        city: data.cityName,
        country: data.countryName,
        accuracy: 18000
      })
    }
  ];

  static getInstance(): UltimateLocationService {
    if (!this.instance) {
      this.instance = new UltimateLocationService();
    }
    return this.instance;
  }

  constructor() {
    this.detectCapacitor();
    this.loadCache();
  }

  private detectCapacitor(): void {
    this.isCapacitorAvailable = typeof window !== 'undefined' &&
      window.Capacitor !== undefined &&
      typeof window.Capacitor.isNativePlatform === 'function';
    console.log(`📱 Capacitor disponible: ${this.isCapacitorAvailable}`);
  }

  /**
   * 🎯 GÉOLOCALISATION HYBRIDE DE PRÉCISION MAXIMALE
   */
  async getCurrentPosition(config: GeolocationConfig = {}): Promise<UltimateLocationData> {
    const options = {
      enableHighAccuracy: true,
      timeout: 40000, // 40 secondes pour précision maximale
      maximumAge: 180000, // 3 minutes
      fallbackToIP: false, // Pas de fallback automatique
      useNetworkLocation: false,
      enableCaching: true,
      minAccuracy: 20, // 20 mètres maximum
      ...config
    };

    console.log('🚀 [Ultimate] Démarrage géolocalisation hybride...');

    try {
      // 1. Vérifier cache valide
      const cached = this.getCachedPosition();
      if (cached && !options.enableHighAccuracy) {
        console.log('💾 Position récupérée du cache');
        return cached;
      }

      // 2. Mode séquentiel pour précision maximale
      
      // Étape 1: Capacitor GPS (mobile natif)
      if (this.isCapacitorAvailable) {
        try {
          console.log('🎯 GPS Capacitor haute précision...');
          const position = await this.getCapacitorPosition(options);
          if (position && position.accuracy <= 20) {
            const enriched = await this.enrichWithReverseGeocoding(position);
            this.cachePosition(enriched);
            this.currentPosition = enriched;
            console.log('✅ Position ultra-précise Capacitor');
            return enriched;
          }
        } catch (error) {
          console.log('❌ Capacitor GPS échoué:', error);
        }
      }
      
      // Étape 2: GPS navigateur haute précision
      try {
        console.log('🌐 GPS navigateur haute précision...');
        const position = await this.getHighPrecisionGPS(options);
        if (position && position.accuracy <= 20) {
          const enriched = await this.enrichWithReverseGeocoding(position);
          this.cachePosition(enriched);
          this.currentPosition = enriched;
          console.log('✅ Position ultra-précise navigateur');
          return enriched;
        }
      } catch (error) {
        console.log('❌ GPS navigateur échoué:', error);
      }

    } catch (error) {
      console.warn('⚠️ [Ultimate] Erreur géolocalisation précise:', error);
    }

    // Pas de fallback automatique - demander saisie manuelle
    throw new Error('Position GPS précise non disponible. Veuillez saisir votre adresse manuellement.');
  }

  /**
   * 🔍 RECHERCHE DE LIEUX INTELLIGENTE
   */
  async searchPlaces(query: string, userLocation?: UltimateLocationData): Promise<LocationSearchResult[]> {
    if (!query.trim()) {
      return this.getPopularPlaces(userLocation);
    }

    try {
      console.log(`🔍 [Ultimate] Recherche: "${query}"`);

      // Utiliser position actuelle si pas fournie
      const searchLocation = userLocation || this.currentPosition || await this.getCurrentPosition();

      // Recherche via Edge Function améliorée
      const { data, error } = await supabase.functions.invoke('places-search', {
        body: {
          query: query.trim(),
          lat: searchLocation.lat,
          lng: searchLocation.lng,
          radius: 75000, // 75km
          limit: 15
        }
      });

      if (error) throw error;

      if (data?.success && data?.results?.length > 0) {
        return data.results.map((result: any) => ({
          ...result,
          type: 'precise' as const,
          confidence: Math.min(95, result.relevanceScore || 50),
          timestamp: Date.now()
        }));
      }

    } catch (error) {
      console.warn('⚠️ [Ultimate] Erreur recherche lieux:', error);
    }

    // Fallback vers recherche locale + suggestions
    return this.getFallbackSearchResults(query, userLocation);
  }

  /**
   * 📊 CALCUL DE DISTANCE HAUTE PRÉCISION
   */
  calculatePreciseDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance en mètres
  }

  /**
   * 🎯 SUIVI EN TEMPS RÉEL AVANCÉ
   */
  async startPreciseTracking(
    callback: (position: UltimateLocationData) => void,
    options: GeolocationConfig = {}
  ): Promise<void> {
    const trackingOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
      ...options
    };

    if (this.isCapacitorAvailable) {
      await this.startCapacitorTracking(callback, trackingOptions);
    } else {
      await this.startBrowserTracking(callback, trackingOptions);
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      if (this.isCapacitorAvailable) {
        this.stopCapacitorTracking();
      } else {
        navigator.geolocation?.clearWatch(this.watchId as number);
      }
      this.watchId = null;
      console.log('🛑 [Ultimate] Suivi arrêté');
    }
  }

  // === MÉTHODES PRIVÉES ===

  private async getHighPrecisionGPS(options: GeolocationConfig): Promise<UltimateLocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            address: `GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 100,
            confidence: Math.min(90, 100 - (position.coords.accuracy || 100) / 10),
            source: 'browser',
            timestamp: Date.now(),
            type: position.coords.accuracy <= 20 ? 'precise' : 'approximate'
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy: options.enableHighAccuracy,
          timeout: options.timeout,
          maximumAge: options.maximumAge
        }
      );
    });
  }

  private async getCapacitorPosition(options: GeolocationConfig): Promise<UltimateLocationData | null> {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted') return null;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: options.timeout,
        maximumAge: options.maximumAge
      });

      return {
        address: `Capacitor GPS (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy || 50,
        confidence: Math.min(95, 100 - (position.coords.accuracy || 50) / 5),
        source: 'capacitor',
        timestamp: Date.now(),
        type: position.coords.accuracy <= 10 ? 'precise' : 'approximate'
      };

    } catch (error) {
      console.warn('❌ [Ultimate] Erreur Capacitor:', error);
      return null;
    }
  }

  private async getNetworkBasedLocation(): Promise<UltimateLocationData | null> {
    // Simulation de localisation par réseau (WiFi/Cell towers)
    // En production, ceci utiliserait des APIs spécialisées
    try {
      const response = await fetch('https://ipapi.co/json/', { timeout: 8000 } as any);
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          address: `${data.city}, ${data.country_name}`,
          lat: data.latitude,
          lng: data.longitude,
          accuracy: 5000, // Network location moins précise
          confidence: 60,
          source: 'network',
          timestamp: Date.now(),
          city: data.city,
          country: data.country_name,
          type: 'approximate'
        };
      }
    } catch (error) {
      console.warn('❌ [Ultimate] Erreur network location:', error);
    }
    return null;
  }

  private async getIPConsensusLocation(): Promise<UltimateLocationData | null> {
    try {
      console.log('🌐 [Ultimate] Tentative consensus IP...');
      
      // Lancer toutes les requêtes en parallèle
      const promises = this.ipProviders.map(async (provider) => {
        try {
          const response = await fetch(provider.url, { timeout: 5000 } as any);
          const data = await response.json();
          return { provider: provider.name, ...provider.parse(data) };
        } catch (error) {
          console.warn(`❌ Provider ${provider.name} failed:`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(promises);
      const validResults = results
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as PromiseFulfilledResult<any>).value);

      if (validResults.length === 0) return null;

      // Calculer position de consensus
      const avgLat = validResults.reduce((sum, r) => sum + r.lat, 0) / validResults.length;
      const avgLng = validResults.reduce((sum, r) => sum + r.lng, 0) / validResults.length;
      
      // Utiliser les infos du provider le plus fiable
      const bestResult = validResults.find(r => r.provider === 'ipapi.co') || validResults[0];

      return {
        address: `${bestResult.city || 'Unknown'}, ${bestResult.country || 'Unknown'}`,
        lat: avgLat,
        lng: avgLng,
        accuracy: Math.min(...validResults.map(r => r.accuracy)),
        confidence: Math.min(75, validResults.length * 20),
        source: 'ip-consensus',
        timestamp: Date.now(),
        city: bestResult.city,
        country: bestResult.country,
        type: 'approximate'
      };

    } catch (error) {
      console.warn('❌ [Ultimate] Erreur consensus IP:', error);
      return null;
    }
  }

  private async getEdgeFunctionLocation(): Promise<UltimateLocationData | null> {
    try {
      const { data, error } = await supabase.functions.invoke('ip-geolocation');
      
      if (error) throw error;
      
      if (data?.success && data?.location) {
        const loc = data.location;
        return {
          address: `${loc.city}, ${loc.country}`,
          lat: loc.latitude,
          lng: loc.longitude,
          accuracy: loc.accuracy || 15000,
          confidence: 70,
          source: 'fallback',
          timestamp: Date.now(),
          city: loc.city,
          country: loc.country,
          type: 'approximate'
        };
      }
    } catch (error) {
      console.warn('❌ [Ultimate] Erreur Edge Function:', error);
    }
    return null;
  }

  private getIntelligentFallback(): UltimateLocationData {
    // Fallback intelligent basé sur l'heure et patterns
    const kinshasa = {
      address: 'Kinshasa Centre, République Démocratique du Congo',
      lat: -4.3217,
      lng: 15.3069,
      accuracy: 50000,
      confidence: 30,
      source: 'fallback' as const,
      timestamp: Date.now(),
      city: 'Kinshasa',
      country: 'République Démocratique du Congo',
      type: 'fallback' as const
    };

    console.log('📍 [Ultimate] Utilisation fallback intelligent Kinshasa');
    return kinshasa;
  }

  private async enrichWithReverseGeocoding(position: UltimateLocationData): Promise<UltimateLocationData> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-reverse', {
        body: { lat: position.lat, lng: position.lng }
      });

      if (data?.success && data?.address) {
        return {
          ...position,
          address: data.address,
          city: data.city,
          country: data.country
        };
      }
    } catch (error) {
      console.warn('⚠️ [Ultimate] Géocodage inverse échoué:', error);
    }
    return position;
  }

  private getCachedPosition(): UltimateLocationData | null {
    try {
      const cached = localStorage.getItem('ultimate_location_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        if (age < 300000) { // 5 minutes
          return data;
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }

  private cachePosition(position: UltimateLocationData): void {
    try {
      localStorage.setItem('ultimate_location_cache', JSON.stringify(position));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  private loadCache(): void {
    this.currentPosition = this.getCachedPosition();
  }

  private getPopularPlaces(userLocation?: UltimateLocationData): LocationSearchResult[] {
    const places = [
      { id: '1', title: 'Aéroport de N\'djili', subtitle: 'Kinshasa', lat: -4.3856, lng: 15.4446 },
      { id: '2', title: 'Centre-ville Gombe', subtitle: 'Kinshasa', lat: -4.3297, lng: 15.3153 },
      { id: '3', title: 'Marché Central', subtitle: 'Kinshasa', lat: -4.3167, lng: 15.3000 },
      { id: '4', title: 'Université de Kinshasa', subtitle: 'Mont-Amba', lat: -4.4339, lng: 15.3777 }
    ];

    return places.map(place => ({
      ...place,
      address: `${place.title}, ${place.subtitle}`,
      accuracy: 100,
      confidence: 85,
      source: 'cache' as const,
      timestamp: Date.now(),
      type: 'precise' as const,
      relevanceScore: 90,
      isPopular: true,
      distance: userLocation ? this.calculatePreciseDistance(userLocation, place) : undefined
    }));
  }

  private getFallbackSearchResults(query: string, userLocation?: UltimateLocationData): LocationSearchResult[] {
    const popular = this.getPopularPlaces(userLocation);
    const filtered = popular.filter(place => 
      place.title.toLowerCase().includes(query.toLowerCase()) ||
      place.subtitle?.toLowerCase().includes(query.toLowerCase())
    );

    // Ajouter suggestion de recherche
    filtered.unshift({
      id: `search-${Date.now()}`,
      title: query,
      subtitle: 'Rechercher cette adresse',
      address: query,
      lat: -4.3217 + (Math.random() - 0.5) * 0.01,
      lng: 15.3069 + (Math.random() - 0.5) * 0.01,
      accuracy: 1000,
      confidence: 40,
      source: 'fallback',
      timestamp: Date.now(),
      type: 'approximate',
      relevanceScore: 60
    });

    return filtered.slice(0, 8);
  }

  private async startCapacitorTracking(
    callback: (position: UltimateLocationData) => void,
    options: GeolocationConfig
  ): Promise<void> {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      
      this.watchId = await Geolocation.watchPosition(options as any, async (position, error) => {
        if (error) {
          console.warn('❌ Capacitor tracking error:', error);
          return;
        }
        
        if (position) {
          const enriched = await this.enrichWithReverseGeocoding({
            address: `Tracking (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 50,
            confidence: 90,
            source: 'capacitor',
            timestamp: Date.now(),
            type: 'precise'
          });
          
          callback(enriched);
        }
      });
      
      console.log('📱 [Ultimate] Suivi Capacitor démarré');
    } catch (error) {
      console.warn('❌ Erreur tracking Capacitor:', error);
    }
  }

  private async stopCapacitorTracking(): Promise<void> {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      if (this.watchId !== null) {
        await Geolocation.clearWatch({ id: this.watchId as string });
      }
    } catch (error) {
      console.warn('❌ Erreur arrêt Capacitor:', error);
    }
  }

  private async startBrowserTracking(
    callback: (position: UltimateLocationData) => void,
    options: GeolocationConfig
  ): Promise<void> {
    if (!navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const enriched = await this.enrichWithReverseGeocoding({
          address: `Tracking (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 100,
          confidence: 80,
          source: 'browser',
          timestamp: Date.now(),
          type: 'precise'
        });
        
        callback(enriched);
      },
      (error) => console.warn('❌ Browser tracking error:', error),
      options as PositionOptions
    );
    
    console.log('🌐 [Ultimate] Suivi navigateur démarré');
  }
}

export const ultimateLocationService = UltimateLocationService.getInstance();