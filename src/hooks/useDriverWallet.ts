import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  status: string;
  created_at: string;
}

export const useDriverWallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('CDF');

  useEffect(() => {
    if (!user) return;

    const fetchWalletData = async () => {
      try {
        setIsLoading(true);

        // Récupérer le wallet
        const { data: walletData, error: walletError } = await supabase
          .from('user_wallets')
          .select('balance, currency')
          .eq('user_id', user.id)
          .single();

        if (walletError) throw walletError;

        if (walletData) {
          setBalance(walletData.balance || 0);
          setCurrency(walletData.currency || 'CDF');
        }

        // Récupérer les transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('wallet_transactions')
          .select('id, amount, transaction_type, description, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (transactionsError) throw transactionsError;

        setTransactions(transactionsData || []);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [user]);

  return { balance, transactions, isLoading, currency };
};
