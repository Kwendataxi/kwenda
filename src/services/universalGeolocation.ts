/**
 * 🌍 SERVICE DE GÉOLOCALISATION UNIVERSELLE
 * Détection automatique de ville et recherche contextuelle
 */

import { supabase } from '@/integrations/supabase/client';
import { IPGeolocationService } from './ipGeolocation';

export interface CityConfig {
  name: string;
  code: string;
  countryCode: string;
  coordinates: { lat: number; lng: number };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  communes?: string[];
  timezone: string;
  currency: string;
}

// Configuration des villes supportées - RDC uniquement
export const SUPPORTED_CITIES: Record<string, CityConfig> = {
  kinshasa: {
    name: 'Kinshasa',
    code: 'KIN',
    countryCode: 'CD',
    coordinates: { lat: -4.3217, lng: 15.3069 },
    bounds: {
      north: -4.0,
      south: -4.8,
      east: 15.8,
      west: 14.8
    },
    communes: ['Gombe', 'Kalamu', 'Kasa-Vubu', 'Kinshasa', 'Kintambo', 'Lemba', 'Limete', 'Lingwala', 'Makala', 'Maluku', 'Masina', 'Matete', 'Mont-Ngafula', 'Ndjili', 'Ngaba', 'Ngiri-Ngiri', 'Barumbu', 'Bumbu', 'Bandalungwa', 'Kimbanseke', 'Kisenso', 'Nsele', 'Selembao', 'Mont-Amba'],
    timezone: 'Africa/Kinshasa',
    currency: 'CDF'
  },
  lubumbashi: {
    name: 'Lubumbashi',
    code: 'LBV',
    countryCode: 'CD',
    coordinates: { lat: -11.6792, lng: 27.4748 },
    bounds: {
      north: -11.4,
      south: -11.9,
      east: 27.8,
      west: 27.1
    },
    communes: ['Kampemba', 'Katuba', 'Kenya', 'Lubumbashi', 'Rwashi'],
    timezone: 'Africa/Lubumbashi',
    currency: 'CDF'
  },
  kolwezi: {
    name: 'Kolwezi',
    code: 'KWZ',
    countryCode: 'CD',
    coordinates: { lat: -10.7147, lng: 25.4764 },
    bounds: {
      north: -10.5,
      south: -10.9,
      east: 25.8,
      west: 25.1
    },
    communes: ['Kolwezi', 'Manika', 'Mutoshi'],
    timezone: 'Africa/Lubumbashi',
    currency: 'CDF'
  }
};

