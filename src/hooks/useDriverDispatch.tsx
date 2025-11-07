/**
 * 🚀 Hook Unifié de Dispatch pour Chauffeurs
 * PHASE 1: Fusionne useUnifiedDispatcher + useDriverOrderNotifications
 * 
 * Gère TOUTES les commandes (taxi, delivery, marketplace) de manière unifiée
 * avec protection atomique contre les race conditions
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDriverStatus } from './useDriverStatus';
import { toast } from 'sonner';

export interface UnifiedOrderNotification {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace';
  orderId: string;
  title: string;
  message: string;
  location: string;
  estimatedPrice: number;
  distance?: number;
  urgency: 'low' | 'medium' | 'high';
  data: any;
  created_at: string;
  expires_at?: string;
  assignment_version?: number;
}

export const useDriverDispatch = () => {
  const { user } = useAuth();
  const { status: driverStatus, markBusy, markAvailable } = useDriverStatus();
  const [loading, setLoading] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState<UnifiedOrderNotification[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // ✅ Charger les commandes actives
  const loadActiveOrders = useCallback(async () => {
    if (!user) return;

    try {
      // Taxi rides actifs
      const { data: taxiRides } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['accepted', 'driver_assigned', 'driver_arrived', 'in_progress']);

      // Livraisons actives
      const { data: deliveries } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['driver_assigned', 'confirmed', 'picked_up', 'in_transit']);

      // Livraisons marketplace actives
      const { data: marketplaceDeliveries } = await supabase
        .from('marketplace_delivery_assignments')
        .select(`
          *,
          marketplace_orders(
            *,
            marketplace_products(title, price)
          )
        `)
        .eq('driver_id', user.id)
        .in('assignment_status', ['assigned', 'accepted', 'picked_up']);

      const allActiveOrders = [
        ...(taxiRides || []).map(r => ({ ...r, type: 'taxi' })),
        ...(deliveries || []).map(d => ({ ...d, type: 'delivery' })),
        ...(marketplaceDeliveries || []).map(m => ({ ...m, type: 'marketplace' }))
      ];

      setActiveOrders(allActiveOrders);

      // Mettre à jour le statut si nécessaire
      if (allActiveOrders.length > 0 && driverStatus.isAvailable) {
        const firstOrder = allActiveOrders[0];
        markBusy(firstOrder.id, firstOrder.type as 'taxi' | 'delivery' | 'marketplace');
      } else if (allActiveOrders.length === 0 && !driverStatus.isAvailable && driverStatus.isOnline) {
        markAvailable();
      }

    } catch (error: any) {
      console.error('Error loading active orders:', error);
    }
  }, [user, driverStatus.isAvailable, driverStatus.isOnline, markBusy, markAvailable]);

  // ✅ Accepter une commande avec protection atomique
  const acceptOrder = async (notification: UnifiedOrderNotification): Promise<boolean> => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return false;
    }

    setLoading(true);
    try {
      let success = false;

      switch (notification.type) {
        case 'taxi':
          // Vérifier si déjà assignée
          const { data: currentBooking } = await supabase
            .from('transport_bookings')
            .select('id, driver_id, status')
            .eq('id', notification.orderId)
            .single();

          if (currentBooking?.driver_id) {
            toast.error('⚠️ Course déjà assignée à un autre chauffeur');
            setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
            return false;
          }

          // Appeler edge function pour assignation atomique
          const { error: taxiError } = await supabase.functions.invoke('ride-dispatcher', {
            body: {
              action: 'assign_driver',
              rideRequestId: notification.orderId,
              driverId: user.id
            }
          });
          
          if (taxiError) {
            console.error('Error accepting taxi ride:', taxiError);
            toast.error('❌ Impossible d\'accepter la course');
            return false;
          }
          
          success = true;
          break;

        case 'delivery':
          // ✅ Protection atomique avec assignment_version
          const { data: currentDelivery } = await supabase
            .from('delivery_orders')
            .select('id, driver_id, assignment_version, status')
            .eq('id', notification.orderId)
            .single();

          if (!currentDelivery) {
            toast.error('❌ Commande introuvable');
            return false;
          }

          if (currentDelivery.driver_id) {
            await supabase.rpc('log_assignment_conflict', {
              p_order_type: 'delivery_order',
              p_order_id: notification.orderId,
              p_driver_id: user.id,
              p_conflict_reason: 'Course déjà assignée'
            });

            toast.error('⚠️ Course déjà assignée à un autre chauffeur');
            setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
            return false;
          }

          // Assignation atomique avec versioning
          const { data: updateResult, error: deliveryError } = await supabase
            .from('delivery_orders')
            .update({ 
              driver_id: user.id,
              status: 'driver_assigned',
              driver_assigned_at: new Date().toISOString(),
              assignment_version: (currentDelivery.assignment_version || 0) + 1
            })
            .eq('id', notification.orderId)
            .eq('assignment_version', currentDelivery.assignment_version)
            .is('driver_id', null)
            .select();

          if (!updateResult || updateResult.length === 0) {
            await supabase.rpc('log_assignment_conflict', {
              p_order_type: 'delivery_order',
              p_order_id: notification.orderId,
              p_driver_id: user.id,
              p_conflict_reason: 'Conflit de version (race condition)'
            });

            toast.error('⚠️ Un autre chauffeur a accepté en même temps');
            setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
            return false;
          }

          if (deliveryError) {
            console.error('Error accepting delivery:', deliveryError);
            toast.error('❌ Erreur lors de l\'acceptation');
            return false;
          }

          success = true;
          break;

        case 'marketplace':
          // ✅ Protection atomique
          const { data: currentAssignment } = await supabase
            .from('marketplace_delivery_assignments')
            .select('id, driver_id, assignment_status')
            .eq('id', notification.orderId)
            .single();

          if (!currentAssignment || currentAssignment.driver_id) {
            toast.error('⚠️ Livraison déjà assignée');
            setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
            return false;
          }

          const { error: marketplaceError } = await supabase
            .from('marketplace_delivery_assignments')
            .update({
              driver_id: user.id,
              assignment_status: 'accepted'
            })
            .eq('id', notification.orderId)
            .is('driver_id', null);

          if (marketplaceError) {
            console.error('Error accepting marketplace delivery:', marketplaceError);
            toast.error('❌ Impossible d\'accepter la livraison');
            return false;
          }

          success = true;
          break;
      }

      if (success) {
        // Retirer la notification
        setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        // Ajouter aux commandes actives
        setActiveOrders(prev => [...prev, { ...notification.data, type: notification.type }]);
        
        // Marquer comme occupé
        await markBusy(notification.orderId, notification.type);
        
        toast.success('✅ Course acceptée !');
        
        // Logger le succès
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          activity_type: 'order_accepted',
          description: `${notification.type} accepté`,
          reference_type: notification.type,
          reference_id: notification.orderId
        });

        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error accepting order:', error);
      toast.error(`❌ Erreur: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Refuser une commande
  const rejectOrder = (notificationId: string) => {
    setPendingNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast.info('Commande refusée');
  };

  // ✅ Terminer une commande
  const completeOrder = async (orderId: string, type: 'taxi' | 'delivery' | 'marketplace'): Promise<boolean> => {
    setLoading(true);
    try {
      let success = false;

      switch (type) {
        case 'taxi':
          const { error: taxiError } = await supabase.functions.invoke('ride-dispatcher', {
            body: {
              action: 'update_status',
              rideRequestId: orderId,
              status: 'completed'
            }
          });
          success = !taxiError;
          break;

        case 'delivery':
          const { error: deliveryError } = await supabase
            .from('delivery_orders')
            .update({
              status: 'delivered',
              delivered_at: new Date().toISOString()
            })
            .eq('id', orderId);
          
          if (!deliveryError && user) {
            // Consommer la course de l'abonnement
            await supabase.functions.invoke('consume-ride', {
              body: {
                driver_id: user.id,
                booking_id: orderId,
                service_type: 'delivery'
              }
            });
          }
          
          success = !deliveryError;
          break;

        case 'marketplace':
          const { error: marketplaceError } = await supabase
            .from('marketplace_delivery_assignments')
            .update({
              assignment_status: 'delivered',
              actual_delivery_time: new Date().toISOString()
            })
            .eq('id', orderId);
          
          if (!marketplaceError && user) {
            // Consommer la course de l'abonnement
            await supabase.functions.invoke('consume-ride', {
              body: {
                driver_id: user.id,
                booking_id: orderId,
                service_type: 'marketplace'
              }
            });
          }
          
          success = !marketplaceError;
          break;
      }

      if (success) {
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
        await markAvailable();
        toast.success('✅ Commande terminée !');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error completing order:', error);
      toast.error('❌ Erreur lors de la finalisation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ✅ PHASE 7: Utiliser le service de notifications robuste
  useEffect(() => {
    if (!user || !driverStatus.isOnline) return;

    console.log('🎧 Écoute unifiée via notification service:', user.id);

    const { driverNotificationService } = require('@/services/driverNotificationService');
    
    driverNotificationService.start(user.id);

    const unsubscribe = driverNotificationService.subscribe((notification: any) => {
      const unifiedNotif: UnifiedOrderNotification = {
        id: notification.id,
        type: notification.type,
        orderId: notification.orderId,
        title: notification.title,
        message: notification.message,
        location: notification.data?.pickup_location || '',
        estimatedPrice: notification.data?.estimated_price || 0,
        urgency: 'medium',
        data: notification.data,
        created_at: new Date().toISOString()
      };
      
      setPendingNotifications(prev => [unifiedNotif, ...prev]);
    });

    return () => {
      unsubscribe();
      driverNotificationService.stop();
    };
  }, [user, driverStatus.isOnline]);

  // ✅ Charger les commandes actives au montage
  useEffect(() => {
    if (user) {
      loadActiveOrders();
    }
  }, [user, loadActiveOrders]);

  return {
    loading,
    pendingNotifications,
    activeOrders,
    acceptOrder,
    rejectOrder,
    completeOrder,
    loadActiveOrders
  };
};
