import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

interface TransactionData {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  status: string;
  balance_before: number;
  balance_after: number;
  payment_method?: string;
  reference_id?: string;
  reference_type?: string;
  user_id: string;
  wallet_id: string;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const fetchWallet = async (retryCount = 0) => {
    // Guards stricts pour éviter les appels prématurés
    if (!user?.id || authLoading) {
      setLoading(false);
      return;
    }

    // Éviter les doubles appels
    if (loading && retryCount === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    console.log(`🔄 [Wallet] Tentative ${retryCount + 1} - User ID: ${user.id}`);

    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', 'CDF')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create wallet if it doesn't exist
        console.log('Creating new wallet for user:', user.id);
        const { data: newWallet, error: createError } = await supabase
          .from('user_wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            currency: 'CDF',
            is_active: true
          })
          .select()
          .single();

        if (createError) throw createError;
        setWallet(newWallet);
        console.log('Wallet created:', newWallet);
      } else {
        setWallet(data);
        console.log('Wallet loaded:', data);
      }
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
      setError(error.message || 'Erreur lors du chargement du portefeuille');
      
      // Retry logic
      if (retryCount < 2) {
        console.log(`Retrying wallet fetch (${retryCount + 1}/3)...`);
        setTimeout(() => fetchWallet(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      toast.error('Erreur lors du chargement du portefeuille');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const fetchTransactions = async () => {
    if (!user || !wallet) return;

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Erreur lors du chargement des transactions');
    }
  };

  const topUpWallet = async (amount: number, provider: string, phone: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('wallet-topup', {
        body: {
          amount,
          provider,
          phone,
          currency: 'CDF'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Recharge effectuée avec succès');
        await fetchWallet();
        await fetchTransactions();
        return true;
      } else {
        throw new Error(data.error || 'Échec de la recharge');
      }
    } catch (error: any) {
      console.error('Top-up error:', error);
      toast.error(error.message || 'Erreur lors de la recharge');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const transferFunds = async (recipientId: string, amount: number, description: string) => {
    if (!user || !wallet) return false;

    if (wallet.balance < amount) {
      toast.error('Solde insuffisant');
      return false;
    }

    setLoading(true);
    try {
      // In a real implementation, this would be handled by an edge function
      // For now, we'll create the transaction records directly
      const currentBalance = wallet.balance;
      const newBalance = currentBalance - amount;

      // Update sender wallet
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          transaction_type: 'debit',
          amount: amount,
          currency: 'CDF',
          description: description,
          balance_before: currentBalance,
          balance_after: newBalance,
          reference_type: 'transfer',
          reference_id: recipientId,
          status: 'completed'
        });

      if (transactionError) throw transactionError;

      toast.success('Transfert effectué avec succès');
      await fetchWallet();
      await fetchTransactions();
      return true;
    } catch (error: any) {
      console.error('Transfer error:', error);
      toast.error('Erreur lors du transfert');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!authLoading) {
      if (user?.id) {
        // Petit délai pour éviter les race conditions
        timeoutId = setTimeout(() => {
          fetchWallet();
        }, 100);
      } else {
        setLoading(false);
        setInitialized(true);
        setWallet(null);
        setTransactions([]);
        setError(null);
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (wallet && !loading) {
      fetchTransactions();
    }
  }, [wallet]);

  return {
    wallet,
    transactions,
    loading: loading || authLoading,
    error,
    initialized,
    fetchWallet,
    fetchTransactions,
    topUpWallet,
    transferFunds
  };
};