import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  TrendingUp, 
  Download, 
  Upload,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { TransactionRow } from '../shared/TransactionRow';

interface ModernPartnerWalletProps {
  balance?: number;
  currency?: string;
  totalEarnings?: number;
  pendingWithdrawals?: number;
}

export const ModernPartnerWallet = ({
  balance = 2450000,
  currency = 'CDF',
  totalEarnings = 12500000,
  pendingWithdrawals = 0
}: ModernPartnerWalletProps) => {
  const [activeTab, setActiveTab] = useState('transactions');

  // Mock transactions data
  const transactions = [
    {
      id: '1',
      type: 'commission' as const,
      amount: 45000,
      currency: 'CDF',
      status: 'active' as const,
      description: 'Commission course #12345',
      date: '15 Jan 2025',
      reference: 'COM-12345',
      relatedTo: {
        type: 'ride' as const,
        name: 'Jean Mukendi'
      }
    },
    {
      id: '2',
      type: 'subscription' as const,
      amount: 50000,
      currency: 'CDF',
      status: 'active' as const,
      description: 'Abonnement chauffeur mensuel',
      date: '14 Jan 2025',
      reference: 'SUB-8901',
      relatedTo: {
        type: 'driver' as const,
        name: 'Pierre Kabila'
      }
    },
    {
      id: '3',
      type: 'withdrawal' as const,
      amount: 500000,
      currency: 'CDF',
      status: 'processing' as const,
      description: 'Retrait vers compte bancaire',
      date: '13 Jan 2025',
      reference: 'WTH-5678'
    },
    {
      id: '4',
      type: 'commission' as const,
      amount: 38000,
      currency: 'CDF',
      status: 'active' as const,
      description: 'Commission livraison #9876',
      date: '12 Jan 2025',
      reference: 'COM-9876',
      relatedTo: {
        type: 'delivery' as const,
        name: 'Restaurant ABC'
      }
    },
    {
      id: '5',
      type: 'topup' as const,
      amount: 1000000,
      currency: 'CDF',
      status: 'active' as const,
      description: 'Rechargement KwendaPay',
      date: '10 Jan 2025',
      reference: 'TOP-4321'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="backdrop-blur-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-white/80 text-sm font-medium">
                    Solde disponible
                  </CardTitle>
                  <p className="text-xs text-white/60 mt-1">
                    KwendaPay Partner
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative z-10">
            <motion.p 
              className="text-5xl font-bold mb-6"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {balance.toLocaleString()} {currency}
            </motion.p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-white/60 text-xs mb-1">Revenus totaux</p>
                <p className="text-xl font-semibold">
                  {totalEarnings.toLocaleString()} {currency}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">En attente</p>
                <p className="text-xl font-semibold">
                  {pendingWithdrawals.toLocaleString()} {currency}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1 bg-white text-emerald-600 hover:bg-white/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Retirer
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Recharger
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                  <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  +12.5%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                847
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Transactions ce mois
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Avg: 45K
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                38.2K {currency}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Montant moyen
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  +8.3%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                2.1M {currency}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Revenus 7 jours
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transactions récentes</CardTitle>
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="transactions">Toutes</TabsTrigger>
                <TabsTrigger value="income">Revenus</TabsTrigger>
                <TabsTrigger value="expenses">Dépenses</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-3">
                {transactions.map((transaction, index) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    index={index}
                  />
                ))}
              </TabsContent>

              <TabsContent value="income" className="space-y-3">
                {transactions
                  .filter(t => ['commission', 'subscription', 'topup'].includes(t.type))
                  .map((transaction, index) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      index={index}
                    />
                  ))}
              </TabsContent>

              <TabsContent value="expenses" className="space-y-3">
                {transactions
                  .filter(t => ['withdrawal', 'refund'].includes(t.type))
                  .map((transaction, index) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      index={index}
                    />
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
