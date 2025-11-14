import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Download, DollarSign, ArrowUpRight, TrendingUp, Plus } from 'lucide-react';
import { useUnifiedPartnerFinances } from '@/hooks/useUnifiedPartnerFinances';
import { usePartnerWithdrawals } from '@/hooks/usePartnerWithdrawals';
import { PartnerWithdrawalDialog } from '../PartnerWithdrawalDialog';
import { PartnerTopUpDialog } from '../PartnerTopUpDialog';
import { formatPartnerCurrency } from '@/lib/partnerUtils';

export const ModernPartnerWallet = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  
  const finances = useUnifiedPartnerFinances('30d');
  const { requestWithdrawal, withdrawals, loading: withdrawalsLoading } = usePartnerWithdrawals();

  const balance = finances.walletBalance;
  const currency = finances.walletCurrency;
  const totalEarnings = finances.totalCommissions;
  const pendingWithdrawals = finances.pendingWithdrawals;

  const handleWithdrawal = async (amount: number, method: string, accountDetails: any) => {
    await requestWithdrawal(amount, method, accountDetails);
  };

  if (finances.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="backdrop-blur-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-white/80 text-sm font-medium">Solde disponible</CardTitle>
                <p className="text-xs text-white/60 mt-1">KwendaPay Partner</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <motion.p className="text-5xl font-bold mb-6" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
              {formatPartnerCurrency(balance, currency)}
            </motion.p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-white/60 text-xs mb-1">Revenus totaux</p>
                <p className="text-xl font-semibold">{formatPartnerCurrency(totalEarnings, currency)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">En attente</p>
                <p className="text-xl font-semibold">{formatPartnerCurrency(pendingWithdrawals, currency)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="secondary" 
                className="bg-white text-emerald-600 hover:bg-white/90"
                onClick={() => setTopUpDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Recharger
              </Button>
              
              <Button 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setWithdrawalDialogOpen(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Retirer
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-green-50">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-green-600 font-medium">+12.5%</span>
            </div>
            <p className="text-2xl font-bold">{withdrawals.length}</p>
            <p className="text-sm text-muted-foreground">Retraits ce mois</p>
          </CardContent>
        </Card>
      </div>

      <PartnerWithdrawalDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        availableBalance={finances.availableForWithdrawal}
        currency={currency}
        onSubmit={handleWithdrawal}
        loading={withdrawalsLoading}
      />

      <PartnerTopUpDialog
        open={topUpDialogOpen}
        onOpenChange={setTopUpDialogOpen}
        currentBalance={balance}
        currency={currency}
        onSuccess={() => {
          setTopUpDialogOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
};
