import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { callEdgeFunction, EDGE_FUNCTIONS } from '@/utils/edgeFunctionConfig';

interface BookingData {
  pickupLocation: string;
  destination: string;
  pickupCoordinates: { lat: number; lng: number };
  destinationCoordinates: { lat: number; lng: number };
  vehicleType: string;
  estimatedPrice: number;
  city?: string;
  pickupTime?: string;
}

interface SearchProgress {
  radius: number;
  driversFound: number;
  status: 'idle' | 'searching' | 'found' | 'failed';
}

interface AssignedDriver {
  driver_id: string;
  distance_km: number;
  score: number;
  driver_name?: string;
  driver_avatar?: string;
  rating_average?: number;
  total_rides?: number;
}

export const useRideDispatch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [assignedDriver, setAssignedDriver] = useState<AssignedDriver | null>(null);
  const [searchProgress, setSearchProgress] = useState<SearchProgress>({
    radius: 5,
    driversFound: 0,
    status: 'idle'
  });
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const createAndDispatchRide = async (bookingData: BookingData) => {
    try {
      setIsSearching(true);
      setSearchProgress({ radius: 5, driversFound: 0, status: 'searching' });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🚗 [RideDispatch] Creating booking...');

      // 1. Créer le booking dans transport_bookings
      const { data: booking, error: bookingError } = await supabase
        .from('transport_bookings')
        .insert([{
          user_id: user.id,
          pickup_location: bookingData.pickupLocation,
          destination: bookingData.destination,
          pickup_latitude: bookingData.pickupCoordinates.lat,
          pickup_longitude: bookingData.pickupCoordinates.lng,
          destination_latitude: bookingData.destinationCoordinates.lat,
          destination_longitude: bookingData.destinationCoordinates.lng,
          vehicle_type: bookingData.vehicleType,
          estimated_price: bookingData.estimatedPrice,
          city: bookingData.city || 'Kinshasa',
          pickup_time: bookingData.pickupTime || new Date().toISOString(),
          status: 'pending',
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (bookingError) throw bookingError;

      console.log('✅ [RideDispatch] Booking created:', booking.id);
      setActiveBookingId(booking.id);

      // 2. Déclencher le dispatching automatiquement avec smart retry
      console.log('📡 [RideDispatch] Calling ride-dispatcher...');
      
      const dispatchResult = await dispatchWithRetry(booking, bookingData, 1);

      console.log('📡 [RideDispatch] Dispatch result:', dispatchResult);

      if (dispatchResult.success && dispatchResult.driver) {
        console.log('✅ [RideDispatch] Driver assigned:', dispatchResult.driver.driver_id);
        
        setSearchProgress({
          radius: 10,
          driversFound: 1,
          status: 'found'
        });

        return {
          success: true,
          booking,
          driver: dispatchResult.driver,
          message: 'Chauffeur trouvé avec succès'
        };
      } else {
        setSearchProgress(prev => ({ ...prev, status: 'failed' }));
        
        return {
          success: false,
          booking,
          message: dispatchResult.message || 'Aucun chauffeur disponible'
        };
      }
    } catch (error) {
      console.error('❌ [RideDispatch] Error:', error);
      setSearchProgress(prev => ({ ...prev, status: 'failed' }));
      
      throw error;
    } finally {
      setIsSearching(false);
    }
  };

  const listenForDriverAssignment = (bookingId: string) => {
    console.log('👂 [RideDispatch] Listening for driver assignment on booking:', bookingId);
    
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transport_bookings',
          filter: `id=eq.${bookingId}`
        },
        async (payload) => {
          console.log('🔄 [RideDispatch] Booking updated:', payload.new);
          
          if (payload.new.driver_id && payload.new.status === 'driver_assigned') {
            // Fetch driver details
            const { data: driverProfile, error: profileError } = await supabase
              .from('chauffeurs')
              .select('*')
              .eq('id', payload.new.driver_id)
              .single();

            if (!profileError && driverProfile) {
              setAssignedDriver({
                driver_id: payload.new.driver_id,
                distance_km: 0,
                score: 0,
                driver_name: (driverProfile as any).nom_complet || (driverProfile as any).full_name,
                driver_avatar: (driverProfile as any).photo_profil || (driverProfile as any).avatar_url,
                rating_average: (driverProfile as any).moyenne_notes || (driverProfile as any).rating_average,
                total_rides: (driverProfile as any).nombre_courses_total || (driverProfile as any).total_rides
              });

              setSearchProgress(prev => ({ ...prev, status: 'found' }));
              setIsSearching(false);

              toast.success('🎉 Chauffeur assigné !', {
                description: (driverProfile as any).nom_complet || (driverProfile as any).full_name || 'Votre chauffeur arrive'
              });
            } else {
              setAssignedDriver({
                driver_id: payload.new.driver_id,
                distance_km: 0,
                score: 0
              });
              
              setSearchProgress(prev => ({ ...prev, status: 'found' }));
              setIsSearching(false);

              toast.success('🎉 Chauffeur assigné !', {
                description: 'Votre chauffeur arrive'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('👋 [RideDispatch] Unsubscribing from booking updates');
      supabase.removeChannel(channel);
    };
  };

  // ⚡ PHASE 3: Smart Retry avec Backoff Exponentiel
  const dispatchWithRetry = async (
    booking: any,
    bookingData: BookingData,
    attempt: number = 1
  ): Promise<any> => {
    const maxAttempts = 3;
    const radius = 5 + (attempt - 1) * 5; // 5km, 10km, 15km
    const priority = attempt >= 2 ? 'high' : 'normal';
    
    console.log(`🔄 [RideDispatch] Dispatch attempt ${attempt}/${maxAttempts} (radius: ${radius}km, priority: ${priority})`);

    try {
      const result = await callEdgeFunction('ride-dispatcher', {
        bookingId: booking.id,
        pickupLat: bookingData.pickupCoordinates.lat,
        pickupLng: bookingData.pickupCoordinates.lng,
        serviceType: bookingData.vehicleType,
        vehicleClass: bookingData.vehicleType,
        city: bookingData.city || 'Kinshasa',
        searchRadius: radius,
        priority
      });

      // Succès ou dernière tentative
      if (result.success || attempt >= maxAttempts) {
        return result;
      }

      // Échec mais tentatives restantes - Backoff exponentiel
      const backoffTime = 2000 * attempt; // 2s, 4s, 6s
      console.log(`⏳ [RideDispatch] Retry in ${backoffTime}ms...`);
      
      setSearchProgress({
        radius,
        driversFound: result.driversFound || 0,
        status: 'searching'
      });

      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      return await dispatchWithRetry(booking, bookingData, attempt + 1);
    } catch (error) {
      console.error(`❌ [RideDispatch] Attempt ${attempt} failed:`, error);
      
      if (attempt >= maxAttempts) {
        throw error;
      }
      
      const backoffTime = 2000 * attempt;
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return await dispatchWithRetry(booking, bookingData, attempt + 1);
    }
  };

  const resetSearch = () => {
    setIsSearching(false);
    setAssignedDriver(null);
    setSearchProgress({ radius: 5, driversFound: 0, status: 'idle' });
    setActiveBookingId(null);
  };

  return {
    isSearching,
    assignedDriver,
    searchProgress,
    activeBookingId,
    createAndDispatchRide,
    listenForDriverAssignment,
    resetSearch
  };
};
