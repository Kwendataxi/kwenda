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

interface TopUpResult {
  success: boolean;
  payment_url?: string;
  transaction_id?: string;
  message?: string;
  provider?: string;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWallet = async () => {
    if (!user) return;

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
      } else {
        setWallet(data);
      }
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
      toast.error('Erreur lors du chargement du portefeuille');
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

  const topUpWallet = async (amount: number, provider: string, phone: string): Promise<TopUpResult> => {
    if (!user) return { success: false, message: 'Utilisateur non connecté' };

    setLoading(true);
    
    try {
      console.log(`🚀 Début topup: ${amount} CDF via ${provider} pour ${phone}`);
      
      const { data, error } = await supabase.functions.invoke('wallet-topup', {
        body: {
          amount,
          provider,
          phone,
          currency: 'CDF'
        }
      });

      console.log('📨 Réponse de la fonction:', data);

      if (error) {
        console.error('❌ Erreur fonction:', error);
        throw error;
      }

      if (data.success) {
          console.log("====================================>",data.payment_url,provider);
        // Gestion spéciale pour Orange Money
        if (provider === 'orange') {
          // const ORANGE_CLIENT_ID="BMNAPyLHT5LPgLlgnRqGeesT702eumcF"
          // const ORANGE_CLIENT_SECRET="z0K8celqENZJiTZG"

          // const ORANGE_CLIENT_ID = Deno.env.get("ORANGE_CLIENT_ID")!;
          // const ORANGE_CLIENT_SECRET = Deno.env.get("ORANGE_CLIENT_SECRET")!;
          // // 1. Auth Orange
          // const tokenRes = await fetch("https://api.orange.com/oauth/v3/token", {
          //   method: "POST",
          //   headers: {
          //     "Authorization": "Basic " + btoa(`${ORANGE_CLIENT_ID}:${ORANGE_CLIENT_SECRET}`),
          //     "Content-Type": "application/x-www-form-urlencoded",
          //   },
          //   body: "grant_type=client_credentials",
          // });

          // const tokenData = await tokenRes.json();
          // console.log("connexion orange token ==========> ",tokenData);
          // if (!tokenRes.ok) throw new Error("Orange Auth failed: " + JSON.stringify(tokenData));
          // const accessToken = tokenData.access_token;

          console.log('🍊 Redirection Orange Money vers:', data.payment_url);
          toast.info('Redirection vers Orange Money...');
          
          // Ouvrir l'URL de paiement dans un nouvel onglet
          window.open(data.payment_url, '_blank');
          
          return {
            success: true,
            payment_url: data.payment_url,
            transaction_id: data.transaction_id,
            message: data.message || 'Veuillez compléter le paiement Orange Money',
            provider: 'orange'
          };
        } else {
          // Autres providers (Airtel, M-Pesa)
          console.log('✅ Paiement réussi:', data.message);
          toast.success(data.message || 'Recharge effectuée avec succès');
          
          // Rafraîchir les données
          await fetchWallet();
          await fetchTransactions();
          
          return {
            success: true,
            message: data.message
          };
        }
      } else {
        throw new Error(data.error || 'Échec de la recharge');
      }

    } catch (error: any) {
      console.error('💥 Erreur topup:', error);
      const errorMessage = error.message || 'Erreur lors de la recharge';
      toast.error(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
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

  // Fonction pour vérifier le statut d'un paiement Orange Money
  const checkOrangePaymentStatus = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) throw error;

      if (data.status === 'completed') {
        toast.success('Paiement Orange Money confirmé');
        await fetchWallet();
        await fetchTransactions();
        return true;
      } else if (data.status === 'failed') {
        toast.error('Paiement Orange Money échoué');
        return false;
      }

      return false; // Still pending
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  useEffect(() => {
    if (wallet) {
      fetchTransactions();
    }
  }, [wallet]);

  return {
    wallet,
    transactions,
    loading,
    fetchWallet,
    fetchTransactions,
    topUpWallet,
    transferFunds,
    checkOrangePaymentStatus
  };
};