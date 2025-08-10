import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface DriverEarnings {
  daily_earnings: number;
  weekly_earnings: number;
  monthly_earnings: number;
  total_earnings: number;
  commission_paid: number;
  net_earnings: number;
  rides_completed: number;
  deliveries_completed: number;
  marketplace_deliveries: number;
  average_rating: number;
  hours_online: number;
}

interface EarningsBreakdown {
  rides: { count: number; earnings: number };
  deliveries: { count: number; earnings: number };
  marketplace: { count: number; earnings: number };
  bonuses: { count: number; earnings: number };
  challenges: { count: number; earnings: number };
}

interface FinancialTransaction {
  id: string;
  type: 'earning' | 'commission' | 'bonus' | 'challenge_reward' | 'topup' | 'deduction';
  amount: number;
  description: string;
  reference_type: string;
  reference_id?: string;
  created_at: string;
  service_type?: string;
}

export const useDriverFinancials = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<DriverEarnings>({
    daily_earnings: 0,
    weekly_earnings: 0,
    monthly_earnings: 0,
    total_earnings: 0,
    commission_paid: 0,
    net_earnings: 0,
    rides_completed: 0,
    deliveries_completed: 0,
    marketplace_deliveries: 0,
    average_rating: 0,
    hours_online: 0
  });
  const [breakdown, setBreakdown] = useState<EarningsBreakdown>({
    rides: { count: 0, earnings: 0 },
    deliveries: { count: 0, earnings: 0 },
    marketplace: { count: 0, earnings: 0 },
    bonuses: { count: 0, earnings: 0 },
    challenges: { count: 0, earnings: 0 }
  });
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);

  // Load all financial data
  const loadFinancialData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get date ranges
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Load transport bookings earnings
      const { data: transportBookings } = await supabase
        .from('transport_bookings')
        .select('actual_price, created_at, completion_time')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .not('actual_price', 'is', null);

      // Load delivery orders earnings  
      const { data: deliveryOrders } = await supabase
        .from('delivery_orders')
        .select('actual_price, created_at, delivery_time')
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .not('actual_price', 'is', null);

      // Load marketplace assignments
      const { data: marketplaceAssignments } = await supabase
        .from('marketplace_delivery_assignments')
        .select('delivery_fee, created_at, actual_delivery_time')
        .eq('driver_id', user.id)
        .eq('assignment_status', 'delivered')
        .not('delivery_fee', 'is', null);

      // Load challenge rewards
      const { data: challengeRewards } = await supabase
        .from('challenge_rewards')
        .select('reward_value, created_at')
        .eq('driver_id', user.id);

      // Load driver credits balance
      const { data: creditData } = await supabase
        .from('driver_credits')
        .select('balance, total_earned, total_spent')
        .eq('driver_id', user.id)
        .single();

      // Load recent transactions
      const { data: creditTransactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Load driver rating
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', user.id);

      // Calculate earnings
      const calculatePeriodEarnings = (data: any[], dateField: string, startDate: Date) => {
        return data
          .filter(item => item[dateField] && new Date(item[dateField]) >= startDate)
          .reduce((sum, item) => sum + (parseFloat(String(item.actual_price || item.delivery_fee || 0))), 0);
      };

      const allTransportEarnings = (transportBookings || []).reduce((sum, booking) => sum + parseFloat(String(booking.actual_price || 0)), 0);
      const allDeliveryEarnings = (deliveryOrders || []).reduce((sum, order) => sum + parseFloat(String(order.actual_price || 0)), 0);
      const allMarketplaceEarnings = (marketplaceAssignments || []).reduce((sum, assignment) => sum + parseFloat(String(assignment.delivery_fee || 0)), 0);
      const allChallengeRewards = (challengeRewards || []).reduce((sum, reward) => sum + parseFloat(String(reward.reward_value || 0)), 0);

      const dailyTransport = calculatePeriodEarnings(transportBookings || [], 'completion_time', today);
      const dailyDelivery = calculatePeriodEarnings(deliveryOrders || [], 'delivery_time', today);
      const dailyMarketplace = calculatePeriodEarnings(marketplaceAssignments || [], 'actual_delivery_time', today);

      const weeklyTransport = calculatePeriodEarnings(transportBookings || [], 'completion_time', thisWeek);
      const weeklyDelivery = calculatePeriodEarnings(deliveryOrders || [], 'delivery_time', thisWeek);
      const weeklyMarketplace = calculatePeriodEarnings(marketplaceAssignments || [], 'actual_delivery_time', thisWeek);

      const monthlyTransport = calculatePeriodEarnings(transportBookings || [], 'completion_time', thisMonth);
      const monthlyDelivery = calculatePeriodEarnings(deliveryOrders || [], 'delivery_time', thisMonth);
      const monthlyMarketplace = calculatePeriodEarnings(marketplaceAssignments || [], 'actual_delivery_time', thisMonth);

      const totalGrossEarnings = allTransportEarnings + allDeliveryEarnings + allMarketplaceEarnings + allChallengeRewards;
      
      // Estimate commission (15% default)
      const estimatedCommission = totalGrossEarnings * 0.15;
      const netEarnings = totalGrossEarnings - estimatedCommission;

      // Calculate average rating
      const avgRating = ratings?.length 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      // Update earnings state
      setEarnings({
        daily_earnings: dailyTransport + dailyDelivery + dailyMarketplace,
        weekly_earnings: weeklyTransport + weeklyDelivery + weeklyMarketplace,
        monthly_earnings: monthlyTransport + monthlyDelivery + monthlyMarketplace,
        total_earnings: totalGrossEarnings,
        commission_paid: estimatedCommission,
        net_earnings: netEarnings,
        rides_completed: (transportBookings || []).length,
        deliveries_completed: (deliveryOrders || []).length,
        marketplace_deliveries: (marketplaceAssignments || []).length,
        average_rating: Math.round(avgRating * 10) / 10,
        hours_online: Math.floor(Math.random() * 8) + 6 // Mock data - would need real tracking
      });

      // Update breakdown
      setBreakdown({
        rides: { 
          count: (transportBookings || []).length, 
          earnings: allTransportEarnings 
        },
        deliveries: { 
          count: (deliveryOrders || []).length, 
          earnings: allDeliveryEarnings 
        },
        marketplace: { 
          count: (marketplaceAssignments || []).length, 
          earnings: allMarketplaceEarnings 
        },
        bonuses: { 
          count: 0, 
          earnings: 0 
        },
        challenges: { 
          count: (challengeRewards || []).length, 
          earnings: allChallengeRewards 
        }
      });

      // Update credit balance
      setCreditBalance(creditData?.balance || 0);

      // Format transactions
      const formattedTransactions = (creditTransactions || []).map(transaction => ({
        id: transaction.id,
        type: transaction.transaction_type === 'credit' ? 'earning' as const : 'deduction' as const,
        amount: parseFloat(String(transaction.amount)),
        description: transaction.description,
        reference_type: transaction.reference_type || 'system',
        reference_id: transaction.reference_id,
        created_at: transaction.created_at,
        service_type: transaction.reference_type
      }));

      setTransactions(formattedTransactions);

    } catch (error: any) {
      console.error('Error loading financial data:', error);
      toast.error('Erreur lors du chargement des données financières');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Top up credits
  const topUpCredits = useCallback(async (amount: number, paymentMethod: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.functions.invoke('wallet-topup', {
        body: {
          driverId: user.id,
          amount: amount,
          paymentMethod: paymentMethod,
          currency: 'CDF'
        }
      });

      if (error) {
        console.error('Top-up error:', error);
        toast.error('Erreur lors de la recharge');
        return false;
      }

      toast.success(`Recharge de ${amount.toLocaleString()} CDF effectuée`);
      
      // Reload financial data
      await loadFinancialData();
      
      return true;

    } catch (error: any) {
      console.error('Error during top-up:', error);
      toast.error('Erreur lors de la recharge');
      return false;
    }
  }, [user, loadFinancialData]);

  // Get earnings summary
  const getEarningsSummary = useCallback(() => {
    return {
      todayTarget: 15000, // 15,000 CDF daily target
      todayProgress: (earnings.daily_earnings / 15000) * 100,
      weeklyTarget: 100000, // 100,000 CDF weekly target  
      weeklyProgress: (earnings.weekly_earnings / 100000) * 100,
      monthlyTarget: 400000, // 400,000 CDF monthly target
      monthlyProgress: (earnings.monthly_earnings / 400000) * 100,
      efficiency: earnings.rides_completed > 0 ? earnings.total_earnings / earnings.rides_completed : 0
    };
  }, [earnings]);

  // Load data on mount and user change
  useEffect(() => {
    if (user) {
      loadFinancialData();
    }
  }, [user, loadFinancialData]);

  // Real-time updates for earnings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`driver-financials-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transport_bookings',
        filter: `driver_id=eq.${user.id}`
      }, () => {
        loadFinancialData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'delivery_orders',
        filter: `driver_id=eq.${user.id}`
      }, () => {
        loadFinancialData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenge_rewards',
        filter: `driver_id=eq.${user.id}`
      }, () => {
        loadFinancialData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFinancialData]);

  return {
    loading,
    earnings,
    breakdown,
    transactions,
    creditBalance,
    loadFinancialData,
    topUpCredits,
    getEarningsSummary
  };
};