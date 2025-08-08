import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface DriverWallet {
  driver_id: string;
  driver_name: string;
  driver_code: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  last_topup_date?: string;
  is_active: boolean;
  commission_rate: number;
}

interface TopUpHistory {
  id: string;
  driver_id: string;
  driver_name: string;
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  balance_after: number;
}

export const useDriverWalletManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<DriverWallet[]>([]);
  const [topUpHistory, setTopUpHistory] = useState<TopUpHistory[]>([]);

  const fetchDriverWallets = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get partner drivers with their wallet information
      const { data: partnerDrivers, error: driversError } = await supabase
        .from('partner_drivers')
        .select(`
          driver_id,
          driver_code,
          commission_rate,
          status
        `)
        .eq('partner_id', user.id)
        .eq('status', 'active');

      if (driversError) {
        console.error('Error fetching partner drivers:', driversError);
        return;
      }

      if (!partnerDrivers) {
        setDrivers([]);
        return;
      }

      // Get profiles and driver credits separately
      const driverIds = partnerDrivers.map(pd => pd.driver_id);
      
      const [profilesResult, creditsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', driverIds),
        supabase
          .from('driver_credits')
          .select('*')
          .in('driver_id', driverIds)
      ]);

      const profiles = profilesResult.data || [];
      const credits = creditsResult.data || [];

      const formattedDrivers: DriverWallet[] = partnerDrivers.map(pd => {
        const profile = profiles.find(p => p.user_id === pd.driver_id);
        const credit = credits.find(c => c.driver_id === pd.driver_id);
        
        return {
          driver_id: pd.driver_id,
          driver_name: profile?.display_name || 'Chauffeur inconnu',
          driver_code: pd.driver_code,
          balance: credit?.balance || 0,
          total_earned: credit?.total_earned || 0,
          total_spent: credit?.total_spent || 0,
          last_topup_date: credit?.last_topup_date,
          is_active: credit?.is_active || false,
          commission_rate: pd.commission_rate
        };
      });

      setDrivers(formattedDrivers);

    } catch (error) {
      console.error('Error in fetchDriverWallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopUpHistory = async (limit = 20) => {
    if (!user) return;

    try {
      // Get partner drivers' IDs
      const { data: partnerDrivers, error: driversError } = await supabase
        .from('partner_drivers')
        .select('driver_id')
        .eq('partner_id', user.id)
        .eq('status', 'active');

      if (driversError || !partnerDrivers) {
        console.error('Error fetching partner drivers for history:', driversError);
        return;
      }

      const driverIds = partnerDrivers.map(pd => pd.driver_id);

      if (driverIds.length === 0) return;

      // Get top-up transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .in('driver_id', driverIds)
        .eq('transaction_type', 'credit')
        .eq('reference_type', 'partner_topup')
        .eq('reference_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (transactionsError) {
        console.error('Error fetching top-up history:', transactionsError);
        return;
      }

      if (!transactions) {
        setTopUpHistory([]);
        return;
      }

      // Get profiles for driver names
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', transactions.map(t => t.driver_id));

      const profiles = profilesData || [];

      const formattedHistory: TopUpHistory[] = transactions.map(t => {
        const profile = profiles.find(p => p.user_id === t.driver_id);
        return {
          id: t.id,
          driver_id: t.driver_id,
          driver_name: profile?.display_name || 'Chauffeur inconnu',
          amount: t.amount,
          currency: t.currency,
          description: t.description,
          created_at: t.created_at,
          balance_after: t.balance_after
        };
      });

      setTopUpHistory(formattedHistory);

    } catch (error) {
      console.error('Error in fetchTopUpHistory:', error);
    }
  };

  const topUpDriverWallet = async (
    driverId: string,
    amount: number,
    paymentMethod: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('partner-driver-wallet-topup', {
        body: {
          driverId,
          amount,
          paymentMethod
        }
      });

      if (error) {
        console.error('Error topping up driver wallet:', error);
        toast({
          title: "Erreur",
          description: "Impossible de recharger le portefeuille",
          variant: "destructive",
        });
        return false;
      }

      if (data.error) {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Succès",
        description: `Portefeuille rechargé avec ${amount} CDF`,
      });

      // Refresh data
      fetchDriverWallets();
      fetchTopUpHistory();
      return true;

    } catch (error) {
      console.error('Error in topUpDriverWallet:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDriverStats = () => {
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.is_active).length;
    const totalBalance = drivers.reduce((sum, d) => sum + d.balance, 0);
    const lowBalanceDrivers = drivers.filter(d => d.balance < 5000).length; // Less than 5000 CDF

    return {
      totalDrivers,
      activeDrivers,
      totalBalance,
      lowBalanceDrivers
    };
  };

  useEffect(() => {
    if (user) {
      fetchDriverWallets();
      fetchTopUpHistory();
      
      // Refresh every 2 minutes
      const interval = setInterval(() => {
        fetchDriverWallets();
        fetchTopUpHistory();
      }, 120000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Real-time subscription for credit changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('driver-credits-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_credits'
        },
        () => {
          fetchDriverWallets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_transactions',
          filter: `reference_type=eq.partner_topup AND reference_id=eq.${user.id}`
        },
        () => {
          fetchTopUpHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    loading,
    drivers,
    topUpHistory,
    topUpDriverWallet,
    refreshData: () => {
      fetchDriverWallets();
      fetchTopUpHistory();
    },
    getDriverStats
  };
};