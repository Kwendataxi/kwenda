import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface CommissionData {
  id: string;
  driver_id: string;
  booking_id: string;
  service_type: 'transport' | 'delivery';
  commission_rate: number;
  commission_amount: number;
  booking_amount: number;
  currency: string;
  created_at: string;
  driver_name?: string;
}

interface DailyCommission {
  date: string;
  total_amount: number;
  total_bookings: number;
  transport_amount: number;
  delivery_amount: number;
}

interface DriverCommissionSummary {
  driver_id: string;
  driver_name: string;
  total_commission: number;
  total_bookings: number;
  average_rate: number;
  last_booking: string;
}

interface CommissionStats {
  totalEarned: number;
  todayEarnings: number;
  monthlyEarnings: number;
  totalBookings: number;
  averageCommissionRate: number;
}

export const usePartnerCommissions = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [dailyCommissions, setDailyCommissions] = useState<DailyCommission[]>([]);
  const [driverSummaries, setDriverSummaries] = useState<DriverCommissionSummary[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    totalEarned: 0,
    todayEarnings: 0,
    monthlyEarnings: 0,
    totalBookings: 0,
    averageCommissionRate: 0
  });

  const fetchCommissions = async (limit = 50) => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch commission tracking data
      const { data: commissionData, error } = await supabase
        .from('partner_commission_tracking')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching commissions:', error);
        return;
      }

      if (!commissionData) {
        setCommissions([]);
        return;
      }

      // Get driver names
      const driverIds = [...new Set(commissionData.map(c => c.driver_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', driverIds);

      const profiles = profilesData || [];

      const formattedCommissions: CommissionData[] = commissionData.map(commission => ({
        ...commission,
        service_type: commission.service_type as 'transport' | 'delivery',
        driver_name: profiles.find(p => p.user_id === commission.driver_id)?.display_name || 'Chauffeur inconnu'
      }));

      setCommissions(formattedCommissions);

      // Calculate stats
      const today = new Date().toDateString();
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const totalEarned = formattedCommissions.reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const todayEarnings = formattedCommissions
        .filter(c => new Date(c.created_at).toDateString() === today)
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const monthlyEarnings = formattedCommissions
        .filter(c => new Date(c.created_at) >= monthStart)
        .reduce((sum, c) => sum + Number(c.commission_amount), 0);
      const averageCommissionRate = formattedCommissions.length > 0
        ? formattedCommissions.reduce((sum, c) => sum + Number(c.commission_rate), 0) / formattedCommissions.length
        : 0;

      setStats({
        totalEarned,
        todayEarnings,
        monthlyEarnings,
        totalBookings: formattedCommissions.length,
        averageCommissionRate
      });

      // Calculate daily commissions for last 30 days
      const dailyMap = new Map<string, DailyCommission>();
      formattedCommissions.forEach(commission => {
        const date = new Date(commission.created_at).toDateString();
        const existing = dailyMap.get(date) || {
          date,
          total_amount: 0,
          total_bookings: 0,
          transport_amount: 0,
          delivery_amount: 0
        };

        existing.total_amount += Number(commission.commission_amount);
        existing.total_bookings += 1;
        
        if (commission.service_type === 'transport') {
          existing.transport_amount += Number(commission.commission_amount);
        } else {
          existing.delivery_amount += Number(commission.commission_amount);
        }

        dailyMap.set(date, existing);
      });

      setDailyCommissions(Array.from(dailyMap.values()).slice(0, 30));

      // Calculate driver summaries
      const driverMap = new Map<string, DriverCommissionSummary>();
      formattedCommissions.forEach(commission => {
        const existing = driverMap.get(commission.driver_id) || {
          driver_id: commission.driver_id,
          driver_name: commission.driver_name || 'Chauffeur inconnu',
          total_commission: 0,
          total_bookings: 0,
          average_rate: 0,
          last_booking: commission.created_at
        };

        existing.total_commission += Number(commission.commission_amount);
        existing.total_bookings += 1;
        
        if (new Date(commission.created_at) > new Date(existing.last_booking)) {
          existing.last_booking = commission.created_at;
        }

        driverMap.set(commission.driver_id, existing);
      });

      // Calculate average rates
      driverMap.forEach((summary, driverId) => {
        const driverCommissions = formattedCommissions.filter(c => c.driver_id === driverId);
        summary.average_rate = driverCommissions.length > 0
          ? driverCommissions.reduce((sum, c) => sum + Number(c.commission_rate), 0) / driverCommissions.length
          : 0;
      });

      setDriverSummaries(Array.from(driverMap.values()));

    } catch (error) {
      console.error('Error in fetchCommissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCommissionsByDateRange = async (startDate: Date, endDate: Date) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('partner_commission_tracking')
        .select('*')
        .eq('partner_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching commissions by date range:', error);
        return [];
      }

      if (!data) return [];

      // Get driver names
      const driverIds = [...new Set(data.map(c => c.driver_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', driverIds);

      const profiles = profilesData || [];

      return data.map(commission => ({
        ...commission,
        service_type: commission.service_type as 'transport' | 'delivery',
        driver_name: profiles.find(p => p.user_id === commission.driver_id)?.display_name || 'Chauffeur inconnu'
      }));
    } catch (error) {
      console.error('Error in getCommissionsByDateRange:', error);
      return [];
    }
  };

  const getDriverCommissions = async (driverId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('partner_commission_tracking')
        .select('*')
        .eq('partner_id', user.id)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching driver commissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getDriverCommissions:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchCommissions();
      
      // Refresh every 5 minutes
      const interval = setInterval(() => fetchCommissions(), 300000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Real-time subscription for new commissions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('partner-commissions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'partner_commission_tracking',
          filter: `partner_id=eq.${user.id}`
        },
        () => {
          fetchCommissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    loading,
    commissions,
    dailyCommissions,
    driverSummaries,
    stats,
    refreshCommissions: fetchCommissions,
    getCommissionsByDateRange,
    getDriverCommissions
  };
};