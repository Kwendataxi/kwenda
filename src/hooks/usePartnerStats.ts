import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PartnerStats {
  activeDrivers: number;
  ongoingRides: number;
  completedRides: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalFleet: number;
  availableVehicles: number;
  driversTrend: number;
  revenueTrend: number;
}

export const usePartnerStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Get partner ID
        const { data: partnerData } = await supabase
          .from('partenaires')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!partnerData) {
          setStats(null);
          setLoading(false);
          return;
        }

        // Get driver IDs
        const { data: drivers } = await supabase
          .from('partner_drivers')
          .select('driver_id')
          .eq('partner_id', partnerData.id);

        const driverIds = drivers?.map(d => d.driver_id) || [];

        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        let realStats: PartnerStats = {
          activeDrivers: 0,
          ongoingRides: 0,
          completedRides: 0,
          todayRevenue: 0,
          monthlyRevenue: 0,
          totalFleet: driverIds.length,
          availableVehicles: 0,
          driversTrend: 0,
          revenueTrend: 0
        };

        if (driverIds.length > 0) {
          // Active drivers today
          const { data: activeDriversData } = await supabase
            .from('driver_locations')
            .select('driver_id')
            .in('driver_id', driverIds)
            .eq('is_available', true)
            .gte('last_updated', new Date(Date.now() - 30 * 60 * 1000).toISOString());

          realStats.activeDrivers = new Set(activeDriversData?.map(d => d.driver_id) || []).size;

          // Ongoing rides
          const { count: ongoingCount } = await supabase
            .from('transport_bookings')
            .select('*', { count: 'exact', head: true })
            .in('driver_id', driverIds)
            .in('status', ['driver_assigned', 'driver_arrived', 'trip_started']);

          realStats.ongoingRides = ongoingCount || 0;

          // Completed rides this month
          const { count: completedCount } = await supabase
            .from('transport_bookings')
            .select('*', { count: 'exact', head: true })
            .in('driver_id', driverIds)
            .eq('status', 'completed')
            .gte('created_at', monthStart.toISOString());

          realStats.completedRides = completedCount || 0;

          // Today's revenue
          const { data: todayBookings } = await supabase
            .from('transport_bookings')
            .select('actual_price, estimated_price')
            .in('driver_id', driverIds)
            .eq('status', 'completed')
            .gte('created_at', todayStart.toISOString());

          realStats.todayRevenue = todayBookings?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;

          // Monthly revenue
          const { data: monthlyBookings } = await supabase
            .from('transport_bookings')
            .select('actual_price, estimated_price')
            .in('driver_id', driverIds)
            .eq('status', 'completed')
            .gte('created_at', monthStart.toISOString());

          realStats.monthlyRevenue = monthlyBookings?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;

          // Last month revenue for trend
          const { data: lastMonthBookings } = await supabase
            .from('transport_bookings')
            .select('actual_price, estimated_price')
            .in('driver_id', driverIds)
            .eq('status', 'completed')
            .gte('created_at', lastMonthStart.toISOString())
            .lte('created_at', lastMonthEnd.toISOString());

          const lastMonthRevenue = lastMonthBookings?.reduce((sum, b) => sum + (b.actual_price || b.estimated_price || 0), 0) || 0;

          // Calculate revenue trend
          if (lastMonthRevenue > 0) {
            realStats.revenueTrend = Number((((realStats.monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
          }

          // Last month drivers count for trend
          const lastMonthDriverCount = driverIds.length; // Simplified - could track historical data
          if (lastMonthDriverCount > 0) {
            realStats.driversTrend = Number((((driverIds.length - lastMonthDriverCount) / lastMonthDriverCount) * 100).toFixed(1));
          }

          // Available vehicles (drivers not currently on ride)
          realStats.availableVehicles = driverIds.length - realStats.ongoingRides;
        }

        setStats(realStats);
      } catch (error) {
        console.error('Error fetching partner stats:', error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return { stats, loading };
};