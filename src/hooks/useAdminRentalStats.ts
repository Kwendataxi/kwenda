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
      // Récupérer toutes les statistiques en parallèle
      const [
        vehiclesResult,
        pendingModerationResult,
        approvedVehiclesResult,
        activeVehiclesResult,
        subscriptionsResult,
        categoriesResult,
        bookingsResult,
        revenueResult,
        completedBookingsResult,
        pendingBookingsResult
      ] = await Promise.all([
        // Total véhicules
        supabase
          .from('partner_rental_vehicles')
          .select('id', { count: 'exact', head: true }),
        
        // Véhicules en modération
        supabase
          .from('partner_rental_vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('moderation_status', 'pending'),
        
        // Véhicules approuvés
        supabase
          .from('partner_rental_vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('moderation_status', 'approved'),
        
        // Véhicules actifs
        supabase
          .from('partner_rental_vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('moderation_status', 'approved'),
        
        // Abonnements actifs
        supabase
          .from('partner_rental_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        
        // Total catégories
        supabase
          .from('partner_rental_vehicle_categories')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        
        // Total réservations
        supabase
          .from('partner_rental_bookings')
          .select('id', { count: 'exact', head: true }),
        
        // Revenus totaux
        supabase
          .from('partner_rental_bookings')
          .select('total_price')
          .eq('status', 'completed'),
        
        // Réservations terminées
        supabase
          .from('partner_rental_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed'),
        
        // Réservations en attente
        supabase
          .from('partner_rental_bookings')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'confirmed'])
      ]);

      // Calculer le revenu total
      let totalRevenue = 0;
      if (revenueResult.data) {
        totalRevenue = revenueResult.data.reduce((sum, booking) => 
          sum + (parseFloat(booking.total_price?.toString() || '0') || 0), 0
        );
      }

      return {
        totalVehicles: vehiclesResult.count || 0,
        pendingModeration: pendingModerationResult.count || 0,
        approvedVehicles: approvedVehiclesResult.count || 0,
        activeVehicles: activeVehiclesResult.count || 0,
        activeSubscriptions: subscriptionsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        totalBookings: bookingsResult.count || 0,
        totalRevenue,
        completedBookings: completedBookingsResult.count || 0,
        pendingBookings: pendingBookingsResult.count || 0,
      };
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });
};