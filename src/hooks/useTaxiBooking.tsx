import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TaxiBookingData {
  pickup_location: string;
  destination: string;
  pickup_coordinates: { lat: number; lng: number };
  destination_coordinates: { lat: number; lng: number };
  vehicle_class: string;
  estimated_price: number;
}

interface Booking {
  id: string;
  pickup_location: string;
  destination: string;
  estimated_price: number;
  status: string;
  created_at: string;
  driver_id?: string;
}

export const useTaxiBooking = () => {
  const [loading, setLoading] = useState(false);

  const createBooking = async (booking: TaxiBookingData): Promise<string | null> => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté pour réserver');
        return null;
      }

      // Détecter la ville depuis les coordonnées
      const city = 'Kinshasa'; // À améliorer avec géocodage

      const { data, error } = await supabase
        .from('transport_bookings')
        .insert({
          pickup_location: booking.pickup_location,
          destination: booking.destination,
          pickup_coordinates: booking.pickup_coordinates,
          delivery_coordinates: booking.destination_coordinates,
          vehicle_type: booking.vehicle_class,
          estimated_price: booking.estimated_price,
          city: city,
          status: 'pending'
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Log l'activité
      await supabase.from('activity_logs').insert({
        activity_type: 'taxi_booking_created',
        description: 'Nouvelle réservation taxi créée',
        metadata: { booking_id: data.id, user_id: user.id }
      });

      return data.id;
    } catch (error: any) {
      console.error('Erreur création réservation:', error);
      const errorMessage = error.message?.includes('location')
        ? 'Adresse invalide ou hors zone de service. Vérifiez votre localisation.'
        : error.message?.includes('wallet')
        ? 'Solde insuffisant. Rechargez votre portefeuille KwendaPay.'
        : error.message?.includes('no drivers')
        ? 'Aucun chauffeur disponible dans votre zone. Réessayez dans quelques minutes.'
        : 'Impossible de créer la réservation. Vérifiez votre connexion.';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedPrice = async (
    pickup: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    vehicleClass: string
  ): Promise<number> => {
    // Calcul de distance (formule Haversine)
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((destination.lat - pickup.lat) * Math.PI) / 180;
    const dLng = ((destination.lng - pickup.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickup.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Tarification par défaut
    const basePrice = vehicleClass === 'vip' ? 5000 : vehicleClass === 'premium' ? 3000 : 2000;
    const pricePerKm = vehicleClass === 'vip' ? 800 : vehicleClass === 'premium' ? 500 : 300;
    
    return Math.round(basePrice + distance * pricePerKm);
  };

  const getUserBookings = async (): Promise<Booking[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur récupération réservations:', error);
      return [];
    }
  };

  return {
    loading,
    createBooking,
    getEstimatedPrice,
    getUserBookings
  };
};
