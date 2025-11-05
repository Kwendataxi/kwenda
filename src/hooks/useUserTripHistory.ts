import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TripDestination {
  id: string;
  destination: string;
  destination_coordinates: { lat: number; lng: number };
  frequency: number;
  last_visit: string;
}

interface TripHistory {
  destinations: TripDestination[];
  isLoading: boolean;
  error: Error | null;
}

export const useUserTripHistory = (): TripHistory => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-trip-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('transport_bookings')
        .select('id, destination, destination_coordinates, created_at')
        .eq('user_id', user.id)
        .in('status', ['completed', 'confirmed'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Grouper par destination et calculer la fréquence
      const destinationMap = new Map<string, TripDestination>();

      data?.forEach((booking) => {
        if (!booking.destination || !booking.destination_coordinates) return;

        // Type assertion pour les coordonnées
        const coords = booking.destination_coordinates as unknown as { lat: number; lng: number };
        
        const key = `${booking.destination}-${coords.lat}-${coords.lng}`;
        
        if (destinationMap.has(key)) {
          const existing = destinationMap.get(key)!;
          destinationMap.set(key, {
            ...existing,
            frequency: existing.frequency + 1,
            last_visit: booking.created_at > existing.last_visit ? booking.created_at : existing.last_visit
          });
        } else {
          destinationMap.set(key, {
            id: booking.id,
            destination: booking.destination,
            destination_coordinates: coords,
            frequency: 1,
            last_visit: booking.created_at
          });
        }
      });

      // Convertir en tableau et trier par fréquence puis par date
      return Array.from(destinationMap.values())
        .sort((a, b) => {
          if (b.frequency !== a.frequency) {
            return b.frequency - a.frequency;
          }
          return new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
        })
        .slice(0, 10);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000
  });

  return {
    destinations: data || [],
    isLoading,
    error: error as Error | null
  };
};
