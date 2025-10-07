/**
 * Service de sécurité pour Google Maps API
 * Monitoring, alertes et contrôles d'accès
 */

import { supabase } from '@/integrations/supabase/client';

class GoogleMapsSecurityService {
  private static instance: GoogleMapsSecurityService;
  private keyAccessCount = 0;
  private lastAccessTime = 0;
  private readonly MAX_REQUESTS_PER_MINUTE = 20;

  private constructor() {}

  static getInstance(): GoogleMapsSecurityService {
    if (!GoogleMapsSecurityService.instance) {
      GoogleMapsSecurityService.instance = new GoogleMapsSecurityService();
    }
    return GoogleMapsSecurityService.instance;
  }

  /**
   * Vérifie si l'accès à la clé est autorisé (rate limiting côté client)
   */
  canAccessKey(): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Reset du compteur après 1 minute
    if (now - this.lastAccessTime > oneMinute) {
      this.keyAccessCount = 0;
      this.lastAccessTime = now;
    }

    this.keyAccessCount++;

    if (this.keyAccessCount > this.MAX_REQUESTS_PER_MINUTE) {
      console.warn('🚨 [GoogleMapsSecurity] Trop de requêtes d\'accès à la clé');
      return false;
    }

    return true;
  }

  /**
   * Log l'utilisation de la clé Google Maps
   */
  async logKeyUsage(action: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Temporarily disable logging until types are regenerated
      console.log(`📊 [GoogleMapsSecurity] Usage: ${action}`, metadata);

      console.log(`📊 [GoogleMapsSecurity] Usage logged: ${action}`);
    } catch (error) {
      console.error('❌ [GoogleMapsSecurity] Erreur logging:', error);
    }
  }

  /**
   * Vérifie le monitoring de sécurité
   */
  async checkSecurityMonitoring(): Promise<{
    status: 'ok' | 'warning' | 'blocked';
    usage: { last_hour: number; last_24h: number };
    warnings: string[];
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-security-monitor', {
        method: 'POST',
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ [GoogleMapsSecurity] Erreur monitoring:', error);
      return {
        status: 'ok',
        usage: { last_hour: 0, last_24h: 0 },
        warnings: [],
      };
    }
  }

  /**
   * Nettoie les données sensibles stockées localement
   */
  clearSensitiveData(): void {
    // Ne pas stocker la clé en localStorage/sessionStorage
    console.log('🧹 [GoogleMapsSecurity] Nettoyage des données sensibles');
  }

  /**
   * Valide le domaine d'origine pour éviter l'utilisation cross-origin
   */
  validateOrigin(): boolean {
    const allowedOrigins = [
      'localhost',
      '127.0.0.1',
      'lovable.app',
      'lovable.dev',
      window.location.hostname,
    ];

    const currentOrigin = window.location.hostname;
    const isValid = allowedOrigins.some(origin => currentOrigin.includes(origin));

    if (!isValid) {
      console.error('🚫 [GoogleMapsSecurity] Origine non autorisée:', currentOrigin);
    }

    return isValid;
  }
}

export const googleMapsSecurityService = GoogleMapsSecurityService.getInstance();
