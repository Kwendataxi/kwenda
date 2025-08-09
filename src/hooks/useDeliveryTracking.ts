import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DriverLocation {
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  updated_at?: string;
}

export interface DeliveryOrder {
  id: string;
  user_id: string;
  driver_id: string | null;
  status: string | null;
  delivery_type: string; // keep loose to match DB types
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any; // JSON from DB
  delivery_coordinates: any; // JSON from DB
  estimated_price: number | null;
  actual_price: number | null;
  created_at: string;
  delivery_time: string | null;
}

export interface UserProfileMinimal {
  display_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
}

export const useDeliveryTracking = (orderId: string) => {
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<UserProfileMinimal | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<UserProfileMinimal | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helpers
  const statusLabel = useMemo(() => {
    switch (order?.status) {
      case 'pending':
        return 'En attente de ramassage';
      case 'accepted':
        return 'Livreur assigné';
      case 'picked_up':
        return 'Colis récupéré';
      case 'en_route':
        return 'En cours de livraison';
      case 'delivered':
        return 'Livré';
      case 'cancelled':
        return 'Annulé';
      default:
        return order?.status || 'En préparation';
    }
  }, [order?.status]);

  const price = useMemo(() => {
    const p = order?.actual_price ?? order?.estimated_price;
    return typeof p === 'number' ? Math.round(p) : null;
  }, [order?.actual_price, order?.estimated_price]);

  const packageType = useMemo(() => {
    // Si le type précis n'existe pas, déduire depuis delivery_type
    if (!order) return '';
    if (order.delivery_type === 'flash') return 'Petit colis';
    if (order.delivery_type === 'flex') return 'Colis standard';
    return 'Gros colis';
  }, [order]);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const { data: o, error: oe } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('id', orderId)
          .single();
        if (oe) throw oe;
        if (!isMounted) return;
        setOrder(o as DeliveryOrder);

        // Recipient profile
        const { data: rp } = await supabase
          .from('profiles')
          .select('display_name, phone_number, avatar_url')
          .eq('user_id', (o as any).user_id)
          .maybeSingle();
        if (isMounted) setRecipientProfile(rp as UserProfileMinimal);

        // Driver profile + phone
        if ((o as any).driver_id) {
          const driverId = (o as any).driver_id as string;
          const { data: dp } = await supabase
            .from('profiles')
            .select('display_name, phone_number, avatar_url')
            .eq('user_id', driverId)
            .maybeSingle();
          if (isMounted) setDriverProfile(dp as UserProfileMinimal);
        }
      } catch (e: any) {
        console.error('Delivery tracking init error:', e);
        if (isMounted) setError(e.message || 'Erreur de chargement');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Realtime: order updates
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`delivery-order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'delivery_orders', filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(payload.new as DeliveryOrder);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Realtime: driver live location
  useEffect(() => {
    if (!order?.driver_id) return;

    const channel = supabase
      .channel(`driver-location-${order.driver_id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'driver_locations', filter: `driver_id=eq.${order.driver_id}` },
        (payload) => {
          const d = payload.new as any;
          setDriverLocation({
            lat: Number(d.latitude),
            lng: Number(d.longitude),
            speed: d.speed,
            heading: d.heading,
            updated_at: d.updated_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.driver_id]);

  return {
    order,
    loading,
    error,
    driverProfile,
    recipientProfile,
    driverLocation,
    statusLabel,
    price,
    packageType,
  };
};