export class UniversalGeolocationService {
  private static instance: UniversalGeolocationService;
  private currentCity: CityConfig | null = null;
  private cityDetectionCache: { city: CityConfig; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (optimisé de 30min)

  static getInstance(): UniversalGeolocationService {
    if (!this.instance) {
      this.instance = new UniversalGeolocationService();
    }
    return this.instance;
  }

  /**
   * 🎯 Détecter automatiquement la ville de l'utilisateur avec détection RÉELLE
   */
  async detectUserCity(coordinates?: { lat: number; lng: number }): Promise<CityConfig> {
    console.log('🎯 Détection ville commencée...', coordinates);
    
    // Forcer une nouvelle détection si pas de cache ou coordonnées fournies
    const forceRefresh = coordinates || !this.cityDetectionCache || 
                        Date.now() - this.cityDetectionCache.timestamp > this.CACHE_DURATION;
    
    if (!forceRefresh && this.cityDetectionCache) {
      console.log('📱 Utilisation cache ville:', this.cityDetectionCache.city.name);
      this.currentCity = this.cityDetectionCache.city;
      return this.currentCity;
    }

    try {
      let userCoordinates = coordinates;

      // Si pas de coordonnées fournies, essayer de les obtenir ACTIVEMENT
      if (!userCoordinates) {
        console.log('🔍 Tentative GPS...');
        try {
          // Essayer GPS avec timeout réduit pour plus de réactivité
          const position = await this.getCurrentPositionPromise();
          userCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('✅ GPS réussi:', userCoordinates);
        } catch (gpsError) {
          console.log('❌ GPS échoué, tentative IP...', gpsError);
          // Fallback sur IP avec détection active
          try {
            const ipLocation = await IPGeolocationService.getInstance().getCurrentLocation();
            userCoordinates = {
              lat: ipLocation.latitude,
              lng: ipLocation.longitude
            };
            console.log('✅ IP réussi:', userCoordinates);
          } catch (ipError) {
            console.log('❌ IP échoué, utilisation Kinshasa par défaut', ipError);
            // Forcer le fallback sur Kinshasa mais PAS de cache permanent
            this.currentCity = SUPPORTED_CITIES.kinshasa;
            // Cache court pour permettre de nouvelles tentatives
            this.cityDetectionCache = {
              city: this.currentCity,
              timestamp: Date.now() - (this.CACHE_DURATION * 0.5) // Cache de 15min seulement
            };
            return this.currentCity;
          }
        }
      }

      // Déterminer la ville RÉELLE la plus proche
      const detectedCity = this.findNearestSupportedCity(userCoordinates);
      this.currentCity = detectedCity;
      this.cacheDetection(detectedCity);

      console.log(`🌍 Ville RÉELLEMENT détectée: ${detectedCity.name} (${detectedCity.code})`, userCoordinates);
      return detectedCity;

    } catch (error) {
      console.error('❌ Erreur détection ville complète:', error);
      // Fallback temporaire sur Kinshasa
      this.currentCity = SUPPORTED_CITIES.kinshasa;
      // Cache court pour permettre de nouvelles tentatives rapides
      this.cityDetectionCache = {
        city: this.currentCity,
        timestamp: Date.now() - (this.CACHE_DURATION * 0.7) // Cache de 9min pour retry plus rapide
      };
      return this.currentCity;
    }
  }

  /**
   * 🎯 Trouver la ville supportée la plus proche avec logs détaillés
   */
  private findNearestSupportedCity(coordinates: { lat: number; lng: number }): CityConfig {
    let nearestCity = SUPPORTED_CITIES.kinshasa;
    let minDistance = Infinity;
    
    console.log('🔍 Recherche ville la plus proche pour:', coordinates);

    for (const [cityKey, city] of Object.entries(SUPPORTED_CITIES)) {
      // Vérifier si dans les limites de la ville d'abord
      const withinBounds = this.isWithinCityBounds(coordinates, city);
      
      if (withinBounds) {
        console.log(`✅ Position dans les limites de ${city.name}!`);
        return city;
      }

      // Calculer la distance sinon
      const distance = this.calculateDistance(coordinates, city.coordinates);
      console.log(`📍 Distance vers ${city.name}: ${distance.toFixed(2)}km`);

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    console.log(`🎯 Ville la plus proche: ${nearestCity.name} (${minDistance.toFixed(2)}km)`);
    return nearestCity;
  }

  /**
   * 🎯 Vérifier si les coordonnées sont dans les limites d'une ville (méthode publique)
   */
  isWithinCityBounds(coordinates: { lat: number; lng: number }, city: CityConfig): boolean {
    const { lat, lng } = coordinates;
    const { bounds } = city;

    return lat <= bounds.north && 
           lat >= bounds.south && 
           lng <= bounds.east && 
           lng >= bounds.west;
  }

  /**
   * 🎯 Calculer la distance entre deux points (formule Haversine)
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * 🎯 Obtenir la position GPS native
   */
  private getCurrentPositionPromise(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 3000, // Réduit de 8s à 3s
          maximumAge: 30000 // Cache 30s (au lieu de 5min)
        }
      );
    });
  }

  /**
   * 🎯 Mettre en cache la détection de ville
   */
  private cacheDetection(city: CityConfig): void {
    this.cityDetectionCache = {
      city,
      timestamp: Date.now()
    };
  }

  /**
   * 🎯 Obtenir la ville actuelle (détectée ou par défaut)
   */
  getCurrentCity(): CityConfig {
    return this.currentCity || SUPPORTED_CITIES.kinshasa;
  }

  /**
   * 🎯 Changer manuellement de ville
   */
  setCity(cityCode: string): CityConfig {
    const city = SUPPORTED_CITIES[cityCode.toLowerCase()];
    if (city) {
      this.currentCity = city;
      this.cacheDetection(city);
      return city;
    }
    return this.getCurrentCity();
  }

  /**
   * 🎯 Rechercher dans la base de données selon la ville détectée
   */
  async searchInCurrentCity(
    query: string,
    maxResults: number = 8
  ): Promise<any[]> {
    const currentCity = this.getCurrentCity();
    
    try {
      const { data, error } = await supabase.rpc('intelligent_places_search', {
        search_query: query,
        search_city: currentCity.name,
        max_results: maxResults,
        user_latitude: currentCity.coordinates.lat,
        user_longitude: currentCity.coordinates.lng
      });

      if (error) {
        console.error('Erreur recherche base de données:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur recherche:', error);
      return [];
    }
  }

  /**
   * 🎯 Obtenir les lieux populaires de la ville actuelle
   */
  async getPopularPlacesForCurrentCity(): Promise<any[]> {
    const currentCity = this.getCurrentCity();
    
    try {
      const { data, error } = await supabase.rpc('intelligent_places_search', {
        search_query: '',
        search_city: currentCity.name,
        max_results: 10,
        user_latitude: currentCity.coordinates.lat,
        user_longitude: currentCity.coordinates.lng
      });

      if (error) {
        console.error('Erreur lieux populaires:', error);
        return this.getFallbackPopularPlaces(currentCity);
      }

      return data || this.getFallbackPopularPlaces(currentCity);
    } catch (error) {
      console.error('Erreur lieux populaires:', error);
      return this.getFallbackPopularPlaces(currentCity);
    }
  }

  /**
   * 🎯 Lieux populaires de fallback par ville (RDC uniquement)
   */
  private getFallbackPopularPlaces(city: CityConfig): any[] {
    const fallbacks: Record<string, any[]> = {
      kinshasa: [
        { name: 'Centre-ville', commune: 'Gombe', lat: -4.3217, lng: 15.3069 },
        { name: 'Aéroport de Ndjili', commune: 'Ndjili', lat: -4.3856, lng: 15.4446 },
        { name: 'Université de Kinshasa', commune: 'Lemba', lat: -4.4325, lng: 15.2796 }
      ],
      lubumbashi: [
        { name: 'Centre-ville', commune: 'Lubumbashi', lat: -11.6792, lng: 27.4748 },
        { name: 'Aéroport de Luano', commune: 'Lubumbashi', lat: -11.5913, lng: 27.5309 },
        { name: 'Université de Lubumbashi', commune: 'Lubumbashi', lat: -11.6556, lng: 27.4539 }
      ],
      kolwezi: [
        { name: 'Centre-ville', commune: 'Kolwezi', lat: -10.7147, lng: 25.4764 },
        { name: 'Aéroport de Kolwezi', commune: 'Kolwezi', lat: -10.7689, lng: 25.5067 }
      ]
    };

    return fallbacks[city.code.toLowerCase()] || fallbacks.kinshasa;
  }

  /**
   * 🎯 Vider le cache
   */
  clearCache(): void {
    this.cityDetectionCache = null;
    this.currentCity = null;
  }

  /**
   * 🎯 Obtenir toutes les villes supportées
   */
  getSupportedCities(): CityConfig[] {
    return Object.values(SUPPORTED_CITIES);
  }
}

// Instance singleton
export const universalGeolocation = UniversalGeolocationService.getInstance();