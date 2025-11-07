import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useRestaurantWallet } from '@/hooks/useRestaurantWallet';
import { RestaurantWalletCard } from '@/components/restaurant/RestaurantWalletCard';
import { RestaurantTopUpDialog } from '@/components/restaurant/RestaurantTopUpDialog';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RestaurantWalletPage() {
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const { wallet, transactions, loading, topUpWallet, topUpLoading, formatAmount, getMonthlyStats } = useRestaurantWallet();

  const monthlyStats = getMonthlyStats();

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? ArrowUpRight : ArrowDownRight;
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">KwendaPay</h1>
        <p className="text-muted-foreground">Gérez vos finances restaurant</p>
      </div>

        {/* Wallet Card */}
        <RestaurantWalletCard
          balance={wallet?.balance || 0}
          bonusBalance={wallet?.bonus_balance || 0}
          monthlySpent={monthlyStats.spent}
          monthlyRecharged={monthlyStats.recharged}
          onRecharge={() => setTopUpDialogOpen(true)}
          loading={loading}
        />

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total rechargé</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{monthlyStats.recharged.toLocaleString()} CDF</span>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total dépensé</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{monthlyStats.spent.toLocaleString()} CDF</span>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <ArrowDownRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Transactions ce mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {transactions.filter(t => {
                      const txDate = new Date(t.created_at);
                      const now = new Date();
                      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
                    }).length}
                  </span>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Transactions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
            <CardDescription>Toutes vos transactions récentes</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="credit">Recharges</TabsTrigger>
                <TabsTrigger value="debit">Dépenses</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune transaction pour le moment
                  </div>
                ) : (
                  transactions.map((tx) => {
                    const Icon = getTransactionIcon(tx.transaction_type);
                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ x: 4 }}
                      >
                        <Card className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${tx.transaction_type === 'credit' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                                <Icon className={`h-5 w-5 ${getTransactionColor(tx.transaction_type)}`} />
                              </div>
                              <div>
                                <p className="font-medium">{tx.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(tx.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getTransactionColor(tx.transaction_type)}`}>
                                {tx.transaction_type === 'credit' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()} CDF
                              </p>
                              <Badge variant={getStatusBadge(tx.status)} className="text-xs">
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="credit" className="space-y-3">
                {transactions.filter(t => t.transaction_type === 'credit').map((tx) => {
                  const Icon = ArrowUpRight;
                  return (
                    <Card key={tx.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <Icon className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            +{tx.amount.toLocaleString()} CDF
                          </p>
                          <Badge variant={getStatusBadge(tx.status)} className="text-xs">
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="debit" className="space-y-3">
                {transactions.filter(t => t.transaction_type === 'debit').map((tx) => {
                  const Icon = ArrowDownRight;
                  return (
                    <Card key={tx.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                            <Icon className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            -{Math.abs(tx.amount).toLocaleString()} CDF
                          </p>
                          <Badge variant={getStatusBadge(tx.status)} className="text-xs">
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      {/* Dialog de recharge */}
      <RestaurantTopUpDialog
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
        currentBalance={wallet?.balance || 0}
        onSuccess={() => {}}
        onTopUp={async (amount, method, phone) => {
          await topUpWallet({ amount, payment_method: method as any, phone_number: phone });
        }}
        loading={topUpLoading}
      />
    </div>
  );
}
