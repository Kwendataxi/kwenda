/**
 * 🗺️ CACHE INTELLIGENT GÉOLOCALISATION IP
 * Évite les appels répétés à ipinfo.io et autres services
 * Cache persistant avec TTL de 1 heure
 */

import { logger } from '@/utils/logger';

interface CachedIPLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  accuracy: number;
  provider: string;
  timestamp: number;
  expiresAt: number;
}

const CACHE_KEY = 'kwenda_ip_location_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 heure

export class IPGeolocationCache {
  /**
   * Récupère la position depuis le cache si valide
   */
  public static get(): CachedIPLocation | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data: CachedIPLocation = JSON.parse(cached);
      
      // Vérifier expiration
      if (Date.now() > data.expiresAt) {
        logger.info('📍 [IPCache] Cache expiré, suppression');
        this.clear();
        return null;
      }

      const ageMinutes = Math.round((Date.now() - data.timestamp) / 60000);
      logger.info(`📍 [IPCache] Position trouvée en cache (${ageMinutes}min)`, {
        city: data.city,
        provider: data.provider
      });

      return data;
    } catch (error) {
      logger.error('❌ [IPCache] Erreur lecture cache', error);
      this.clear();
      return null;
    }
  }

  /**
   * Sauvegarde la position en cache
   */
  public static set(location: Omit<CachedIPLocation, 'timestamp' | 'expiresAt'>): void {
    try {
      const cached: CachedIPLocation = {
        ...location,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_TTL
      };

      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
      
      logger.info('✅ [IPCache] Position mise en cache', {
        city: location.city,
        provider: location.provider,
        ttl: '1 heure'
      });
    } catch (error) {
      logger.error('❌ [IPCache] Erreur écriture cache', error);
    }
  }

  /**
   * Nettoie le cache
   */
  public static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      logger.info('🗑️ [IPCache] Cache nettoyé');
    } catch (error) {
      logger.error('❌ [IPCache] Erreur suppression cache', error);
    }
  }

  /**
   * Force un nouveau géocodage (ignore le cache)
   */
  public static async fetchFresh(): Promise<CachedIPLocation> {
    logger.info('🔄 [IPCache] Fetch forcé, ignorer le cache');
    this.clear();
    
    // Appeler ipinfo.io une seule fois
    try {
      const response = await fetch('https://ipinfo.io/json', {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) throw new Error(`IPInfo HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data.loc) {
        const [latitude, longitude] = data.loc.split(',').map(Number);
        const location: Omit<CachedIPLocation, 'timestamp' | 'expiresAt'> = {
          latitude,
          longitude,
          city: data.city || 'Ville inconnue',
          country: data.country || 'Pays inconnu',
          accuracy: 10000, // ~10km pour IP
          provider: 'ipinfo.io'
        };
        
        this.set(location);
        return { ...location, timestamp: Date.now(), expiresAt: Date.now() + CACHE_TTL };
      }
      
      throw new Error('Invalid response from ipinfo.io');
    } catch (error) {
      logger.error('❌ [IPCache] Échec fetch fresh', error);
      throw error;
    }
  }

  /**
   * Récupère la position (cache ou fetch)
   */
  public static async getOrFetch(): Promise<CachedIPLocation> {
    // Essayer le cache d'abord
    const cached = this.get();
    if (cached) return cached;

    // Sinon fetch
    return this.fetchFresh();
  }
}
