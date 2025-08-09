import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRealtimeNotifications } from './useRealtimeNotifications';
import { toast } from 'sonner';

export interface UnifiedOrderNotification {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace';
  title: string;
  message: string;
  location: string;
  estimatedPrice: number;
  distance?: number;
  urgency: 'low' | 'medium' | 'high';
  data: any;
  created_at: string;
}

export interface DispatchStatus {
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: { lat: number; lng: number };
  activeZone?: string;
  serviceTypes: string[];
}

export const useUnifiedDispatcher = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<DispatchStatus>({
    isOnline: false,
    isAvailable: true,
    serviceTypes: ['taxi', 'delivery']
  });
  const [pendingNotifications, setPendingNotifications] = useState<UnifiedOrderNotification[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Update driver status and location
  const updateDriverStatus = async (status: Partial<DispatchStatus>) => {
    if (!user) return false;

    try {
      console.log('Mise à jour statut chauffeur:', status);

      const updateData: any = {
        driver_id: user.id,
        is_online: status.isOnline ?? dispatchStatus.isOnline,
        is_available: status.isAvailable ?? dispatchStatus.isAvailable,
        last_ping: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Ajouter les coordonnées si disponibles
      if (status.currentLocation?.lat && status.currentLocation?.lng) {
        updateData.latitude = status.currentLocation.lat;
        updateData.longitude = status.currentLocation.lng;
      }

      const { error } = await supabase
        .from('driver_locations')
        .upsert(updateData, {
          onConflict: 'driver_id'
        });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      setDispatchStatus(prev => ({ ...prev, ...status }));
      toast.success('Statut mis à jour');
      return true;
    } catch (error: any) {
      console.error('Error updating driver status:', error);
      toast.error(`Erreur: ${error.message}`);
      return false;
    }
  };

  // Real-time notifications for new orders
  useEffect(() => {
    if (!user || !dispatchStatus.isOnline) return;

    // Channel pour les offres de taxi
    const taxiChannel = supabase
      .channel('taxi-offers')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ride_offers',
        filter: `driver_id=eq.${user.id}`
      }, (payload) => {
        handleNewTaxiOffer(payload.new);
      })
      .subscribe();

    // Channel pour les livraisons directes
    const deliveryChannel = supabase
      .channel('delivery-offers')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_orders',
        filter: 'status=eq.pending'
      }, (payload) => {
        handleNewDeliveryOffer(payload.new);
      })
      .subscribe();

    // Channel pour les livraisons marketplace
    const marketplaceChannel = supabase
      .channel('marketplace-delivery-offers')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'marketplace_delivery_assignments',
        filter: 'assignment_status=eq.pending'
      }, (payload) => {
        handleNewMarketplaceOffer(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(taxiChannel);
      supabase.removeChannel(deliveryChannel);
      supabase.removeChannel(marketplaceChannel);
    };
  }, [user, dispatchStatus.isOnline]);

  const handleNewTaxiOffer = async (offer: any) => {
    // Fetch ride request details
    const { data: rideRequest } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('id', offer.ride_request_id)
      .single();

    if (rideRequest) {
      const notification: UnifiedOrderNotification = {
        id: offer.id,
        type: 'taxi',
        title: 'Nouvelle course disponible',
        message: `${rideRequest.pickup_location} → ${rideRequest.destination}`,
        location: rideRequest.pickup_location,
        estimatedPrice: rideRequest.surge_price || rideRequest.estimated_price || 0,
        urgency: 'medium',
        data: { offer, rideRequest },
        created_at: offer.created_at
      };

      addNotification(notification);
    }
  };

  const handleNewDeliveryOffer = async (delivery: any) => {
    // Check if driver is in the area and available for deliveries
    if (!dispatchStatus.serviceTypes.includes('delivery')) return;

    const notification: UnifiedOrderNotification = {
      id: delivery.id,
      type: 'delivery',
      title: 'Nouvelle livraison disponible',
      message: `${delivery.pickup_location} → ${delivery.delivery_location}`,
      location: delivery.pickup_location,
      estimatedPrice: delivery.estimated_price || 0,
      urgency: delivery.delivery_type === 'flash' ? 'high' : 'medium',
      data: delivery,
      created_at: delivery.created_at
    };

    addNotification(notification);
  };

  const handleNewMarketplaceOffer = async (assignment: any) => {
    // Check if driver is available for marketplace deliveries
    if (!dispatchStatus.serviceTypes.includes('delivery')) return;

    // Fetch order details
    const { data: order } = await supabase
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_products(title, price)
      `)
      .eq('id', assignment.order_id)
      .single();

    if (order) {
      const notification: UnifiedOrderNotification = {
        id: assignment.id,
        type: 'marketplace',
        title: 'Livraison marketplace',
        message: `Produit: ${order.marketplace_products?.title || 'Article'} - Paiement à la livraison`,
        location: assignment.pickup_location,
        estimatedPrice: assignment.delivery_fee || 0,
        urgency: 'high', // Marketplace orders are priority
        data: { assignment, order },
        created_at: assignment.created_at
      };

      addNotification(notification);
    }
  };

  const addNotification = (notification: UnifiedOrderNotification) => {
    setPendingNotifications(prev => [notification, ...prev]);
    
    // Play sound and show toast
    toast.info(notification.title, {
      description: notification.message,
      action: {
        label: 'Voir',
        onClick: () => console.log('Navigate to notification')
      }
    });

    // Auto-remove after 30 seconds for taxi, 60 for delivery
    const timeout = notification.type === 'taxi' ? 30000 : 60000;
    setTimeout(() => {
      setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, timeout);
  };

  // Accept an order
  const acceptOrder = async (notification: UnifiedOrderNotification) => {
    if (!user) return false;

    setLoading(true);
    try {
      let success = false;

      switch (notification.type) {
        case 'taxi':
          const { error: taxiError } = await supabase.functions.invoke('ride-dispatcher', {
            body: {
              action: 'assign_driver',
              rideRequestId: notification.data.rideRequest.id,
              driverId: user.id
            }
          });
          success = !taxiError;
          break;

        case 'delivery':
          const { error: deliveryError } = await supabase
            .from('delivery_orders')
            .update({
              driver_id: user.id,
              status: 'confirmed'
            })
            .eq('id', notification.id);
          success = !deliveryError;
          break;

        case 'marketplace':
          const { error: marketplaceError } = await supabase
            .from('marketplace_delivery_assignments')
            .update({
              driver_id: user.id,
              assignment_status: 'assigned'
            })
            .eq('id', notification.id);
          success = !marketplaceError;
          break;
      }

      if (success) {
        // Remove notification and add to active orders
        setPendingNotifications(prev => prev.filter(n => n.id !== notification.id));
        setActiveOrders(prev => [...prev, notification]);
        setDispatchStatus(prev => ({ ...prev, isAvailable: false }));
        toast.success('Commande acceptée !');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error accepting order:', error);
      toast.error('Erreur lors de l\'acceptation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reject an order
  const rejectOrder = (notificationId: string) => {
    setPendingNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Complete an order
  const completeOrder = async (orderId: string, type: string) => {
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
              delivery_time: new Date().toISOString()
            })
            .eq('id', orderId);
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
          success = !marketplaceError;
          break;
      }

      if (success) {
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
        setDispatchStatus(prev => ({ ...prev, isAvailable: true }));
        toast.success('Commande terminée !');
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error completing order:', error);
      toast.error('Erreur lors de la finalisation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load current active orders
  const loadActiveOrders = useCallback(async () => {
    if (!user) return;

    try {
      // Load active taxi rides
      const { data: taxiRides } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('assigned_driver_id', user.id)
        .in('status', ['accepted', 'driver_arrived', 'in_progress']);

      // Load active deliveries
      const { data: deliveries } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('driver_id', user.id)
        .in('status', ['confirmed', 'picked_up']);

      // Load active marketplace deliveries
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
        .in('assignment_status', ['assigned', 'picked_up']);

      const allActiveOrders = [
        ...(taxiRides || []).map(r => ({ ...r, type: 'taxi' })),
        ...(deliveries || []).map(d => ({ ...d, type: 'delivery' })),
        ...(marketplaceDeliveries || []).map(m => ({ ...m, type: 'marketplace' }))
      ];

      setActiveOrders(allActiveOrders);
      setDispatchStatus(prev => ({ 
        ...prev, 
        isAvailable: allActiveOrders.length === 0 
      }));

    } catch (error: any) {
      console.error('Error loading active orders:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadActiveOrders();
    }
  }, [user, loadActiveOrders]);

  return {
    loading,
    dispatchStatus,
    pendingNotifications,
    activeOrders,
    updateDriverStatus,
    acceptOrder,
    rejectOrder,
    completeOrder,
    loadActiveOrders
  };
};