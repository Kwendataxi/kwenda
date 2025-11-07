/**
 * 📍 PHASE 4: Background Geolocation Service
 * Tracking GPS continu avec Capacitor Background Geolocation
 * Mise à jour toutes les 10 secondes même en arrière-plan
 */

import { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { registerPlugin } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy: number;
  timestamp: number;
}

class BackgroundGeolocationService {
  private watcherId: string | null = null;
  private isTracking = false;
  private userId: string | null = null;
  private lastUpdate: number = 0;
  private updateInterval = 10000; // 10 secondes

  /**
   * Démarrer le tracking GPS en arrière-plan
   */
  async startTracking(userId: string): Promise<boolean> {
    if (this.isTracking) {
      console.log('📍 Background tracking already active');
      return true;
    }

    this.userId = userId;

    try {
      // Demander les permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        console.error('❌ Background location permission denied');
        return false;
      }

      // Configurer et démarrer le watcher
      this.watcherId = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "Kwenda suit votre position",
          backgroundTitle: "📍 Tracking GPS actif",
          requestPermissions: true,
          stale: false,
          distanceFilter: 10 // Update tous les 10 mètres minimum
        },
        (location, error) => {
          if (error) {
            console.error('❌ Background geolocation error:', error);
            return;
          }

          if (location) {
            this.handleLocationUpdate({
              latitude: location.latitude,
              longitude: location.longitude,
              heading: location.bearing || undefined,
              speed: location.speed || undefined,
              accuracy: location.accuracy,
              timestamp: Date.now()
            });
          }
        }
      );

      this.isTracking = true;
      console.log('✅ Background geolocation started:', this.watcherId);
      return true;

    } catch (error) {
      console.error('❌ Failed to start background tracking:', error);
      return false;
    }
  }

  /**
   * Arrêter le tracking GPS
   */
  async stopTracking(): Promise<void> {
    if (!this.watcherId) {
      return;
    }

    try {
      await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
      this.watcherId = null;
      this.isTracking = false;
      this.userId = null;
      console.log('⏹️ Background tracking stopped');
    } catch (error) {
      console.error('❌ Failed to stop background tracking:', error);
    }
  }

  /**
   * Gérer les mises à jour de position
   */
  private async handleLocationUpdate(location: LocationUpdate): Promise<void> {
    if (!this.userId) return;

    // Throttle: ne pas envoyer plus d'une fois par 10 secondes
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      return;
    }

    this.lastUpdate = now;

    try {
      // Mise à jour driver_locations en temps réel
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: this.userId,
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading || null,
          speed: location.speed || null,
          accuracy: location.accuracy,
          is_online: true,
          last_ping: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Failed to update driver location:', error);
        // Stocker en local pour sync ultérieur si offline
        this.storeOfflineUpdate(location);
      } else {
        console.log('✅ Driver location updated:', {
          lat: location.latitude.toFixed(6),
          lng: location.longitude.toFixed(6),
          accuracy: Math.round(location.accuracy)
        });
      }
    } catch (error) {
      console.error('❌ Error updating location:', error);
      this.storeOfflineUpdate(location);
    }
  }

  /**
   * Stocker les mises à jour offline dans IndexedDB pour sync ultérieur
   */
  private async storeOfflineUpdate(location: LocationUpdate): Promise<void> {
    try {
      const dbName = 'kwenda_offline';
      const storeName = 'location_updates';

      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'timestamp' });
        }
      };

      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        store.add({
          ...location,
          userId: this.userId,
          synced: false
        });

        console.log('💾 Location stored offline for later sync');
      };
    } catch (error) {
      console.error('❌ Failed to store offline update:', error);
    }
  }

  /**
   * Synchroniser les mises à jour offline
   */
  async syncOfflineUpdates(): Promise<void> {
    if (!this.userId) return;

    try {
      const dbName = 'kwenda_offline';
      const storeName = 'location_updates';

      const request = indexedDB.open(dbName, 1);

      request.onsuccess = async (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = async () => {
          const updates = getAllRequest.result;
          
          for (const update of updates) {
            if (!update.synced) {
              const { error } = await supabase
                .from('driver_locations')
                .upsert({
                  driver_id: update.userId,
                  latitude: update.latitude,
                  longitude: update.longitude,
                  heading: update.heading || null,
                  speed: update.speed || null,
                  accuracy: update.accuracy,
                  is_online: true,
                  last_ping: new Date(update.timestamp).toISOString()
                });

              if (!error) {
                // Marquer comme synchronisé
                store.delete(update.timestamp);
              }
            }
          }

          console.log('✅ Offline updates synced');
        };
      };
    } catch (error) {
      console.error('❌ Failed to sync offline updates:', error);
    }
  }

  /**
   * Vérifier les permissions
   */
  private async checkPermissions(): Promise<boolean> {
    try {
      // Demander permission de géolocalisation
      const result = await BackgroundGeolocation.openSettings();
      return true;
    } catch (error) {
      console.error('❌ Permission check failed:', error);
      return false;
    }
  }

  /**
   * Obtenir l'état actuel du tracking
   */
  getTrackingStatus(): { isTracking: boolean; watcherId: string | null } {
    return {
      isTracking: this.isTracking,
      watcherId: this.watcherId
    };
  }
}

// Export singleton
export const backgroundGeolocationService = new BackgroundGeolocationService();
