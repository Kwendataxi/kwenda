import { supabase } from '@/integrations/supabase/client';

/**
 * Utilitaire de debug pour diagnostiquer les problèmes de réservation
 */
export class DebugHelper {
  
  static async checkDriversAvailability() {
    console.log('🔍 [Debug] Vérification disponibilité chauffeurs...');
    
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
          driver_profiles!inner(
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
        console.error('❌ [Debug] Erreur récupération chauffeurs:', onlineError);
        return null;
      }

      console.log(`✅ [Debug] ${onlineDrivers?.length || 0} chauffeurs en ligne:`, onlineDrivers);
      
      return {
        totalOnline: onlineDrivers?.length || 0,
        drivers: onlineDrivers || []
      };
    } catch (error) {
      console.error('❌ [Debug] Erreur générale:', error);
      return null;
    }
  }

  static async checkRecentBookings() {
    console.log('📊 [Debug] Vérification réservations récentes...');
    
    try {
      const { data: recentBookings, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ [Debug] Erreur récupération réservations:', error);
        return null;
      }

      console.log(`📋 [Debug] ${recentBookings?.length || 0} réservations récentes:`, recentBookings);
      
      return recentBookings || [];
    } catch (error) {
      console.error('❌ [Debug] Erreur générale:', error);
      return null;
    }
  }

  static async checkRecentDeliveries() {
    console.log('📦 [Debug] Vérification livraisons récentes...');
    
    try {
      const { data: recentDeliveries, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ [Debug] Erreur récupération livraisons:', error);
        return null;
      }

      console.log(`📦 [Debug] ${recentDeliveries?.length || 0} livraisons récentes:`, recentDeliveries);
      
      return recentDeliveries || [];
    } catch (error) {
      console.error('❌ [Debug] Erreur générale:', error);
      return null;
    }
  }

  static async testEdgeFunctionConnection() {
    console.log('🔗 [Debug] Test connexion Edge Functions...');
    
    try {
      // Test ride-dispatcher
      const rideTest = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          rideRequestId: 'test-ride-id',
          pickupLat: -4.3217,
          pickupLng: 15.3069,
          serviceType: 'taxi'
        }
      });

      console.log('🚗 [Debug] Test ride-dispatcher:', rideTest);

      // Test delivery-dispatcher
      const deliveryTest = await supabase.functions.invoke('delivery-dispatcher', {
        body: {
          orderId: 'test-delivery-id',
          pickupLat: -4.3217,
          pickupLng: 15.3069,
          deliveryType: 'flash'
        }
      });

      console.log('📦 [Debug] Test delivery-dispatcher:', deliveryTest);

      return {
        rideDispatcher: rideTest,
        deliveryDispatcher: deliveryTest
      };
    } catch (error) {
      console.error('❌ [Debug] Erreur test Edge Functions:', error);
      return null;
    }
  }

  static async runFullDiagnostic() {
    console.log('🔍 [Debug] === DIAGNOSTIC COMPLET DÉMARRÉ ===');
    
    const results = {
      drivers: await this.checkDriversAvailability(),
      bookings: await this.checkRecentBookings(),
      deliveries: await this.checkRecentDeliveries(),
      edgeFunctions: await this.testEdgeFunctionConnection()
    };

    console.log('📊 [Debug] === RÉSULTATS DIAGNOSTIC ===', results);
    
    return results;
  }
}

// Exposer globalement pour debug dans la console
if (typeof window !== 'undefined') {
  (window as any).debugKwenda = DebugHelper;
}