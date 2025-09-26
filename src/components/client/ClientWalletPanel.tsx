import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, CreditCard, History, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ClientWalletPanel: React.FC = () => {
  const { wallet, transactions, loading, error, topUpWallet } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [provider, setProvider] = useState<'airtel' | 'orange' | 'mpesa' | ''>('');
  const [phone, setPhone] = useState<string>('');
  const [isTopping, setIsTopping] = useState(false);

  const balanceText = useMemo(() => {
    if (loading) return 'Chargement...';
    if (error) return 'Erreur de chargement';
    const value = Number(wallet?.balance || 0);
    return `${value.toLocaleString('fr-CD')} ${wallet?.currency || 'CDF'}`;
  }, [wallet, loading, error]);

  const handleTopUp = async () => {
    if (!amount || !provider || !phone) return;
    
    setIsTopping(true);
    const success = await topUpWallet(Number(amount), provider, phone);
    if (success) {
      setAmount('');
      setProvider('');
      setPhone('');
    }
    setIsTopping(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-24">
      {/* Wallet Balance Card */}
      <Card className={cn(
        "bg-gradient-to-r border-primary/20",
        error ? "from-destructive/10 to-destructive/5 border-destructive/20" : "from-primary/10 to-primary/5"
      )}>
        <CardHeader className="text-center pb-2">
          <div className={cn(
            "mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4",
            error ? "bg-destructive/20" : "bg-primary/20"
          )}>
            <Wallet className={cn("w-8 h-8", error ? "text-destructive" : "text-primary")} />
          </div>
          <CardTitle className={cn("text-2xl font-bold", error ? "text-destructive" : "text-primary")}>
            KwendaPay
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={cn(
            "text-3xl font-bold mb-2",
            loading && "animate-pulse",
            error ? "text-destructive" : "text-foreground"
          )}>
            {balanceText}
          </div>
          <div className="text-sm text-muted-foreground">
            {error ? "Impossible de charger le solde" : "Solde disponible"}
          </div>
        </CardContent>
      </Card>

      {/* Top-up Section */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Recharger le portefeuille</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (CDF)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+243..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-lg"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="provider">Opérateur mobile</Label>
            <Select value={provider} onValueChange={(value: 'airtel' | 'orange' | 'mpesa') => setProvider(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre opérateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="airtel">Airtel Money</SelectItem>
                <SelectItem value="orange">Orange Money</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleTopUp}
            disabled={!amount || !provider || !phone || isTopping}
            className="w-full"
            size="lg"
          >
            {isTopping ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Rechargement...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Recharger {amount && `${Number(amount).toLocaleString('fr-CD')} CDF`}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Historique des transactions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune transaction pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {transactions.slice(0, 10).map((transaction, index) => (
                <div key={transaction.id} className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  transaction.transaction_type === 'credit' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                )}>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {transaction.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('fr-CD')}
                    </div>
                  </div>
                  <div className={cn(
                    "font-bold text-sm",
                    transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {transaction.transaction_type === 'credit' ? '+' : '-'}
                    {Number(transaction.amount).toLocaleString('fr-CD')} {transaction.currency}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientWalletPanel;