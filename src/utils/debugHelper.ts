import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

/**
 * Utilitaire de debug pour diagnostiquer les problèmes de réservation
 */
export class DebugHelper {
  
  static async checkDriversAvailability() {
    logger.debug('Vérification disponibilité chauffeurs');
    
    try {
      // Vérifier les chauffeurs en ligne
      const { data: onlineDrivers, error: onlineError } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          latitude,
          longitude,
          is_online,
          is_available,
          vehicle_class,
          last_ping,
          chauffeurs!inner(
            user_id,
            vehicle_make,
            vehicle_model,
            is_active,
            verification_status
          )
        `)
        .eq('is_online', true)
        .eq('is_available', true)
        .gte('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString());

      if (onlineError) {
        logger.error('Erreur récupération chauffeurs', onlineError);
        return null;
      }

      logger.debug(`${onlineDrivers?.length || 0} chauffeurs en ligne`, onlineDrivers);
      
      return {
        totalOnline: onlineDrivers?.length || 0,
        drivers: onlineDrivers || []
      };
    } catch (error) {
      logger.error('Erreur générale checkDriversAvailability', error);
      return null;
    }
  }

  static async checkRecentBookings() {
    logger.debug('Vérification réservations récentes');
    
    try {
      const { data: recentBookings, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Erreur récupération réservations', error);
        return null;
      }

      logger.debug(`${recentBookings?.length || 0} réservations récentes`, recentBookings);
      
      return recentBookings || [];
    } catch (error) {
      logger.error('Erreur générale checkRecentBookings', error);
      return null;
    }
  }

  static async checkRecentDeliveries() {
    logger.debug('Vérification livraisons récentes');
    
    try {
      const { data: recentDeliveries, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Erreur récupération livraisons', error);
        return null;
      }

      logger.debug(`${recentDeliveries?.length || 0} livraisons récentes`, recentDeliveries);
      
      return recentDeliveries || [];
    } catch (error) {
      logger.error('Erreur générale checkRecentDeliveries', error);
      return null;
    }
  }

  static async testEdgeFunctionConnection() {
    logger.debug('Test connexion Edge Functions');
    
    try {
      // ⚠️ Tests désactivés - utilisent des IDs de test invalides
      // Pour tester les edge functions, utilisez l'interface utilisateur normale
      
      logger.debug('Edge function tests skipped - use real UI flow instead');

      return {
        rideDispatcher: { skipped: true },
        deliveryDispatcher: { skipped: true }
      };
    } catch (error) {
      logger.error('Erreur test Edge Functions', error);
      return null;
    }
  }

  static async runFullDiagnostic() {
    logger.debug('=== DIAGNOSTIC COMPLET DÉMARRÉ ===');
    
    const results = {
      drivers: await this.checkDriversAvailability(),
      bookings: await this.checkRecentBookings(),
      deliveries: await this.checkRecentDeliveries(),
      edgeFunctions: await this.testEdgeFunctionConnection()
    };

    logger.debug('=== RÉSULTATS DIAGNOSTIC ===', results);
    
    return results;
  }
}

// Exposer globalement pour debug dans la console
if (typeof window !== 'undefined') {
  (window as any).debugKwenda = DebugHelper;
}