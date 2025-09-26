/**
 * 🎯 SERVICE DE GÉOLOCALISATION RÉELLE AVEC GOOGLE MAPS
 * 
 * Transforme les coordonnées brutes en adresses Google Maps réelles
 * Optimisé avec cache et fallbacks pour Kwenda
 */

import { GoogleMapsService } from './googleMapsService';
import type { 
  RealDriverLocation, 
  RealLocationUpdate, 
  GoogleGeocodeResult, 
  RealLocationConfig,
  GoogleAddressCache,
  RealLocationError
} from '@/types/realLocation';
import { DEFAULT_REAL_LOCATION_CONFIG } from '@/types/realLocation';
import type { LocationData } from '@/types/location';

export class RealLocationService {
  private googleMapsService = new GoogleMapsService();
  private config: RealLocationConfig = DEFAULT_REAL_LOCATION_CONFIG;
  private addressCache = new Map<string, GoogleAddressCache>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  constructor(config?: Partial<RealLocationConfig>) {
    if (config) {
      this.config = { ...DEFAULT_REAL_LOCATION_CONFIG, ...config };
    }
  }

  /**
   * Met à jour la position d'un chauffeur avec adresse Google réelle
   */
  async updateDriverLocation(
    driverId: string,
    update: RealLocationUpdate
  ): Promise<RealDriverLocation> {
    try {
      // Géocoder les coordonnées vers une adresse Google réelle
      const geocodeResult = await this.geocodeCoordinates(
        update.coordinates.lat,
        update.coordinates.lng
      );

      const realLocation: RealDriverLocation = {
        driverId,
        coordinates: update.coordinates,
        googleAddress: geocodeResult.address,
        googlePlaceName: geocodeResult.placeName,
        googlePlaceId: geocodeResult.placeId,
        movement: update.movement,
        lastUpdate: update.timestamp,
        status: {
          isOnline: true,
          isAvailable: true,
          isVerified: true, // TODO: récupérer depuis la base
        },
        cache: {
          lastGeocodedAt: new Date().toISOString(),
          geocodeSource: geocodeResult.source,
        },
      };

      return realLocation;
    } catch (error) {
      console.error('RealLocationService: Error updating driver location:', error);
      throw this.createLocationError('GOOGLE_API_ERROR', 'Failed to update driver location', error);
    }
  }

  /**
   * Géocode des coordonnées en adresse Google Maps réelle
   */
  private async geocodeCoordinates(lat: number, lng: number): Promise<GoogleGeocodeResult> {
    const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    
    // Vérifier le cache d'abord
    const cached = this.getCachedAddress(coordKey);
    if (cached) {
      return {
        address: cached.address,
        placeName: cached.placeName,
        placeId: cached.placeId,
        accuracy: 'high',
        source: 'cache',
      };
    }

    try {
      // Utiliser le service Google Maps pour géocoder
      const address = await GoogleMapsService.reverseGeocode(lng, lat);
      
      const result: GoogleGeocodeResult = {
        address,
        accuracy: 'high',
        source: 'google',
      };

      // Mettre en cache
      this.cacheAddress(coordKey, result);
      
      return result;
    } catch (error) {
      console.warn('RealLocationService: Google geocoding failed, using fallback:', error);
      
      if (this.config.fallbackEnabled) {
        return this.getFallbackAddress(lat, lng);
      }
      
      throw error;
    }
  }

  /**
   * Récupère une adresse depuis le cache
   */
  private getCachedAddress(coordKey: string): GoogleAddressCache | null {
    const cached = this.addressCache.get(coordKey);
    if (!cached) return null;

    const now = new Date();
    const expiresAt = new Date(cached.expiresAt);
    
    if (now > expiresAt) {
      this.addressCache.delete(coordKey);
      return null;
    }

    return cached;
  }

