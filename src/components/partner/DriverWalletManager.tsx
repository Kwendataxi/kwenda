import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Plus, History, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { useDriverWalletManager } from '@/hooks/useDriverWalletManager';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePartnerEarnings } from '@/hooks/usePartnerEarnings';

export const DriverWalletManager = () => {
  const { drivers, topUpHistory, loading, topUpDriverWallet, getDriverStats } = useDriverWalletManager();
  const isMobile = useIsMobile();
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);

  const { loading: earningsLoading, data: earnings, range, setRange } = usePartnerEarnings('30d');

  const stats = getDriverStats();

  const handleTopUp = async () => {
    if (!selectedDriver || !topUpAmount || !paymentMethod) return;

    const amount = parseFloat(topUpAmount);
    if (amount <= 0) return;

    const success = await topUpDriverWallet(selectedDriver, amount, paymentMethod);
    if (success) {
      setSelectedDriver('');
      setTopUpAmount('');
      setPaymentMethod('');
      setIsTopUpDialogOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBalanceStatus = (balance: number) => {
    if (balance < 5000) return { status: 'low', color: 'destructive' };
    if (balance < 15000) return { status: 'medium', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium leading-none">Chauffeurs</p>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium leading-none">Actifs</p>
                <p className="text-2xl font-bold">{stats.activeDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium leading-none">Solde Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium leading-none">Solde Faible</p>
                <p className="text-2xl font-bold">{stats.lowBalanceDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drivers" className="w-full">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          {!isMobile && <TabsTrigger value="analytics">Analyse</TabsTrigger>}
        </TabsList>

        <TabsContent value="drivers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Portefeuilles des Chauffeurs</h3>
            <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Recharger
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recharger Portefeuille Chauffeur</DialogTitle>
                  <DialogDescription>
                    Sélectionnez un chauffeur et le montant à créditer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="driver">Chauffeur</Label>
                    <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un chauffeur" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.driver_id} value={driver.driver_id}>
                            {driver.driver_name} - {driver.driver_code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Montant (CDF)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      placeholder="Ex: 10000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment-method">Méthode de paiement</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner méthode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="airtel_money">Airtel Money</SelectItem>
                        <SelectItem value="orange_money">Orange Money</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="bank_transfer">Virement Bancaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleTopUp} 
                    disabled={loading || !selectedDriver || !topUpAmount || !paymentMethod}
                    className="w-full"
                  >
                    {loading ? 'Traitement...' : 'Recharger'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {drivers.map((driver) => {
              const balanceStatus = getBalanceStatus(driver.balance);
              return (
                <Card key={driver.driver_id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm">{driver.driver_name}</CardTitle>
                        <CardDescription className="text-xs">
                          Code: {driver.driver_code}
                        </CardDescription>
                      </div>
                      <Badge variant={balanceStatus.color as any}>
                        {balanceStatus.status === 'low' ? 'Faible' : 
                         balanceStatus.status === 'medium' ? 'Moyen' : 'Bon'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Solde:</span>
                        <span className="font-semibold">{formatCurrency(driver.balance)}</span>
                      </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total rechargé:</span>
                          <span className="text-sm">{formatCurrency(driver.total_earned)}</span>
                        </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Commission:</span>
                        <span className="text-sm">{driver.commission_rate}%</span>
                      </div>
                      {driver.last_topup_date && (
                        <div className="text-xs text-muted-foreground">
                          Dernière recharge: {formatDate(driver.last_topup_date)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Historique des Recharges</h3>
          </div>

          <div className="space-y-3">
            {topUpHistory.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'}`}>
                    <div>
                      <div className="flex items-center space-x-2">
                        <History className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{transaction.driver_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description}
                      </p>
                    </div>
                    <div className={`${isMobile ? '' : 'text-right'}`}>
                      <div className="font-semibold text-green-600">
                        +{formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Nouveau solde: {formatCurrency(transaction.balance_after)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {topUpHistory.length === 0 && (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune recharge effectuée pour le moment</p>
            </div>
          )}
        </TabsContent>

        {!isMobile && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Répartition des Soldes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Soldes faibles (&lt; 5K):</span>
                      <span>{stats.lowBalanceDrivers} chauffeurs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Soldes moyens (5K-15K):</span>
                      <span>{drivers.filter(d => d.balance >= 5000 && d.balance < 15000).length} chauffeurs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Bons soldes (&gt; 15K):</span>
                      <span>{drivers.filter(d => d.balance >= 15000).length} chauffeurs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Statistiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Solde moyen:</span>
                      <span>{formatCurrency(stats.totalDrivers > 0 ? stats.totalBalance / stats.totalDrivers : 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total recharges:</span>
                      <span>{topUpHistory.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Chauffeurs actifs:</span>
                      <span>{((stats.activeDrivers / stats.totalDrivers) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};