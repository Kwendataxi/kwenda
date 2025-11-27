import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RentalBookingData {
  vehicle_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  pickup_location?: string;
  dropoff_location?: string;
  special_requests?: string;
}

export const useRentalBookings = () => {
  const [loading, setLoading] = useState(false);

  const createRentalBooking = async (data: RentalBookingData) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return null;
      }

      // Vérifier disponibilité du véhicule
      const { data: conflictingBookings, error: checkError } = await supabase
        .from('rental_bookings')
        .select('id')
        .eq('vehicle_id', data.vehicle_id)
        .in('status', ['confirmed', 'pending'])
        .or(`and(start_date.lte.${data.end_date},end_date.gte.${data.start_date})`);

      if (checkError) throw checkError;

      if (conflictingBookings && conflictingBookings.length > 0) {
        toast.error('Ce véhicule n\'est pas disponible pour ces dates');
        return null;
      }

      // Créer la réservation
      const { data: booking, error } = await supabase
        .from('rental_bookings')
        .insert([{
          vehicle_id: data.vehicle_id,
          start_date: data.start_date,
          end_date: data.end_date,
          total_price: data.total_price,
          pickup_location: data.pickup_location,
          dropoff_location: data.dropoff_location,
          special_requests: data.special_requests,
          status: 'pending',
          payment_status: 'pending'
        }] as any)
        .select()
        .single();

      if (error) throw error;

      toast.success('Réservation créée avec succès');
      return booking;
    } catch (error) {
      console.error('Erreur création réservation:', error);
      toast.error('Erreur lors de la réservation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserRentalBookings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('rental_bookings')
        .select(`
          id,
          start_date,
          end_date,
          total_amount,
          status,
          payment_status,
          pickup_location,
          return_location,
          special_requests,
          created_at,
          rental_vehicles (
            id,
            brand,
            model,
            year,
            daily_rate
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapper les colonnes pour compatibilité avec le composant
      return (data || []).map(booking => ({
        ...booking,
        total_price: booking.total_amount,
        dropoff_location: booking.return_location
      }));
    } catch (error) {
      console.error('Erreur récupération réservations:', error);
      toast.error('Impossible de charger les réservations');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const cancelRentalBooking = async (bookingId: string, reason?: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('rental_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Réservation annulée');
      return true;
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createRentalBooking,
    getUserRentalBookings,
    cancelRentalBooking
  };
};
