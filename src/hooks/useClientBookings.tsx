import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTransportBooking } from './useTransportBooking';
import { toast } from 'sonner';

interface BookingStatus {
  id: string;
  status: string;
  driver_id?: string;
  pickup_location: string;
  destination: string;
  estimated_price: number;
  actual_price?: number;
  created_at: string;
  driver_name?: string;
  driver_rating?: number;
}

export const useClientBookings = () => {
  const [loading, setLoading] = useState(false);
  const [activeBooking, setActiveBooking] = useState<BookingStatus | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingStatus[]>([]);
  const { user } = useAuth();
  const { createBooking, processPayment } = useTransportBooking();

  // Listen for booking status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('client-bookings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedBooking = payload.new as any;
          if (updatedBooking.status === 'accepted') {
            toast.success('Votre course a été acceptée !');
            loadActiveBooking();
          } else if (updatedBooking.status === 'driver_arrived') {
            toast.info('Votre chauffeur est arrivé');
            loadActiveBooking();
          } else if (updatedBooking.status === 'completed') {
            toast.success('Course terminée avec succès');
            setActiveBooking(null);
            loadBookingHistory();
          } else if (updatedBooking.status === 'cancelled') {
            toast.error('Course annulée');
            setActiveBooking(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load active booking
  const loadActiveBooking = async () => {
    if (!user) return;

    try {
      const { data: booking, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'accepted', 'driver_arrived', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (booking) {
        setActiveBooking({
          id: booking.id,
          status: booking.status,
          driver_id: booking.driver_id,
          pickup_location: booking.pickup_location,
          destination: booking.destination,
          estimated_price: booking.estimated_price || 0,
          actual_price: booking.actual_price,
          created_at: booking.created_at,
          driver_name: 'Chauffeur', // Would get from profiles
          driver_rating: 4.8
        });
      } else {
        setActiveBooking(null);
      }

    } catch (error: any) {
      console.error('Error loading active booking:', error);
    }
  };

  // Load booking history
  const loadBookingHistory = async () => {
    if (!user) return;

    try {
      const { data: bookings, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completion_time', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedHistory = bookings?.map(booking => ({
        id: booking.id,
        status: booking.status,
        driver_id: booking.driver_id,
        pickup_location: booking.pickup_location,
        destination: booking.destination,
        estimated_price: booking.estimated_price || 0,
        actual_price: booking.actual_price || 0,
        created_at: booking.created_at,
        driver_name: 'Chauffeur',
        driver_rating: 4.8
      })) || [];

      setBookingHistory(formattedHistory);

    } catch (error: any) {
      console.error('Error loading booking history:', error);
    }
  };

  // Create new booking
  const createNewBooking = async (bookingData: {
    pickupLocation: string;
    destination: string;
    pickupCoordinates?: { lat: number; lng: number };
    destinationCoordinates?: { lat: number; lng: number };
    vehicleType: string;
    estimatedPrice: number;
  }) => {
    setLoading(true);
    try {
      const booking = await createBooking(bookingData);
      if (booking) {
        setActiveBooking({
          id: booking.id,
          status: booking.status,
          pickup_location: booking.pickup_location,
          destination: booking.destination,
          estimated_price: booking.estimated_price || 0,
          created_at: booking.created_at
        });
        toast.success('Recherche de chauffeur en cours...');
        return booking;
      }
      return null;
    } catch (error) {
      toast.error('Erreur lors de la création de la réservation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      setActiveBooking(null);
      toast.success('Course annulée');
      return true;

    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Process payment for booking
  const payForBooking = async (bookingId: string, paymentMethod: 'wallet' | 'mobile_money', paymentData?: any) => {
    setLoading(true);
    try {
      const success = await processPayment(bookingId, paymentMethod, paymentData);
      if (success) {
        toast.success('Paiement effectué avec succès');
        loadActiveBooking();
      }
      return success;
    } catch (error) {
      toast.error('Erreur lors du paiement');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadActiveBooking();
      loadBookingHistory();
    }
  }, [user]);

  return {
    loading,
    activeBooking,
    bookingHistory,
    createNewBooking,
    cancelBooking,
    payForBooking,
    loadActiveBooking,
    loadBookingHistory
  };
};