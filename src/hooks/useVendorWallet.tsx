import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VendorWallet {
  id: string;
  vendor_id: string;
  balance: number;
  currency: string;
  total_earned: number;
  total_withdrawn: number;
  last_withdrawal_date?: string;
  is_active: boolean;
}

interface VendorTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  reference_id?: string;
  reference_type?: string;
  status: string;
  created_at: string;
}

interface WithdrawalRequest {
  amount: number;
  withdrawal_method: 'orange_money' | 'm_pesa' | 'airtel_money';
  phone_number: string;
}

export const useVendorWallet = () => {
  const [wallet, setWallet] = useState<VendorWallet | null>(null);
  const [transactions, setTransactions] = useState<VendorTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const { toast } = useToast();

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Créer ou récupérer le wallet vendeur
      let { data: wallet, error } = await supabase
        .from('vendor_wallets')
        .select('*')
        .eq('vendor_id', user.id)
        .eq('currency', 'CDF')
        .single();

      if (error && error.code === 'PGRST116') {
        // Créer le wallet s'il n'existe pas
        const { data: newWallet, error: createError } = await supabase
          .from('vendor_wallets')
          .insert({
            vendor_id: user.id,
            balance: 0,
            currency: 'CDF'
          })
          .select()
          .single();

        if (createError) throw createError;
        wallet = newWallet;
      } else if (error) {
        throw error;
      }

      setWallet(wallet);
    } catch (error) {
      console.error('Erreur lors du chargement du wallet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre wallet Kwenda Marchand",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vendor_wallet_transactions')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  };

  const requestWithdrawal = async (withdrawal: WithdrawalRequest) => {
    try {
      setWithdrawing(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !wallet) {
        throw new Error('Utilisateur non connecté ou wallet non trouvé');
      }

      if (withdrawal.amount > wallet.balance) {
        throw new Error('Solde insuffisant');
      }

      // Calculer les frais (2% par défaut)
      const feesAmount = withdrawal.amount * 0.02;
      const netAmount = withdrawal.amount - feesAmount;

      const { data, error } = await supabase
        .from('vendor_withdrawals')
        .insert({
          vendor_id: user.id,
          wallet_id: wallet.id,
          amount: withdrawal.amount,
          currency: 'CDF',
          withdrawal_method: withdrawal.withdrawal_method,
          phone_number: withdrawal.phone_number,
          fees_amount: feesAmount,
          net_amount: netAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Demande de retrait envoyée",
        description: `Votre demande de retrait de ${withdrawal.amount.toLocaleString()} CDF est en cours de traitement`
      });

      // Rafraîchir les données
      await fetchWallet();
      await fetchTransactions();

      return data;
    } catch (error: any) {
      console.error('Erreur lors de la demande de retrait:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter votre demande de retrait",
        variant: "destructive"
      });
      throw error;
    } finally {
      setWithdrawing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount).replace('CDF', 'CDF');
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  return {
    wallet,
    transactions,
    loading,
    withdrawing,
    requestWithdrawal,
    formatAmount,
    refetch: () => {
      fetchWallet();
      fetchTransactions();
    }
  };
};