  /**
   * Met en cache une adresse géocodée
   */
  private cacheAddress(coordKey: string, result: GoogleGeocodeResult): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.googleCacheTTL * 60 * 1000);

    const cacheEntry: GoogleAddressCache = {
      coordinates: coordKey,
      address: result.address,
      placeName: result.placeName,
      placeId: result.placeId,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.addressCache.set(coordKey, cacheEntry);
  }

  /**
   * Fallback si Google Maps indisponible
   */
  private getFallbackAddress(lat: number, lng: number): GoogleGeocodeResult {
    // Fallback simple basé sur les coordonnées connues de Kinshasa
    let fallbackAddress = 'Position inconnue, Kinshasa';
    
    // Zones approximatives de Kinshasa
    if (lat >= -4.2 && lat <= -4.1 && lng >= 15.2 && lng <= 15.4) {
      fallbackAddress = 'Centre-ville, Kinshasa, RDC';
    } else if (lat >= -4.5 && lat <= -4.2 && lng >= 15.1 && lng <= 15.5) {
      fallbackAddress = 'Kinshasa, République Démocratique du Congo';
    }

    return {
      address: fallbackAddress,
      accuracy: 'low',
      source: 'fallback',
    };
  }

  /**
   * Nettoie le cache expiré
   */
  clearExpiredCache(): void {
    const now = new Date();
    
    for (const [key, cached] of this.addressCache.entries()) {
      const expiresAt = new Date(cached.expiresAt);
      if (now > expiresAt) {
        this.addressCache.delete(key);
      }
    }
  }

  /**
   * Crée une erreur de géolocalisation typée
   */
  private createLocationError(
    code: RealLocationError['code'],
    message: string,
    details?: any
  ): RealLocationError {
    return {
      code,
      message,
      details,
      fallbackUsed: this.config.fallbackEnabled,
    };
  }

  /**
   * Statistiques du cache
   */
  getCacheStats() {
    return {
      size: this.addressCache.size,
      config: this.config,
    };
  }
}

/**
 * 🎯 ADAPTATEUR POUR MIGRATION LEGACY → REAL LOCATION
 */
export class DriverLocationAdapterImpl {
  private realLocationService = new RealLocationService();

  /**
   * Convertit l'ancien format DriverLocation vers RealDriverLocation
   */
  async fromLegacy(legacy: any): Promise<RealDriverLocation> {
    const lat = legacy.latitude || legacy.lat || 0;
    const lng = legacy.longitude || legacy.lng || 0;

    const update: RealLocationUpdate = {
      coordinates: { lat, lng },
      movement: {
        speed: legacy.speed,
        heading: legacy.heading,
        accuracy: legacy.accuracy,
      },
      timestamp: legacy.updated_at || legacy.lastUpdate || new Date().toISOString(),
    };

    return this.realLocationService.updateDriverLocation(
      legacy.driver_id || legacy.driverId || 'unknown',
      update
    );
  }

  /**
   * Convertit RealDriverLocation vers format legacy pour compatibilité
   */
  toLegacy(real: RealDriverLocation): any {
    return {
      driver_id: real.driverId,
      latitude: real.coordinates.lat,
      longitude: real.coordinates.lng,
      lat: real.coordinates.lat,
      lng: real.coordinates.lng,
      speed: real.movement?.speed,
      heading: real.movement?.heading,
      accuracy: real.movement?.accuracy,
      updated_at: real.lastUpdate,
      lastUpdate: real.lastUpdate,
      google_address: real.googleAddress,
      google_place_name: real.googlePlaceName,
      is_online: real.status.isOnline,
      is_available: real.status.isAvailable,
    };
  }

  /**
   * Convertit vers LocationData pour compatibilité avec autres composants
   */
  toLocationData(real: RealDriverLocation): LocationData {
    return {
      address: real.googleAddress,
      lat: real.coordinates.lat,
      lng: real.coordinates.lng,
      type: 'gps',
      placeId: real.googlePlaceId,
      name: real.googlePlaceName,
      subtitle: `Mis à jour: ${new Date(real.lastUpdate).toLocaleTimeString('fr-FR')}`,
      accuracy: real.movement?.accuracy,
    };
  }
}

// Instance globale du service
export const realLocationService = new RealLocationService();
export const driverLocationAdapter = new DriverLocationAdapterImpl();