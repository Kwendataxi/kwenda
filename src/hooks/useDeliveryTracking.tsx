import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeliveryOrder {
  id: string;
  user_id: string;
  driver_id?: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: 'flash' | 'flex' | 'maxicharge';
  estimated_price: number;
  actual_price?: number;
  status: string;
  pickup_time?: string;
  delivery_time?: string;
  created_at: string;
  updated_at: string;
}

interface DriverProfile {
  display_name?: string;
  phone_number?: string;
  avatar_url?: string;
}

interface RecipientProfile {
  display_name?: string;
  phone_number?: string;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  updated_at: string;
  lat: number;
  lng: number;
}

export const useDeliveryTracking = (orderId: string) => {
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);

  // Load order details
  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      setOrder(data);

      // Load driver profile if assigned
      if (data.driver_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, phone_number, avatar_url')
          .eq('user_id', data.driver_id)
          .single();
        
        setDriverProfile(profile);
      }

      // Load recipient profile
      const { data: recipient } = await supabase
        .from('profiles')
        .select('display_name, phone_number')
        .eq('user_id', data.user_id)
        .single();
      
      setRecipientProfile(recipient);

    } catch (error: any) {
      console.error('Error loading order:', error);
      toast.error('Erreur lors du chargement de la commande');
    } finally {
      setLoading(false);
    }
  };

  // Load driver location
  const loadDriverLocation = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, heading, updated_at')
        .eq('driver_id', driverId)
        .single();

      if (error) throw error;
      
      if (data) {
        setDriverLocation({
          ...data,
          lat: data.latitude,
          lng: data.longitude
        });
      }

    } catch (error: any) {
      console.error('Error loading driver location:', error);
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!orderId) return;

    loadOrder();

    // Subscribe to order updates
    const orderChannel = supabase
      .channel(`delivery-order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'delivery_orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        setOrder(payload.new as DeliveryOrder);
        
        // Show status update notification
        const statusMessages: Record<string, string> = {
          confirmed: 'Votre livraison a été confirmée',
          assigned: 'Un livreur a été assigné',
          picked_up: 'Votre colis a été récupéré',
          in_transit: 'Votre colis est en route',
          delivered: 'Votre colis a été livré'
        };

        const message = statusMessages[payload.new.status];
        if (message) {
          toast.info(message);
        }
      })
      .subscribe();

    // Subscribe to driver location updates
    let locationChannel: any;
    if (order?.driver_id) {
      locationChannel = supabase
        .channel(`driver-location-${order.driver_id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${order.driver_id}`
        }, (payload) => {
          setDriverLocation({
            ...payload.new,
            lat: payload.new.latitude,
            lng: payload.new.longitude
          });
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(orderChannel);
      if (locationChannel) {
        supabase.removeChannel(locationChannel);
      }
    };
  }, [orderId, order?.driver_id]);

  // Update driver location when driver is assigned
  useEffect(() => {
    if (order?.driver_id) {
      loadDriverLocation(order.driver_id);
    }
  }, [order?.driver_id]);

  // Helper functions
  const getStatusLabel = () => {
    if (!order) return 'Chargement...';
    
    const statusLabels: Record<string, string> = {
      pending: 'En attente',
      searching_driver: 'Recherche de livreur',
      confirmed: 'Confirmée',
      assigned: 'Livreur assigné',
      picked_up: 'Colis récupéré',
      in_transit: 'En transit',
      delivered: 'Livré',
      cancelled: 'Annulé'
    };
    
    return statusLabels[order.status] || order.status;
  };

  const getPackageType = () => {
    if (!order) return '';
    
    const typeLabels: Record<string, string> = {
      flash: 'Livraison Flash',
      flex: 'Livraison Flex',
      maxicharge: 'Livraison Maxicharge'
    };
    
    return typeLabels[order.delivery_type] || 'Livraison';
  };

  const getPrice = () => {
    return order?.actual_price || order?.estimated_price || 0;
  };

  return {
    order,
    driverProfile,
    recipientProfile,
    driverLocation,
    loading,
    statusLabel: getStatusLabel(),
    packageType: getPackageType(),
    price: getPrice(),
    loadOrder,
    loadDriverLocation
  };
};