import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface DispatchOrder {
  id: string;
  type: 'taxi' | 'delivery' | 'marketplace';
  pickup_location: string;
  destination_location?: string;
  delivery_location?: string;
  estimated_price: number;
  urgency: 'low' | 'medium' | 'high';
  distance?: number;
  created_at: string;
  expires_at?: string;
}

interface DriverStatus {
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation?: { lat: number; lng: number };
  serviceTypes: string[];
}

export const useDriverDispatch = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>({
    isOnline: false,
    isAvailable: true,
    serviceTypes: ['taxi', 'delivery', 'marketplace']
  });
  const [pendingOrders, setPendingOrders] = useState<DispatchOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Update driver status
  const updateStatus = useCallback(async (updates: Partial<DriverStatus>) => {
    if (!user) return false;

    setLoading(true);
    try {
      const newStatus = { ...driverStatus, ...updates };
      
      // Update in database
      const updateData: any = {
        driver_id: user.id,
        is_online: newStatus.isOnline,
        is_available: newStatus.isAvailable,
        last_ping: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (newStatus.currentLocation?.lat && newStatus.currentLocation?.lng) {
        updateData.latitude = newStatus.currentLocation.lat;
        updateData.longitude = newStatus.currentLocation.lng;
      } else {
        // Default to Kinshasa center if no location
        updateData.latitude = -4.3217;
        updateData.longitude = 15.3069;
      }

      const { error } = await supabase
        .from('driver_locations')
        .upsert(updateData, { onConflict: 'driver_id' });

      if (error) throw error;

      setDriverStatus(newStatus);
      return true;

    } catch (error: any) {
      console.error('Error updating driver status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, driverStatus]);

  // Accept an order
  const acceptOrder = useCallback(async (order: DispatchOrder) => {
    if (!user) return false;

    setLoading(true);
    try {
      let success = false;

      switch (order.type) {
        case 'taxi':
          const { error: taxiError } = await supabase.functions.invoke('ride-dispatcher', {
            body: {
              action: 'assign_driver',
              rideRequestId: order.id,
              driverId: user.id
            }
          });
          success = !taxiError;
          break;

        case 'delivery':
          // Use the new status manager edge function
          const { error: deliveryError } = await supabase.functions.invoke('delivery-status-manager', {
            body: {
              orderId: order.id,
              newStatus: 'driver_assigned',
              driverId: user.id
            }
          });
          success = !deliveryError;
          break;

        case 'marketplace':
          const { error: marketplaceError } = await supabase
            .from('marketplace_delivery_assignments')
            .update({
              driver_id: user.id,
              assignment_status: 'assigned'
            })
            .eq('id', order.id);
          success = !marketplaceError;
          break;
      }

      if (success) {
        // Remove from pending and add to active
        setPendingOrders(prev => prev.filter(o => o.id !== order.id));
        setActiveOrders(prev => [...prev, { ...order, status: 'accepted' }]);
        
        // Update availability
        await updateStatus({ isAvailable: false });
        
        toast.success('Commande acceptée !');
      }

      return success;

    } catch (error: any) {
      console.error('Error accepting order:', error);
      toast.error('Erreur lors de l\'acceptation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, updateStatus]);

  // Complete an order
  const completeOrder = useCallback(async (orderId: string, type: string) => {
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
          // Use the new status manager edge function
          const { error: deliveryError } = await supabase.functions.invoke('delivery-status-manager', {
            body: {
              orderId: orderId,
              newStatus: 'delivered',
              driverId: user.id
            }
          });
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
        
        // Update availability if no more active orders
        const remainingOrders = activeOrders.filter(o => o.id !== orderId);
        if (remainingOrders.length === 0) {
          await updateStatus({ isAvailable: true });
        }
        
        toast.success('Commande terminée !');
      }

      return success;

    } catch (error: any) {
      console.error('Error completing order:', error);
      toast.error('Erreur lors de la finalisation');
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeOrders, updateStatus]);

  // Load active orders
  const loadActiveOrders = useCallback(async () => {
    if (!user) return;

    try {
      // Load from all relevant tables
      const [taxiResponse, deliveryResponse, marketplaceResponse] = await Promise.all([
        supabase
          .from('transport_bookings')
          .select('*')
          .eq('driver_id', user.id)
          .in('status', ['accepted', 'driver_arrived', 'in_progress']),
        
        supabase
          .from('delivery_orders')
          .select('*')
          .eq('driver_id', user.id)
          .in('status', ['confirmed', 'driver_assigned', 'picked_up', 'in_transit']),
        
        supabase
          .from('marketplace_delivery_assignments')
          .select(`
            *,
            marketplace_orders(*)
          `)
          .eq('driver_id', user.id)
          .in('assignment_status', ['assigned', 'picked_up'])
      ]);

      const allOrders = [
        ...(taxiResponse.data || []).map(order => ({ ...order, type: 'taxi' })),
        ...(deliveryResponse.data || []).map(order => ({ ...order, type: 'delivery' })),
        ...(marketplaceResponse.data || []).map(order => ({ ...order, type: 'marketplace' }))
      ];

      setActiveOrders(allOrders);
      
      // Update availability based on active orders
      await updateStatus({ isAvailable: allOrders.length === 0 });

    } catch (error: any) {
      console.error('Error loading active orders:', error);
    }
  }, [user, updateStatus]);

  // Real-time order listening
  useEffect(() => {
    if (!user || !driverStatus.isOnline) return;

    // Listen for new ride offers
    const rideChannel = supabase
      .channel('ride-offers-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ride_offers',
        filter: `driver_id=eq.${user.id}`
      }, async (payload) => {
        // Fetch ride request details
        const { data: rideRequest } = await supabase
          .from('ride_requests')
          .select('*')
          .eq('id', payload.new.ride_request_id)
          .single();

        if (rideRequest) {
          const order: DispatchOrder = {
            id: rideRequest.id,
            type: 'taxi',
            pickup_location: rideRequest.pickup_location,
            destination_location: rideRequest.destination,
            estimated_price: rideRequest.surge_price || rideRequest.estimated_price,
            urgency: 'medium',
            created_at: payload.new.created_at
          };

          setPendingOrders(prev => [order, ...prev]);
          toast.info('Nouvelle course disponible', {
            description: `${rideRequest.pickup_location} → ${rideRequest.destination}`
          });
        }
      })
      .subscribe();

    // Listen for new delivery orders
    const deliveryChannel = supabase
      .channel('delivery-pending-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'delivery_orders',
        filter: 'status=eq.pending'
      }, (payload) => {
        if (driverStatus.serviceTypes.includes('delivery')) {
          const order: DispatchOrder = {
            id: payload.new.id,
            type: 'delivery',
            pickup_location: payload.new.pickup_location,
            delivery_location: payload.new.delivery_location,
            estimated_price: payload.new.estimated_price,
            urgency: payload.new.delivery_type === 'flash' ? 'high' : 'medium',
            created_at: payload.new.created_at
          };

          setPendingOrders(prev => [order, ...prev]);
          toast.info('Nouvelle livraison disponible', {
            description: `${payload.new.pickup_location} → ${payload.new.delivery_location}`
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(rideChannel);
      supabase.removeChannel(deliveryChannel);
    };
  }, [user, driverStatus.isOnline, driverStatus.serviceTypes]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadActiveOrders();
    }
  }, [user, loadActiveOrders]);

  return {
    loading,
    driverStatus,
    pendingOrders,
    activeOrders,
    updateStatus,
    acceptOrder,
    completeOrder,
    loadActiveOrders
  };
};