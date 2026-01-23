import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DailyStats {
  todayCourses: number;
  todayEarnings: number;
  activeOrders: number;
  rating: number;
}

/**
 * Hook pour récupérer les statistiques du jour du chauffeur
 * Optimisé pour le header avec refresh toutes les 30s
 */
export const useDriverDailyStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats>({
    todayCourses: 0,
    todayEarnings: 0,
    activeOrders: 0,
    rating: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDailyStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Compter courses du jour (completed)
      const { count: coursesCount } = await supabase
        .from('transport_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .gte('created_at', today.toISOString())
        .eq('status', 'completed');

      // Calculer gains du jour
      const { data: completedRides } = await supabase
        .from('transport_bookings')
        .select('actual_price')
        .eq('driver_id', user.id)
        .gte('completion_time', today.toISOString())
        .eq('status', 'completed');

      const totalEarnings = completedRides?.reduce((sum, ride) => sum + (ride.actual_price || 0), 0) || 0;

      // Compter commandes actives (assigned, picked_up, in_transit)
      const { count: activeCount } = await supabase
        .from('transport_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', user.id)
        .in('status', ['assigned', 'picked_up', 'in_transit']);

      // Récupérer note moyenne (limitée aux 50 dernières notes)
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const averageRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      setStats({
        todayCourses: coursesCount || 0,
        todayEarnings: Math.round(totalEarnings),
        activeOrders: activeCount || 0,
        rating: Math.round(averageRating * 10) / 10
      });

    } catch (error) {
      console.error('❌ Erreur chargement stats du jour:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyStats();

    // Refresh toutes les 30 secondes pour le header
    const interval = setInterval(fetchDailyStats, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return { stats, loading, refetch: fetchDailyStats };
};
