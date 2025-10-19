import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePartnerAnalytics = () => {
  const { user } = useAuth();

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

      // Satisfaction client (simulée)
      const satisfactionScore = 4.8;

      return {
        totalRides,
        totalRevenue,
        satisfactionScore,
        period: '30 derniers jours',
      };
    },
    enabled: !!user?.id,
  });
};
