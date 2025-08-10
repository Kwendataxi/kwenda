import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useDriverFinancials } from '@/hooks/useDriverFinancials';
import { 
  Wallet, 
  TrendingUp, 
  Target, 
  Clock, 
  Star,
  Car,
  Package,
  ShoppingBag,
  Trophy,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DriverFinancialDashboardProps {
  className?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: 'CDF',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'earning': return <ArrowUpRight className="h-3 w-3 text-green-500" />;
    case 'commission': return <ArrowDownLeft className="h-3 w-3 text-red-500" />;
    case 'bonus': return <Trophy className="h-3 w-3 text-yellow-500" />;
    case 'topup': return <Plus className="h-3 w-3 text-blue-500" />;
    default: return <DollarSign className="h-3 w-3 text-gray-500" />;
  }
};

const DriverFinancialDashboard: React.FC<DriverFinancialDashboardProps> = ({ className }) => {
  const { 
    loading, 
    earnings, 
    breakdown, 
    transactions, 
    creditBalance, 
    topUpCredits,
    getEarningsSummary 
  } = useDriverFinancials();

  const [topUpAmount, setTopUpAmount] = useState(10000);
  const [topUpLoading, setTopUpLoading] = useState(false);

  const summary = getEarningsSummary();

  const handleTopUp = async (amount: number) => {
    setTopUpLoading(true);
    try {
      const success = await topUpCredits(amount, 'mobile_money');
      if (success) {
        setTopUpAmount(10000);
      }
    } catch (error) {
      console.error('Top-up failed:', error);
    } finally {
      setTopUpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("p-4 space-y-4", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 space-y-6", className)}>
      {/* Earnings Overview */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Gains totaux</h3>
              <p className="text-2xl font-bold">{formatCurrency(earnings.total_earnings)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Net (après commission)</p>
              <p className="text-lg font-semibold">{formatCurrency(earnings.net_earnings)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="opacity-80">Aujourd'hui</p>
              <p className="font-semibold">{formatCurrency(earnings.daily_earnings)}</p>
            </div>
            <div>
              <p className="opacity-80">Cette semaine</p>
              <p className="font-semibold">{formatCurrency(earnings.weekly_earnings)}</p>
            </div>
            <div>
              <p className="opacity-80">Ce mois</p>
              <p className="font-semibold">{formatCurrency(earnings.monthly_earnings)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Note moyenne</span>
            </div>
            <p className="text-2xl font-bold">{earnings.average_rating.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">⭐⭐⭐⭐⭐</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Heures en ligne</span>
            </div>
            <p className="text-2xl font-bold">{earnings.hours_online}h</p>
            <p className="text-xs text-muted-foreground">Aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition des gains</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Courses taxi</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(breakdown.rides.earnings)}</p>
              <p className="text-xs text-muted-foreground">{breakdown.rides.count} courses</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-500" />
              <span className="text-sm">Livraisons</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(breakdown.deliveries.earnings)}</p>
              <p className="text-xs text-muted-foreground">{breakdown.deliveries.count} livraisons</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Marketplace</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(breakdown.marketplace.earnings)}</p>
              <p className="text-xs text-muted-foreground">{breakdown.marketplace.count} livraisons</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Défis & Bonus</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatCurrency(breakdown.challenges.earnings)}</p>
              <p className="text-xs text-muted-foreground">{breakdown.challenges.count} récompenses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Objectifs de gains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Objectif quotidien</span>
              <span>{Math.min(summary.todayProgress, 100).toFixed(0)}%</span>
            </div>
            <Progress value={summary.todayProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(earnings.daily_earnings)} / {formatCurrency(15000)}
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Objectif hebdomadaire</span>
              <span>{Math.min(summary.weeklyProgress, 100).toFixed(0)}%</span>
            </div>
            <Progress value={summary.weeklyProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(earnings.weekly_earnings)} / {formatCurrency(100000)}
            </p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Objectif mensuel</span>
              <span>{Math.min(summary.monthlyProgress, 100).toFixed(0)}%</span>
            </div>
            <Progress value={summary.monthlyProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(earnings.monthly_earnings)} / {formatCurrency(400000)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Credits & Top-up */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Crédits KwendaPay
            </div>
            <Badge variant="outline">{formatCurrency(creditBalance)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTopUp(5000)}
              disabled={topUpLoading}
            >
              +5K CDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTopUp(10000)}
              disabled={topUpLoading}
            >
              +10K CDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTopUp(25000)}
              disabled={topUpLoading}
            >
              +25K CDF
            </Button>
          </div>
          
          {creditBalance < 5000 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Solde faible. Rechargez vos crédits pour continuer à utiliser les services.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-semibold",
                    transaction.type === 'earning' || transaction.type === 'topup' || transaction.type === 'bonus'
                      ? "text-green-600"
                      : "text-red-600"
                  )}>
                    {transaction.type === 'earning' || transaction.type === 'topup' || transaction.type === 'bonus' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                Aucune transaction récente
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverFinancialDashboard;