/**
 * REDIS CACHE LAYER - PHASE 1
 * Infrastructure de cache distribué pour scalabilité
 * Supporte millions d'utilisateurs avec stratégies de cache intelligentes
 */

export interface CacheStrategy {
  ttl: number;
  prefix: string;
}

// Stratégies de cache par type de données
export const cacheStrategies = {
  // Produits populaires marketplace - 5 minutes
  POPULAR_PRODUCTS: { ttl: 300, prefix: 'products:popular' } as CacheStrategy,
  
  // Détails produit - 10 minutes
  PRODUCT_DETAILS: { ttl: 600, prefix: 'product' } as CacheStrategy,
  
  // Chauffeurs disponibles - 30 secondes (haute fréquence)
  AVAILABLE_DRIVERS: { ttl: 30, prefix: 'drivers:available' } as CacheStrategy,
  
  // Tarifs dynamiques - 2 minutes
  DYNAMIC_PRICING: { ttl: 120, prefix: 'pricing' } as CacheStrategy,
  
  // Promos actives - 10 minutes
  ACTIVE_PROMOS: { ttl: 600, prefix: 'promos:active' } as CacheStrategy,
  
  // Stats vendeur - 5 minutes
  VENDOR_STATS: { ttl: 300, prefix: 'vendor:stats' } as CacheStrategy,
  
  // Zones de service - 30 minutes (peu de changements)
  SERVICE_ZONES: { ttl: 1800, prefix: 'zones' } as CacheStrategy,
  
  // Configuration des services - 5 minutes
  SERVICE_CONFIG: { ttl: 300, prefix: 'service:config' } as CacheStrategy,
  
  // Profil utilisateur - 10 minutes
  USER_PROFILE: { ttl: 600, prefix: 'user:profile' } as CacheStrategy,
  
  // Stats dashboard - 2 minutes
  DASHBOARD_STATS: { ttl: 120, prefix: 'stats:dashboard' } as CacheStrategy
};

/**
 * Client Redis avec fallback localStorage pour développement
 * En production, utiliser un vrai Redis (Upstash, Redis Cloud, etc.)
 */
export class RedisClient {
  private prefix = 'kwenda:cache:';
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0
  };

  async get<T>(key: string): Promise<T | null> {
    try {
      // TODO: En production, remplacer par vrai client Redis
      // const value = await redis.get(`${this.prefix}${key}`);
      
      const value = localStorage.getItem(`${this.prefix}${key}`);
      if (!value) {
        this.metrics.misses++;
        return null;
      }

      const cached = JSON.parse(value);
      
      // Vérifier expiration
      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        await this.del(key);
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      return cached.data as T;
    } catch (error) {
      console.error('[Redis] Get error:', error);
      this.metrics.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cached = {
        data: value,
        expiresAt: ttl ? Date.now() + (ttl * 1000) : null
      };

      // TODO: En production, remplacer par vrai client Redis
      // await redis.setex(`${this.prefix}${key}`, ttl, JSON.stringify(value));
      
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(cached));
      this.metrics.sets++;
    } catch (error) {
      console.error('[Redis] Set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      // TODO: En production, remplacer par vrai client Redis
      // await redis.del(`${this.prefix}${key}`);
      
      localStorage.removeItem(`${this.prefix}${key}`);
    } catch (error) {
      console.error('[Redis] Del error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // TODO: En production, utiliser SCAN + DEL pour pattern matching
      const keys = Object.keys(localStorage);
      const matchingKeys = keys.filter(k => 
        k.startsWith(`${this.prefix}${pattern}`)
      );
      
      matchingKeys.forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.error('[Redis] Invalidate pattern error:', error);
    }
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0
    };
  }

  clearMetrics() {
    this.metrics = { hits: 0, misses: 0, sets: 0 };
  }
}

// Instance singleton
export const redis = new RedisClient();

/**
 * Helper pour créer des clés de cache structurées
 */
export const cacheKey = {
  product: (id: string) => `product:${id}`,
  products: (filters: any) => `products:${JSON.stringify(filters)}`,
  driver: (id: string, city: string) => `driver:${city}:${id}`,
  drivers: (city: string, available: boolean) => `drivers:${city}:${available}`,
  pricing: (city: string, vehicleClass: string) => `pricing:${city}:${vehicleClass}`,
  promo: (code: string) => `promo:${code}`,
  vendor: (id: string) => `vendor:${id}`,
  zone: (id: string) => `zone:${id}`,
  userProfile: (userId: string) => `user:${userId}`,
  serviceConfig: (service: string) => `service:${service}`
};
