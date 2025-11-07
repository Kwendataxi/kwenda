/**
 * 💰 Wallet Moderne Chauffeur - Design identique app client mais contextualisé
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign,
  Gift,
  Car,
  Package
} from 'lucide-react';
import { EarningsChart } from './EarningsChart';
import { TransactionCard } from './TransactionCard';

interface WalletData {
  balance: number;
  ecosystem_credits: number;
  kwenda_points: number;
  todayEarnings: number;
}

interface ModernDriverWalletProps {
  serviceType: 'taxi' | 'delivery';
}

export const ModernDriverWallet = ({ serviceType }: ModernDriverWalletProps) => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    ecosystem_credits: 0,
    kwenda_points: 0,
    todayEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
    loadTransactions();
    
    // Écoute realtime pour updates du wallet
    const channel = supabase
      .channel('wallet-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_wallets',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        loadWalletData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadWalletData = async () => {
    if (!user) return;

    try {
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setWalletData({
          balance: wallet.balance || 0,
          ecosystem_credits: wallet.ecosystem_credits || 0,
          kwenda_points: wallet.kwenda_points || 0,
          todayEarnings: 0 // À calculer depuis les transactions du jour
        });
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setTransactions(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ServiceIcon = serviceType === 'taxi' ? Car : Package;
  const serviceColor = serviceType === 'taxi' ? 'blue' : 'green';

  return (
    <div className="space-y-6 pb-24">
      {/* Balance principale - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl border border-primary/20 p-6"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-${serviceColor}-500 to-${serviceColor}-600 flex items-center justify-center`}>
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">KwendaPay</p>
                <h3 className="text-xl font-bold text-foreground">
                  {serviceType === 'taxi' ? 'Chauffeur Taxi' : 'Livreur'}
                </h3>
              </div>
            </div>
            <ServiceIcon className={`w-8 h-8 text-${serviceColor}-500 opacity-30`} />
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Solde disponible</p>
            <h2 className="text-4xl font-bold text-foreground">
              {walletData.balance.toLocaleString()} <span className="text-2xl">CDF</span>
            </h2>
          </div>

          {/* Gains du jour */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Aujourd'hui:</span>
            <span className="font-semibold text-green-500">
              +{walletData.todayEarnings.toLocaleString()} CDF
            </span>
          </div>
        </div>
      </motion.div>

      {/* Crédits & Points */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-orange-500" />
              <p className="text-sm text-muted-foreground">Crédits Écosystème</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {walletData.ecosystem_credits}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <p className="text-sm text-muted-foreground">Kwenda Points</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {walletData.kwenda_points}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3">
        <Button className={`bg-gradient-to-r from-${serviceColor}-500 to-${serviceColor}-600 hover:from-${serviceColor}-600 hover:to-${serviceColor}-700`}>
          <ArrowDownLeft className="w-4 h-4 mr-2" />
          Recharger
        </Button>
        <Button variant="outline" className="border-2">
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Retirer
        </Button>
      </div>

      {/* Graphique des gains */}
      <EarningsChart serviceType={serviceType} />

      {/* Transactions récentes */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Transactions récentes
        </h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune transaction pour le moment
              </p>
            </Card>
          ) : (
            transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                serviceType={serviceType}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
