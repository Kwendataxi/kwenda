import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  CreditCard, 
  ArrowDown, 
  ArrowUp, 
  DollarSign,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useDriverCredits } from '@/hooks/useDriverCredits';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WithdrawalForm {
  amount: string;
  provider: 'airtel' | 'orange' | 'mpesa' | '';
  phone: string;
}

export const DualWalletSystem: React.FC = () => {
  const { user } = useAuth();
  const { wallet, transactions: walletTransactions, loading: walletLoading } = useWallet();
  const { 
    credits, 
    transactions: creditTransactions, 
    loading: creditsLoading,
    topUpCredits
  } = useDriverCredits();

  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalForm>({
    amount: '',
    provider: '',
    phone: ''
  });
  const [topupForm, setTopupForm] = useState({
    amount: '',
    provider: '',
    phone: ''
  });
  const [withdrawing, setWithdrawing] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);

  // Traitement retrait KwendaPay vers Mobile Money
  const handleWithdrawal = async () => {
    if (!user || !withdrawalForm.amount || !withdrawalForm.provider || !withdrawalForm.phone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const amount = parseFloat(withdrawalForm.amount);
    if (amount <= 0 || amount > (wallet?.balance || 0)) {
      toast.error('Montant invalide ou insuffisant');
      return;
    }

    setWithdrawing(true);
    try {
      // Appeler l'edge function pour le retrait
      const { data, error } = await supabase.functions.invoke('mobile-money-payment', {
        body: {
          action: 'withdraw',
          amount,
          currency: wallet?.currency || 'CDF',
          provider: withdrawalForm.provider,
          phone: withdrawalForm.phone,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast.success('Retrait initié avec succès!');
      setWithdrawalForm({ amount: '', provider: '', phone: '' });
      
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Erreur lors du retrait');
    } finally {
      setWithdrawing(false);
    }
  };

  // Recharge crédit de fonctionnement
  const handleCreditTopup = async () => {
    if (!topupForm.amount || !topupForm.provider || !topupForm.phone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const amount = parseFloat(topupForm.amount);
    if (amount <= 0) {
      toast.error('Montant invalide');
      return;
    }

    setToppingUp(true);
    try {
      const success = await topUpCredits(amount, topupForm.provider);
      if (success) {
        setTopupForm({ amount: '', provider: '', phone: '' });
      }
    } catch (error) {
      console.error('Topup error:', error);
    } finally {
      setToppingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec soldes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KwendaPay (Gains) */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600" />
              KwendaPay (Gains clients)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-700">
                {wallet?.balance?.toLocaleString('fr-CD') || '0'} CDF
              </div>
              <Badge variant="outline" className="border-green-300 text-green-700">
                Retirable via Mobile Money
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Crédit de fonctionnement */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Crédit de fonctionnement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-700">
                {credits?.balance?.toLocaleString('fr-CD') || '0'} CDF
              </div>
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                Pour frais de service
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {credits && credits.balance < 5000 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Solde de fonctionnement faible. Rechargez pour continuer à recevoir des commandes.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions principales */}
      <Tabs defaultValue="withdraw" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="withdraw" className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4" />
            Retirer KwendaPay
          </TabsTrigger>
          <TabsTrigger value="topup" className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4" />
            Recharger crédit
          </TabsTrigger>
        </TabsList>

        {/* Retrait KwendaPay */}
        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Retirer vers Mobile Money
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Montant à retirer</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={withdrawalForm.amount}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Disponible: {wallet?.balance?.toLocaleString('fr-CD') || '0'} CDF
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Opérateur Mobile Money</Label>
                  <Select 
                    value={withdrawalForm.provider} 
                    onValueChange={(value) => setWithdrawalForm(prev => ({ ...prev, provider: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="orange">Orange Money</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Numéro de téléphone</Label>
                  <Input
                    type="tel"
                    placeholder="099xxxxxxx"
                    value={withdrawalForm.phone}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleWithdrawal}
                disabled={withdrawing || !withdrawalForm.amount || !withdrawalForm.provider || !withdrawalForm.phone}
                className="w-full"
              >
                {withdrawing ? 'Traitement...' : 'Retirer maintenant'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recharge crédit fonctionnement */}
        <TabsContent value="topup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Recharger crédit de fonctionnement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Montant à recharger</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={topupForm.amount}
                    onChange={(e) => setTopupForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opérateur</Label>
                  <Select 
                    value={topupForm.provider} 
                    onValueChange={(value) => setTopupForm(prev => ({ ...prev, provider: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="orange">Orange Money</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    type="tel"
                    placeholder="099xxxxxxx"
                    value={topupForm.phone}
                    onChange={(e) => setTopupForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreditTopup}
                disabled={toppingUp || !topupForm.amount || !topupForm.provider}
                className="w-full"
              >
                {toppingUp ? 'Traitement...' : 'Recharger crédit'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="kwenda" className="space-y-4">
            <TabsList>
              <TabsTrigger value="kwenda">KwendaPay</TabsTrigger>
              <TabsTrigger value="credits">Crédit fonctionnement</TabsTrigger>
            </TabsList>

            <TabsContent value="kwenda">
              {walletTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune transaction KwendaPay</p>
              ) : (
                <div className="space-y-2">
                  {walletTransactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-2 border-b">
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className={`text-sm font-semibold ${
                        transaction.transaction_type === 'deposit' || transaction.transaction_type === 'credit'
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'deposit' || transaction.transaction_type === 'credit' ? '+' : '-'}
                        {transaction.amount.toLocaleString('fr-CD')} CDF
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="credits">
              {creditTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune transaction de crédit</p>
              ) : (
                <div className="space-y-2">
                  {creditTransactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-2 border-b">
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className={`text-sm font-semibold ${
                        transaction.transaction_type === 'credit' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {transaction.amount.toLocaleString('fr-CD')} CDF
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DualWalletSystem;