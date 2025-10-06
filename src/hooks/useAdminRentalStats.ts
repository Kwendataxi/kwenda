import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminRentalStats {
  totalVehicles: number;
  pendingModeration: number;
  approvedVehicles: number;
  activeVehicles: number;
  activeSubscriptions: number;
  totalCategories: number;
  totalBookings: number;
  totalRevenue: number;
  completedBookings: number;
  pendingBookings: number;
}

export const useAdminRentalStats = () => {
  return useQuery({
    queryKey: ['admin-rental-stats'],
    queryFn: async (): Promise<AdminRentalStats> => {
      // Utiliser les vues matérialisées pour de meilleures performances
      const [
        vehicleStatsResult,
        bookingStatsResult,
        subscriptionStatsResult,
        categoriesResult
      ] = await Promise.all([
        // Stats véhicules depuis vue matérialisée
        supabase
          .from('mv_admin_rental_vehicle_stats')
          .select('*')
          .single(),
        
        // Stats réservations depuis vue matérialisée
        supabase
          .from('mv_admin_rental_booking_stats')
          .select('*')
          .single(),
        
        // Stats abonnements depuis vue matérialisée
        supabase
          .from('mv_admin_rental_subscription_stats')
          .select('*')
          .single(),
        
        // Seulement les catégories actives (requête simple)
        supabase
          .from('partner_rental_vehicle_categories')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
      ]);

      // Extraire les données des vues matérialisées
      const vehicleStats = vehicleStatsResult.data || {
        total_vehicles: 0,
        pending_moderation: 0,
        approved_vehicles: 0,
        active_vehicles: 0
      };

      const bookingStats = bookingStatsResult.data || {
        total_bookings: 0,
        completed_bookings: 0,
        pending_bookings: 0,
        total_revenue: 0
      };

      const subscriptionStats = subscriptionStatsResult.data || {
        active_subscriptions: 0
      };

      return {
        totalVehicles: vehicleStats.total_vehicles,
        pendingModeration: vehicleStats.pending_moderation,
        approvedVehicles: vehicleStats.approved_vehicles,
        activeVehicles: vehicleStats.active_vehicles,
        activeSubscriptions: subscriptionStats.active_subscriptions,
        totalCategories: categoriesResult.count || 0,
        totalBookings: bookingStats.total_bookings,
        totalRevenue: Number(bookingStats.total_revenue) || 0,
        completedBookings: bookingStats.completed_bookings,
        pendingBookings: bookingStats.pending_bookings,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
    gcTime: 10 * 60 * 1000, // Garder en cache 10 minutes
    refetchInterval: 60000, // Actualiser toutes les minutes (au lieu de 30s)
    retry: 3, // Réessayer 3 fois en cas d'erreur
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponentiel
  });
};