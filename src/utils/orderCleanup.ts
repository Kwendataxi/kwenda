import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const cleanupOldPendingOrders = async () => {
  try {
    console.log('🧹 Nettoyage des anciennes commandes pending...');
    
    // Nettoyer les commandes de transport de plus de 30 minutes sans chauffeur
    const { data: oldTransportBookings, error: transportError } = await supabase
      .from('transport_bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .is('driver_id', null)
      .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .select('id');

    if (transportError) {
      console.error('Erreur nettoyage transport:', transportError);
    } else {
      console.log(`✅ ${oldTransportBookings?.length || 0} anciennes réservations taxi nettoyées`);
    }

    // Nettoyer les commandes de livraison de plus de 30 minutes sans livreur
    const { data: oldDeliveryOrders, error: deliveryError } = await supabase
      .from('delivery_orders')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .is('driver_id', null)
      .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .select('id');

    if (deliveryError) {
      console.error('Erreur nettoyage livraison:', deliveryError);
    } else {
      console.log(`✅ ${oldDeliveryOrders?.length || 0} anciennes commandes livraison nettoyées`);
    }

    const totalCleaned = (oldTransportBookings?.length || 0) + (oldDeliveryOrders?.length || 0);
    
    if (totalCleaned > 0) {
      toast.success(`${totalCleaned} anciennes commandes nettoyées`);
    }

    return totalCleaned;
  } catch (error: any) {
    console.error('Erreur lors du nettoyage:', error);
    return 0;
  }
};

export const validateOrderCoordinates = (coordinates: any): boolean => {
  if (!coordinates || typeof coordinates !== 'object') {
    return false;
  }

  const { lat, lng } = coordinates;
  
  // Vérifier que les coordonnées sont des nombres valides
  const latNum = typeof lat === 'number' ? lat : parseFloat(lat);
  const lngNum = typeof lng === 'number' ? lng : parseFloat(lng);
  
  if (isNaN(latNum) || isNaN(lngNum)) {
    return false;
  }

  // Vérifier que les coordonnées sont dans des plages réalistes
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return false;
  }

  // Vérifier que ce ne sont pas des coordonnées nulles
  if (latNum === 0 && lngNum === 0) {
    return false;
  }

  return true;
};

export const getOrderStatusMessage = (status: string): string => {
  const statusMessages: Record<string, string> = {
    'pending': 'En attente d\'assignation',
    'confirmed': 'Confirmée',
    'driver_assigned': 'Chauffeur assigné',
    'in_progress': 'En cours',
    'picked_up': 'Collectée',
    'in_transit': 'En livraison',
    'delivered': 'Livrée',
    'completed': 'Terminée',
    'cancelled': 'Annulée',
    'no_driver_available': 'Aucun chauffeur disponible'
  };

  return statusMessages[status] || status;
};