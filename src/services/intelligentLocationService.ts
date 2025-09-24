/**
 * 🎯 SERVICE DE GÉOLOCALISATION INTELLIGENT
 * 
 * Service unifié combinant GPS natif + Google Places API + IA
 * Remplace tous les anciens services pour une solution robuste
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

class IntelligentLocationService {
  private currentCity = 'Kinshasa';
  private watchId: number | null = null;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Lieux populaires par ville avec plus de données
  private cityData = {
    kinshasa: [
      {
        id: 'kinshasa-airport',
        name: 'Aéroport International de N\'djili',
        address: 'Aéroport International de N\'djili, Kinshasa, RDC',
        lat: -4.3857,
        lng: 15.4444,
        type: 'popular' as const,
        isPopular: true,
        title: 'Aéroport N\'djili',
        subtitle: 'Transport international'
      },
      {
        id: 'kinshasa-center',
        name: 'Centre-ville de Kinshasa',
        address: 'Gombe, Kinshasa, République Démocratique du Congo',
        lat: -4.3217,
        lng: 15.3069,
        type: 'popular' as const,
        isPopular: true,
        title: 'Centre-ville Gombe',
        subtitle: 'Quartier des affaires'
      },
      {
        id: 'kinshasa-unikin',
        name: 'Université de Kinshasa',
        address: 'Mont-Amba, Kinshasa, République Démocratique du Congo',
        lat: -4.4324,
        lng: 15.2973,
        type: 'popular' as const,
        isPopular: true,
        title: 'UNIKIN',
        subtitle: 'Université principale'
      },
      {
        id: 'kinshasa-marche-central',
        name: 'Marché Central',
        address: 'Marché Central, Kinshasa, RDC',
        lat: -4.3276,
        lng: 15.3086,
        type: 'popular' as const,
        isPopular: true,
        title: 'Marché Central',
        subtitle: 'Commerce principal'
      },
      {
        id: 'kinshasa-hopital-general',
        name: 'Hôpital Général de Kinshasa',
        address: 'Hôpital Général, Lingwala, Kinshasa, RDC',
        lat: -4.3398,
        lng: 15.2943,
        type: 'popular' as const,
        isPopular: true,
        title: 'Hôpital Général',
        subtitle: 'Centre de santé'
      },
      {
        id: 'kinshasa-stade-martyrs',
        name: 'Stade des Martyrs',
        address: 'Stade des Martyrs, Kalamu, Kinshasa, RDC',
        lat: -4.3789,
        lng: 15.3134,
        type: 'popular' as const,
        isPopular: true,
        title: 'Stade des Martyrs',
        subtitle: 'Complexe sportif'
      }
    ],
    lubumbashi: [
      {
        id: 'lubumbashi-airport',
        name: 'Aéroport International de Lubumbashi',
        address: 'Aéroport de Lubumbashi, Lubumbashi, RDC',
        lat: -11.5914,
        lng: 27.5309,
        type: 'popular' as const,
        isPopular: true,
        title: 'Aéroport Lubumbashi',
        subtitle: 'Transport aérien'
      },
      {
        id: 'lubumbashi-center',
        name: 'Centre-ville de Lubumbashi',
        address: 'Centre-ville, Lubumbashi, RDC',
        lat: -11.6559,
        lng: 27.4794,
        type: 'popular' as const,
        isPopular: true,
        title: 'Centre-ville',
        subtitle: 'Quartier central'
      }
    ]
  };

  /**
   * 🎯 GÉOLOCALISATION GPS PRÉCISE
   */
  async getCurrentPosition(options?: GeolocationOptions): Promise<LocationData> {
    const cacheKey = 'current-position';
    const cached = this.getFromCache(cacheKey);
    
    if (cached && options?.maximumAge && Date.now() - cached.timestamp < options.maximumAge) {
      return cached.data;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée sur cet appareil'));
        return;
      }

      const opts: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 15000,
        maximumAge: options?.maximumAge ?? 60000
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Essayer le géocodage inverse pour obtenir une adresse
            const address = await this.reverseGeocode(
              position.coords.latitude,
              position.coords.longitude
            );

            const locationData: LocationData = {
              address: address || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              type: 'gps',
              accuracy: position.coords.accuracy
            };

            this.setCache(cacheKey, locationData);
            resolve(locationData);
          } catch (error) {
            // Fallback sans géocodage inverse
            const locationData: LocationData = {
              address: `Position GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              type: 'gps',
              accuracy: position.coords.accuracy
            };
            resolve(locationData);
          }
        },
        async (error) => {
          console.error('Erreur GPS:', error);
          
          // Système de fallback intelligent
          if (options?.fallbackToIP !== false) {
            try {
              const ipLocation = await this.getIPLocation();
              resolve(ipLocation);
              return;
            } catch (ipError) {
              console.error('Fallback IP failed:', ipError);
            }
          }

          if (options?.fallbackToDefault !== false) {
            const defaultPosition = this.getDefaultLocation();
            resolve(defaultPosition);
          } else {
            reject(new Error(`Erreur géolocalisation: ${error.message}`));
          }
        },
        opts
      );
    });
  }

  /**
   * 🔍 RECHERCHE INTELLIGENTE DE LIEUX
   */
  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    if (!query || query.length < 2) {
      return this.getPopularPlaces();
    }

    const cacheKey = `search-${query.toLowerCase()}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached.data;
    }

    try {
      // 1. Recherche dans les lieux populaires locaux
      const localResults = this.searchInPopularPlaces(query);

      // 2. Recherche via Google Places API si disponible
      let googleResults: LocationSearchResult[] = [];
      try {
        googleResults = await this.searchWithGooglePlaces(query);
      } catch (error) {
        console.warn('Google Places non disponible:', error);
      }

      // 3. Combiner et optimiser les résultats
      const combinedResults = this.mergeSearchResults(localResults, googleResults);
      
      this.setCache(cacheKey, combinedResults);
      return combinedResults;

    } catch (error) {
      console.error('Erreur recherche:', error);
      return this.getPopularPlaces();
    }
  }

  /**
   * 🌐 RECHERCHE VIA GOOGLE PLACES API
   */
  private async searchWithGooglePlaces(query: string): Promise<LocationSearchResult[]> {
    const response = await fetch('/api/supabase/functions/v1/places-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query,
        // Biais géographique selon la ville actuelle
        ...(this.currentCity === 'Kinshasa' && {
          lat: -4.3217,
          lng: 15.3069,
          radius: 50000
        })
      })
    });

    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results?.map((place: any, index: number) => ({
      id: `google-${index}`,
      name: place.name,
      address: place.formatted_address || place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      type: 'geocoded' as const,
      placeId: place.place_id,
      title: place.name,
      subtitle: place.formatted_address?.split(',')[1]?.trim() || this.currentCity
    })) || [];
  }

  /**
   * 🏆 RECHERCHE DANS LES LIEUX POPULAIRES
   */
  private searchInPopularPlaces(query: string): LocationSearchResult[] {
    const cityPlaces = this.cityData[this.currentCity.toLowerCase() as keyof typeof this.cityData] || this.cityData.kinshasa;
    
    return cityPlaces.filter(place =>
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.address.toLowerCase().includes(query.toLowerCase()) ||
      place.title.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * 🔄 GÉOCODAGE INVERSE
   */
  private async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch('/api/supabase/functions/v1/geocode-reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });

      if (response.ok) {
        const data = await response.json();
        return data.address;
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }
    return null;
  }

  /**
   * 🌍 GÉOLOCALISATION PAR IP
   */
  private async getIPLocation(): Promise<LocationData> {
    const response = await fetch('/api/supabase/functions/v1/ip-geolocation');
    const data = await response.json();
    
    return {
      address: `${data.city}, ${data.country}`,
      lat: data.latitude,
      lng: data.longitude,
      type: 'ip',
      name: data.city
    };
  }

  /**
   * 📍 POSITION PAR DÉFAUT
   */
  private getDefaultLocation(): LocationData {
    const defaults = {
      kinshasa: { lat: -4.3217, lng: 15.3069, address: 'Kinshasa Centre, RDC' },
      lubumbashi: { lat: -11.6559, lng: 27.4794, address: 'Lubumbashi Centre, RDC' },
      kolwezi: { lat: -10.7158, lng: 25.4734, address: 'Kolwezi Centre, RDC' }
    };

    const cityKey = this.currentCity.toLowerCase() as keyof typeof defaults;
    const defaultData = defaults[cityKey] || defaults.kinshasa;

    return {
      ...defaultData,
      type: 'default'
    };
  }

  /**
   * 🔀 FUSION DES RÉSULTATS
   */
  private mergeSearchResults(local: LocationSearchResult[], google: LocationSearchResult[]): LocationSearchResult[] {
    const combined = [...local];
    
    // Ajouter les résultats Google qui ne sont pas déjà présents
    google.forEach(googleResult => {
      const isDuplicate = combined.some(localResult => 
        this.calculateDistance(localResult, googleResult) < 100 // Moins de 100m
      );
      
      if (!isDuplicate) {
        combined.push(googleResult);
      }
    });

    // Trier par pertinence (populaires d'abord, puis par distance si position connue)
    return combined.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return 0;
    }).slice(0, 8); // Limiter à 8 résultats
  }

  /**
   * 🏢 OBTENIR LIEUX POPULAIRES
   */
  getPopularPlaces(): LocationSearchResult[] {
    const cityKey = this.currentCity.toLowerCase() as keyof typeof this.cityData;
    return [...(this.cityData[cityKey] || this.cityData.kinshasa)];
  }

  /**
   * 📏 CALCUL DE DISTANCE
   */
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

  /**
   * 🎯 SUIVI DE POSITION
   */
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
    const distanceFilter = options?.distanceFilter ?? 10;

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        // Filtre de distance pour économiser la batterie
        if (lastPosition && distanceFilter > 0) {
          const distance = this.calculateDistance(
            { lat: lastPosition.coords.latitude, lng: lastPosition.coords.longitude },
            { lat: position.coords.latitude, lng: position.coords.longitude }
          );
          
          if (distance < distanceFilter) {
            return;
          }
        }

        lastPosition = position;
        
        // Géocodage inverse occasionnel pour avoir une adresse lisible
        let address = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        try {
          const reversedAddress = await this.reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );
          if (reversedAddress) {
            address = reversedAddress;
          }
        } catch (error) {
          // Silencieux, utiliser les coordonnées
        }

        const locationData: LocationData = {
          address,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          type: 'gps',
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

  /**
   * 🏙️ GESTION DES VILLES
   */
  setCurrentCity(city: string): void {
    this.currentCity = city;
    this.cache.clear(); // Nettoyer le cache quand on change de ville
  }

  getCurrentCity(): string {
    return this.currentCity;
  }

  /**
   * 💾 GESTION DU CACHE
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getFromCache(key: string): { data: any; timestamp: number } | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 🧹 NETTOYAGE
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const intelligentLocationService = new IntelligentLocationService();