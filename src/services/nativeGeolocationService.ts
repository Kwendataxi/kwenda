/**
 * 📱 SERVICE DE GÉOLOCALISATION NATIF UNIFIÉ
 * 
 * Gère GPS nativement sur Android/iOS via Capacitor
 * Fallback automatique sur navigator.geolocation pour le web
 * 
 * ✅ FIX: Résout le problème GPS Android qui ne fonctionnait pas
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';

export interface NativeLocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  source: 'capacitor' | 'browser' | 'fallback';
}

export interface NativeGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

class NativeGeolocationService {
  private isNative: boolean;
  private permissionGranted: boolean = false;
  private lastKnownPosition: NativeLocationData | null = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    console.log(`📍 NativeGeolocationService: ${this.isNative ? 'Mode Capacitor (Android/iOS)' : 'Mode Browser'}`);
  }

  /**
   * 🔐 Vérifie et demande les permissions GPS
   */
  async checkPermissions(): Promise<PermissionStatus> {
    if (!this.isNative) {
      // Sur le web, on simule une permission granted
      return { location: 'granted', coarseLocation: 'granted' } as PermissionStatus;
    }

    try {
      const status = await Geolocation.checkPermissions();
      console.log('📍 Status permissions GPS:', status);
      return status;
    } catch (error) {
      console.error('❌ Erreur check permissions:', error);
      return { location: 'denied', coarseLocation: 'denied' } as PermissionStatus;
    }
  }

  /**
   * 🔓 Demande les permissions GPS (Android/iOS)
   */
  async requestPermissions(): Promise<boolean> {
    if (!this.isNative) {
      // Sur le web, la permission est demandée automatiquement par getCurrentPosition
      this.permissionGranted = true;
      return true;
    }

    try {
      console.log('📍 Demande de permissions GPS natives...');
      const result = await Geolocation.requestPermissions();
      this.permissionGranted = result.location === 'granted';
      console.log('📍 Permissions GPS:', result.location);
      return this.permissionGranted;
    } catch (error) {
      console.error('❌ Erreur demande permissions:', error);
      return false;
    }
  }

  /**
   * 🔒 S'assure que les permissions sont accordées avant de continuer
   */
  async ensurePermissions(): Promise<boolean> {
    const status = await this.checkPermissions();
    
    if (status.location === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (status.location === 'prompt' || status.location === 'prompt-with-rationale') {
      return await this.requestPermissions();
    }

    // Permission refusée
    console.warn('⚠️ Permissions GPS refusées');
    return false;
  }

  /**
   * 📍 Obtenir la position actuelle (méthode principale)
   */
  async getCurrentPosition(options: NativeGeolocationOptions = {}): Promise<NativeLocationData> {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 5000
    } = options;

    console.log(`📍 getCurrentPosition - Native: ${this.isNative}, Options:`, options);

    // S'assurer que les permissions sont OK
    const hasPermission = await this.ensurePermissions();
    if (!hasPermission) {
      throw new Error('Permissions GPS refusées. Activez la localisation dans les paramètres.');
    }

    if (this.isNative) {
      return this.getCapacitorPosition({ enableHighAccuracy, timeout, maximumAge });
    } else {
      return this.getBrowserPosition({ enableHighAccuracy, timeout, maximumAge });
    }
  }

  /**
   * 📱 Position via Capacitor (Android/iOS natif)
   */
  private async getCapacitorPosition(options: NativeGeolocationOptions): Promise<NativeLocationData> {
    const { enableHighAccuracy = true, timeout = 10000, maximumAge = 5000 } = options;

    try {
      console.log('📱 Demande position GPS Capacitor...');
      
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge
      });

      const locationData: NativeLocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        source: 'capacitor'
      };

      console.log(`✅ Position Capacitor obtenue: ${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)} (±${Math.round(locationData.accuracy)}m)`);
      
      this.lastKnownPosition = locationData;
      return locationData;

    } catch (error: any) {
      console.error('❌ Erreur GPS Capacitor:', error);
      
      // Message d'erreur détaillé selon le code
      let errorMessage = 'Erreur GPS native';
      if (error.code === 1 || error.message?.includes('denied')) {
        errorMessage = 'Permission GPS refusée. Activez dans Paramètres > Applications > Kwenda > Permissions > Localisation';
      } else if (error.code === 2 || error.message?.includes('unavailable')) {
        errorMessage = 'GPS indisponible. Activez votre localisation et déplacez-vous vers un espace dégagé.';
      } else if (error.code === 3 || error.message?.includes('timeout')) {
        errorMessage = `GPS trop lent (>${timeout/1000}s). Vérifiez votre signal.`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * 🌐 Position via Navigator.geolocation (Web)
   */
  private async getBrowserPosition(options: NativeGeolocationOptions): Promise<NativeLocationData> {
    const { enableHighAccuracy = true, timeout = 10000, maximumAge = 5000 } = options;

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée par votre navigateur'));
        return;
      }

      console.log('🌐 Demande position GPS Browser...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: NativeLocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            source: 'browser'
          };

          console.log(`✅ Position Browser obtenue: ${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)} (±${Math.round(locationData.accuracy)}m)`);
          
          this.lastKnownPosition = locationData;
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Erreur GPS';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission GPS refusée. Autorisez la localisation dans votre navigateur.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position GPS indisponible. Vérifiez votre connexion.';
              break;
            case error.TIMEOUT:
              errorMessage = `GPS trop lent (>${timeout/1000}s). Réessayez.`;
              break;
          }
          console.error('❌ Erreur GPS Browser:', errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );
    });
  }

  /**
   * 👀 Démarrer le suivi continu de position
   */
  async watchPosition(
    callback: (position: NativeLocationData) => void,
    errorCallback?: (error: Error) => void,
    options: NativeGeolocationOptions = {}
  ): Promise<string> {
    const { enableHighAccuracy = true, timeout = 10000, maximumAge = 0 } = options;

    const hasPermission = await this.ensurePermissions();
    if (!hasPermission) {
      errorCallback?.(new Error('Permissions GPS refusées'));
      return '';
    }

    if (this.isNative) {
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy, timeout, maximumAge },
        (position, err) => {
          if (err) {
            console.error('❌ Watch error:', err);
            errorCallback?.(new Error(err.message || 'Erreur GPS'));
            return;
          }

          if (position) {
            const locationData: NativeLocationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              source: 'capacitor'
            };
            this.lastKnownPosition = locationData;
            callback(locationData);
          }
        }
      );
      return watchId;
    } else {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: NativeLocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            source: 'browser'
          };
          this.lastKnownPosition = locationData;
          callback(locationData);
        },
        (error) => {
          errorCallback?.(new Error(error.message));
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
      return String(watchId);
    }
  }

  /**
   * ⏹️ Arrêter le suivi de position
   */
  async clearWatch(watchId: string): Promise<void> {
    if (this.isNative) {
      await Geolocation.clearWatch({ id: watchId });
    } else {
      navigator.geolocation.clearWatch(Number(watchId));
    }
  }

  /**
   * 📍 Retourne la dernière position connue (sans nouvelle requête GPS)
   */
  getLastKnownPosition(): NativeLocationData | null {
    return this.lastKnownPosition;
  }

  /**
   * 🔍 Vérifie si on est sur une plateforme native
   */
  isNativePlatform(): boolean {
    return this.isNative;
  }
}

// Export singleton
export const nativeGeolocationService = new NativeGeolocationService();
