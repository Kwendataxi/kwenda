import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ActiveBooking {
  id: string;
  user_id: string;
  pickup_location: string;
  destination: string;
  estimated_price?: number;
  status: 'pending' | 'dispatching' | 'accepted' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled' | 'no_drivers_available';
  user_name?: string;
  user_rating?: number;
}

export const useDriverRideOffers = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<ActiveBooking[]>([]);
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const driverId = user?.id;

  const loadActiveRide = async () => {
    if (!driverId) return;
    const { data } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('assigned_driver_id', driverId)
      .in('status', ['accepted', 'driver_arrived', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActiveBooking({
        id: data.id,
        user_id: data.user_id,
        pickup_location: data.pickup_location,
        destination: data.destination,
        estimated_price: data.surge_price ?? data.estimated_price,
        status: data.status as ActiveBooking['status'],
      });
    } else {
      setActiveBooking(null);
    }
  };

  const loadPendingOffers = async () => {
    if (!driverId) return;
    // Get pending, non-expired offers for this driver
    const nowIso = new Date().toISOString();
    const { data: offers, error } = await supabase
      .from('ride_offers')
      .select('ride_request_id, expires_at, status, created_at')
      .eq('driver_id', driverId)
      .eq('status', 'pending');

    if (error) {
      console.warn('Failed to load ride_offers:', error);
      return;
    }

    const validOffers = (offers || []).filter(o => !o.expires_at || o.expires_at > nowIso);
    const ids = validOffers.map(o => o.ride_request_id);
    if (ids.length === 0) {
      setPendingRequests([]);
      return;
    }

    const { data: requests } = await supabase
      .from('ride_requests')
      .select('id, user_id, pickup_location, destination, estimated_price, surge_price, status')
      .in('id', ids);

    const mapped: ActiveBooking[] = (requests || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      pickup_location: r.pickup_location,
      destination: r.destination,
      estimated_price: r.surge_price ?? r.estimated_price,
      status: r.status as ActiveBooking['status'],
    }));

    setPendingRequests(mapped);
  };

  const acceptBooking = async (rideRequestId: string) => {
    if (!driverId) return;
    const { data, error } = await supabase.functions.invoke('ride-dispatcher', {
      body: {
        action: 'assign_driver',
        rideRequestId,
        driverId,
      }
    });

    if (error) {
      toast.error("Impossible d'accepter la course");
      console.error(error);
      return;
    }

    toast.success('Course acceptée');
    await loadActiveRide();
    await loadPendingOffers();
  };

  const updateBookingStatus = async (status: ActiveBooking['status']) => {
    if (!activeBooking) return;
    const { error } = await supabase.functions.invoke('ride-dispatcher', {
      body: {
        action: 'update_status',
        rideRequestId: activeBooking.id,
        status,
      }
    });

    if (error) {
      toast.error('Mise à jour échouée');
      return;
    }

    if (status === 'completed' || status === 'cancelled') {
      setActiveBooking(null);
    } else {
      setActiveBooking({ ...activeBooking, status });
    }
  };

  useEffect(() => {
    if (!driverId) return;
    setLoading(true);
    Promise.all([loadPendingOffers(), loadActiveRide()]).finally(() => setLoading(false));

    const channel = supabase
      .channel('ride_offers_driver_' + driverId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ride_offers',
        filter: `driver_id=eq.${driverId}`,
      }, () => {
        loadPendingOffers();
      })
      .subscribe();

    const rideChannel = supabase
      .channel('ride_requests_driver_' + driverId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ride_requests',
        filter: `assigned_driver_id=eq.${driverId}`,
      }, () => loadActiveRide())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(rideChannel);
    };
  }, [driverId]);

  return {
    loading,
    activeBooking,
    pendingRequests,
    acceptBooking,
    updateBookingStatus,
  } as const;
};
