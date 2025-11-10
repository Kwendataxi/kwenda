import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { usePartnerEarnings } from './usePartnerEarnings';
import { usePartnerWithdrawals } from './usePartnerWithdrawals';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedFinances {
  // Wallet
  walletBalance: number;
  walletCurrency: string;
  
  // Earnings
  totalCommissions: number;
  totalTopups: number;
  totalAssignments: number;
  roi: number | null;
  
  // Withdrawals
  totalWithdrawn: number;
  pendingWithdrawals: number;
  availableForWithdrawal: number;
  
  // Computed
  netEarnings: number;
  loading: boolean;
}

/**
 * Hook unifié pour toutes les finances partenaire
 * Centralise: wallet, earnings, withdrawals
 */
export const useUnifiedPartnerFinances = (range: '7d' | '30d' | 'all' = '30d') => {
  const { user } = useAuth();
  const { data: earningsData, loading: earningsLoading } = usePartnerEarnings(range);
  const { stats: withdrawalStats, loading: withdrawalsLoading } = usePartnerWithdrawals();
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState('CDF');
  const [walletLoading, setWalletLoading] = useState(true);

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_wallets')
          .select('balance, currency')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setWalletBalance(data?.balance || 0);
        setWalletCurrency(data?.currency || 'CDF');
      } catch (error) {
        console.error('Error fetching wallet:', error);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchWallet();
  }, [user]);

  const loading = earningsLoading || withdrawalsLoading || walletLoading;

  const finances: UnifiedFinances = {
    walletBalance,
    walletCurrency,
    totalCommissions: earningsData?.totals.totalPartnerCommission || 0,
    totalTopups: earningsData?.totals.totalTopups || 0,
    totalAssignments: earningsData?.totals.totalAssignments || 0,
    roi: earningsData?.totals.roi || null,
    totalWithdrawn: withdrawalStats.totalPaid || 0,
    pendingWithdrawals: withdrawalStats.totalPending || 0,
    availableForWithdrawal: withdrawalStats.availableBalance || 0,
    netEarnings: (earningsData?.totals.totalPartnerCommission || 0) - (withdrawalStats.totalPaid || 0),
    loading
  };

  return finances;
};
