import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';


interface BookingData {
  pickupLocation: string;
  destination: string;
  pickupCoordinates?: { lat: number; lng: number };
  destinationCoordinates?: { lat: number; lng: number };
  intermediateStops?: Array<{
    address: string;
    coordinates?: { lat: number; lng: number } | null;
  }>;
  vehicleType: string;
  estimatedPrice: number;
  totalDistance?: number;
  surgeMultiplier?: number;
  pickupTime?: string;
}

interface DriverMatch {
  driver_id: string;
  distance: number;
  estimated_arrival: number;
  driver_profile: {
    user_id: string;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_plate: string;
    rating_average: number;
    rating_count: number;
  };
}

export const useEnhancedTransportBooking = () => {
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const { user } = useAuth();

  const createBooking = async (data: BookingData) => {
    if (!user) {
      toast.error('Vous devez être connecté pour réserver');
      return null;
    }

    setLoading(true);
    try {
      const { data: pricingRules, error: pricingError } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('vehicle_class', data.vehicleType)
        .eq('is_active', true)
        .maybeSingle();

      if (pricingError) {
        console.warn('Could not fetch pricing rules:', pricingError);
      }

      let finalPrice = data.estimatedPrice;
      if (pricingRules && data.totalDistance) {
        finalPrice = pricingRules.base_price + 
          (data.totalDistance * pricingRules.price_per_km) +
          (data.totalDistance * 5 * pricingRules.price_per_minute);
        finalPrice *= (data.surgeMultiplier || 1.0);
      }

      const { data: booking, error } = await supabase
        .from('transport_bookings')
        .insert({
          user_id: user.id,
          pickup_location: data.pickupLocation,
          destination: data.destination,
          pickup_coordinates: data.pickupCoordinates,
          destination_coordinates: data.destinationCoordinates,
          intermediate_stops: data.intermediateStops || [],
          vehicle_type: data.vehicleType,
          estimated_price: Math.round(finalPrice),
          total_distance: data.totalDistance,
          surge_multiplier: data.surgeMultiplier || 1.0,
          pickup_time: data.pickupTime || new Date().toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Réservation créée avec succès');
      
      // Utiliser l'Edge Function ride-dispatcher pour l'assignation automatique
      triggerRideDispatch(booking.id, data.pickupCoordinates);
      
      return booking;
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(error.message || 'Erreur lors de la réservation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Utiliser l'Edge Function ride-dispatcher pour la recherche et assignation automatique
  const triggerRideDispatch = async (bookingId: string, pickupCoordinates?: { lat: number; lng: number }) => {
    if (!pickupCoordinates) {
      toast.error('Coordonnées de collecte manquantes');
      return;
    }

    setMatching(true);
    
    try {
      console.log('🚗 Déclenchement ride-dispatcher pour:', bookingId);
      
      const { data, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          rideRequestId: bookingId,
          pickupLat: pickupCoordinates.lat,
          pickupLng: pickupCoordinates.lng,
          serviceType: 'taxi',
          vehicleClass: 'standard'
        }
      });

      if (error) {
        console.error('Erreur Edge Function:', error);
        throw error;
      }

      console.log('✅ Résultat ride-dispatcher:', data);

      if (data.success && data.driver) {
        toast.success(`Chauffeur assigné ! Distance: ${data.driver.distance?.toFixed(1)}km`);
      } else {
        toast.error(data.message || 'Aucun chauffeur disponible dans la zone');
      }

    } catch (error: any) {
      console.error('Erreur recherche de chauffeurs:', error);
      toast.error('Erreur lors de la recherche de chauffeurs');
    } finally {
      setMatching(false);
    }
  };

  const findNearbyDrivers = async (
    bookingId: string, 
    pickupCoordinates?: { lat: number; lng: number }
  ) => {
    // Redirige vers triggerRideDispatch pour compatibilité
    triggerRideDispatch(bookingId, pickupCoordinates);
    return [];
  };

  const assignDriverToBooking = async (bookingId: string, driverId: string) => {
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({
          driver_id: driverId,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      await supabase
        .from('driver_locations')
        .update({
          is_available: false,
          updated_at: new Date().toISOString()
        })
        .eq('driver_id', driverId);

      return true;
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      return false;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getUserBookings = async () => {
    if (!user) return [];

    try {
      const { data: bookings, error } = await supabase
        .from('transport_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bookingsWithDrivers = bookings?.filter(b => b.driver_id) || [];
      const driverIds = bookingsWithDrivers.map(b => b.driver_id);
      
      let driverProfiles: any[] = [];
      if (driverIds.length > 0) {
        const { data } = await supabase
          .from('driver_profiles')
          .select('user_id, vehicle_make, vehicle_model, vehicle_plate, rating_average, rating_count')
          .in('user_id', driverIds);
        driverProfiles = data || [];
      }

      const enrichedBookings = (bookings || []).map(booking => ({
        ...booking,
        driver_profile: booking.driver_id 
          ? driverProfiles.find(p => p.user_id === booking.driver_id)
          : null
      }));

      return enrichedBookings;
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast.error('Erreur lors du chargement des réservations');
      return [];
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      toast.success('Réservation annulée');
      return true;
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      toast.error('Erreur lors de l\'annulation');
      return false;
    }
  };

  return {
    loading,
    matching,
    createBooking,
    findNearbyDrivers,
    getUserBookings,
    cancelBooking,
    triggerRideDispatch
  };
};
