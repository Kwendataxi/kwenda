import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useWalletPayment } from './useWalletPayment';

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
  const { payWithWallet } = useWalletPayment();

  const createRentalBooking = useCallback(async (data: RentalBookingData) => {
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
        .in('status', ['confirmed', 'pending', 'approved_by_partner', 'in_progress'])
        .or(`and(start_date.lte.${data.end_date},end_date.gte.${data.start_date})`);

      if (checkError) throw checkError;

      if (conflictingBookings && conflictingBookings.length > 0) {
        toast.error('Ce véhicule n\'est pas disponible pour ces dates');
        return null;
      }

      // Calculer l'acompte (30% par défaut)
      const depositPercentage = 30;
      const depositAmount = Math.round(data.total_price * (depositPercentage / 100));
      const remainingAmount = data.total_price - depositAmount;

      // Créer la réservation avec les champs d'acompte
      const { data: booking, error } = await supabase
        .from('rental_bookings')
        .insert([{
          user_id: user.id,
          vehicle_id: data.vehicle_id,
          start_date: data.start_date,
          end_date: data.end_date,
          total_amount: data.total_price,
          pickup_location: data.pickup_location,
          return_location: data.dropoff_location,
          special_requests: data.special_requests,
          status: 'pending',
          payment_status: 'pending',
          deposit_amount: depositAmount,
          deposit_percentage: depositPercentage,
          remaining_amount: remainingAmount,
          deposit_paid: false
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
  }, []);

  const getUserRentalBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

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
          deposit_amount,
          deposit_paid,
          deposit_paid_at,
          deposit_percentage,
          remaining_amount,
          rental_vehicles (
            id,
            brand,
            model,
            year,
            daily_rate,
            images
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapper les colonnes pour compatibilité
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
  }, []);

  const cancelRentalBooking = useCallback(async (bookingId: string, reason?: string) => {
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
  }, []);

  // Paiement de l'acompte (30%)
  const payRentalDeposit = useCallback(async (
    bookingId: string, 
    depositAmount: number, 
    method: 'wallet' | 'mobile_money' = 'wallet'
  ): Promise<boolean> => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      if (method === 'mobile_money') {
        toast.info('Le paiement Mobile Money sera bientôt disponible');
        return false;
      }

      // Paiement via wallet
      const paymentResult = await payWithWallet(
        user.id,
        depositAmount,
        `Acompte location véhicule - ${bookingId.slice(0, 8)}`,
        'rental_deposit',
        bookingId
      );

      if (!paymentResult.success) {
        return false;
      }

      // Mettre à jour la réservation avec l'acompte payé
      const { data: updatedBooking, error } = await supabase
        .from('rental_bookings')
        .update({
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString(),
          status: 'confirmed'
        } as any)
        .eq('id', bookingId)
        .select('*, rental_vehicles(brand, model, partner_id)')
        .single();

      if (error) throw error;

      // Notifier le partenaire
      const booking = updatedBooking as any;
      if (booking?.rental_vehicles?.partner_id) {
        const { data: partnerData } = await supabase
          .from('partenaires')
          .select('user_id')
          .eq('id', booking.rental_vehicles.partner_id)
          .single();

        if (partnerData?.user_id) {
          await supabase.from('order_notifications').insert({
            user_id: partnerData.user_id,
            order_id: bookingId,
            title: '💰 Acompte reçu !',
            message: `Le client a versé l'acompte de ${depositAmount.toLocaleString()} CDF pour le ${booking.rental_vehicles.brand} ${booking.rental_vehicles.model}. Réservation confirmée !`,
            notification_type: 'rental_deposit',
            is_read: false,
            metadata: {
              booking_id: bookingId,
              deposit_amount: depositAmount,
              vehicle_name: `${booking.rental_vehicles.brand} ${booking.rental_vehicles.model}`
            }
          });
        }
      }

      toast.success('Acompte payé ! Votre réservation est confirmée.');
      return true;
    } catch (error) {
      console.error('Erreur paiement acompte:', error);
      toast.error('Erreur lors du paiement de l\'acompte');
      return false;
    } finally {
      setLoading(false);
    }
  }, [payWithWallet]);

  // Paiement intégral (ancienne méthode, conservée pour compatibilité)
  const payRentalBooking = useCallback(async (bookingId: string, amount: number): Promise<boolean> => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Vous devez être connecté');
        return false;
      }

      const paymentResult = await payWithWallet(
        user.id,
        amount,
        `Location véhicule - Réservation ${bookingId.slice(0, 8)}`,
        'rental_booking',
        bookingId
      );

      if (!paymentResult.success) {
        return false;
      }

      const { data: updatedBooking, error } = await supabase
        .from('rental_bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          deposit_paid: true,
          deposit_paid_at: new Date().toISOString()
        } as any)
        .eq('id', bookingId)
        .select('*, rental_vehicles(brand, model, partner_id)')
        .single();

      if (error) throw error;

      const booking = updatedBooking as any;
      if (booking?.rental_vehicles?.partner_id) {
        const { data: partnerData } = await supabase
          .from('partenaires')
          .select('user_id')
          .eq('id', booking.rental_vehicles.partner_id)
          .single();

        if (partnerData?.user_id) {
          await supabase.from('order_notifications').insert({
            user_id: partnerData.user_id,
            order_id: bookingId,
            title: '💰 Paiement reçu !',
            message: `Le client a payé ${amount.toLocaleString()} CDF pour la location du ${booking.rental_vehicles.brand} ${booking.rental_vehicles.model}. Vous pouvez démarrer la location !`,
            notification_type: 'rental_payment',
            is_read: false,
            metadata: {
              booking_id: bookingId,
              amount: amount,
              vehicle_name: `${booking.rental_vehicles.brand} ${booking.rental_vehicles.model}`
            }
          });
        }
      }

      toast.success('Paiement effectué ! La location est confirmée.');
      return true;
    } catch (error) {
      console.error('Erreur paiement location:', error);
      toast.error('Erreur lors du paiement');
      return false;
    } finally {
      setLoading(false);
    }
  }, [payWithWallet]);

  const cleanupOldBookings = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('rental_bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: 'Expirée automatiquement - date dépassée'
        })
        .in('status', ['pending', 'approved_by_partner'])
        .lt('start_date', today);

      await supabase
        .from('rental_bookings')
        .update({ payment_status: 'paid' })
        .eq('status', 'completed')
        .eq('payment_status', 'pending');

    } catch (error) {
      console.error('Erreur nettoyage:', error);
    }
  }, []);

  return {
    loading,
    createRentalBooking,
    getUserRentalBookings,
    cancelRentalBooking,
    payRentalBooking,
    payRentalDeposit,
    cleanupOldBookings
  };
};
