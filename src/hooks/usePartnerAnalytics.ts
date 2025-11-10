import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUnifiedPartnerFinances } from './useUnifiedPartnerFinances';

interface WeeklyPerformance {
  day: string;
  rides: number;
  revenue: number;
  efficiency: number;
}

interface TopDriver {
  name: string;
  rides: number;
  rating: number;
  revenue: number;
}

export const usePartnerAnalytics = () => {
  const { user } = useAuth();
  const finances = useUnifiedPartnerFinances('30d');

  return useQuery({
    queryKey: ['partner-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Récupérer l'ID du partenaire
      const { data: partnerData } = await supabase
        .from('partenaires')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partnerData) return null;

      // Statistiques des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Nombre total de courses (via chauffeurs liés)
      const { data: drivers } = await supabase
        .from('partner_drivers')
        .select('driver_id')
        .eq('partner_id', partnerData.id);

      const driverIds = drivers?.map(d => d.driver_id) || [];

      let totalRides = 0;
      if (driverIds.length > 0) {
        // Compter les courses VTC
        const { count: vtcCount } = await supabase
          .from('transport_bookings')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds)
          .eq('status', 'completed')
          .gte('created_at', thirtyDaysAgo.toISOString());

        // Compter les livraisons
        const { count: deliveryCount } = await supabase
          .from('delivery_orders')
          .select('*', { count: 'exact', head: true })
          .in('driver_id', driverIds)
          .eq('status', 'delivered')
          .gte('created_at', thirtyDaysAgo.toISOString());

        totalRides = (vtcCount || 0) + (deliveryCount || 0);
      }

      // Revenus du mois
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyRevenue } = await supabase
        .from('activity_logs')
        .select('amount')
        .eq('user_id', user.id)
        .in('activity_type', ['commission_received', 'subscription_payment_received'])
        .gte('created_at', firstDayOfMonth.toISOString());

      const totalRevenue = monthlyRevenue?.reduce(
        (sum, log) => sum + Number(log.amount || 0),
        0
      ) || 0;

      // Calculer performance hebdomadaire depuis DB
      const today = new Date();
      const weeklyPerformance: WeeklyPerformance[] = [];
      const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      
      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() - i);
        dayDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(dayDate);
        nextDay.setDate(dayDate.getDate() + 1);

        if (driverIds.length > 0) {
          const { count: dayRides } = await supabase
            .from('transport_bookings')
            .select('*', { count: 'exact', head: true })
            .in('driver_id', driverIds)
            .eq('status', 'completed')
            .gte('created_at', dayDate.toISOString())
            .lt('created_at', nextDay.toISOString());

          const { data: dayRevenue } = await supabase
            .from('transport_bookings')
            .select('actual_price, estimated_price')
            .in('driver_id', driverIds)
            .eq('status', 'completed')
            .gte('created_at', dayDate.toISOString())
            .lt('created_at', nextDay.toISOString());

          const revenue = dayRevenue?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;
          const rides = dayRides || 0;
          const efficiency = rides > 0 ? Math.min(100, Math.round((rides / 20) * 100)) : 0;

          weeklyPerformance.push({
            day: daysOfWeek[dayDate.getDay()],
            rides,
            revenue,
            efficiency
          });
        } else {
          weeklyPerformance.push({
            day: daysOfWeek[dayDate.getDay()],
            rides: 0,
            revenue: 0,
            efficiency: 0
          });
        }
      }

      // Top drivers du mois
      const topDrivers: TopDriver[] = [];
      if (driverIds.length > 0) {
        for (const driverId of driverIds.slice(0, 5)) {
          const { data: driverProfile } = await supabase
            .from('driver_profiles')
            .select('rating_average')
            .eq('user_id', driverId)
            .maybeSingle();

          const { count: driverRides } = await supabase
            .from('transport_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', driverId)
            .eq('status', 'completed')
            .gte('created_at', firstDayOfMonth.toISOString());

          const { data: driverRevenue } = await supabase
            .from('transport_bookings')
            .select('actual_price, estimated_price')
            .eq('driver_id', driverId)
            .eq('status', 'completed')
            .gte('created_at', firstDayOfMonth.toISOString());

          const revenue = driverRevenue?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;

          if (driverProfile && (driverRides || 0) > 0) {
            topDrivers.push({
              name: `Chauffeur ${driverId.substring(0, 8)}`,
              rides: driverRides || 0,
              rating: driverProfile.rating_average || 0,
              revenue
            });
          }
        }
        topDrivers.sort((a, b) => b.revenue - a.revenue);
      }

      // Satisfaction moyenne depuis driver profiles
      if (driverIds.length > 0) {
        const { data: driverRatings } = await supabase
          .from('driver_profiles')
          .select('rating_average')
          .in('user_id', driverIds);

        const satisfactionScore = driverRatings && driverRatings.length > 0
          ? driverRatings.reduce((sum, d) => sum + (d.rating_average || 0), 0) / driverRatings.length
          : 4.8;

        return {
          totalRides,
          totalRevenue,
          satisfactionScore: Number(satisfactionScore.toFixed(1)),
          period: '30 derniers jours',
          weeklyPerformance,
          topDrivers,
          finances
        };
      }

      return {
        totalRides: 0,
        totalRevenue: 0,
        satisfactionScore: 4.8,
        period: '30 derniers jours',
        weeklyPerformance: [],
        topDrivers: [],
        finances
      };
    },
    enabled: !!user?.id,
  });
};
