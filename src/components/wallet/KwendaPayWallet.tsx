import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

interface WalletTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  payment_method?: string;
  created_at: string;
  balance_after: number;
}

export const KwendaPayWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpProvider, setTopUpProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const providers = [
    { id: 'airtel', name: 'Airtel Money', icon: '📱' },
    { id: 'orange', name: 'Orange Money', icon: '🧡' },
    { id: 'mpesa', name: 'M-Pesa', icon: '💚' }
  ];

  useEffect(() => {
    if (user) {
      loadWallet();
      loadTransactions();
    }
  }, [user]);

  const loadWallet = async () => {
    try {
      const { data: existingWallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!existingWallet) {
        // Create wallet if it doesn't exist
        const { data: newWallet, error } = await supabase
          .from('user_wallets')
          .insert({ user_id: user?.id, balance: 0 })
          .select()
          .single();

        if (error) throw error;
        setWallet(newWallet);
      } else {
        setWallet(existingWallet);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le portefeuille",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || !topUpProvider || !phoneNumber) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('wallet-topup', {
        body: {
          amount: parseFloat(topUpAmount),
          provider: topUpProvider,
          phone: phoneNumber,
          currency: 'CDF'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Rechargement réussi",
          description: `Votre wallet a été rechargé de ${topUpAmount} CDF`
        });
        setIsTopUpOpen(false);
        setTopUpAmount('');
        setPhoneNumber('');
        setTopUpProvider('');
        loadWallet();
        loadTransactions();
      } else {
        throw new Error(data.error || 'Echec du rechargement');
      }
    } catch (error: any) {
      toast({
        title: "Erreur de rechargement",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case 'debit':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Wallet className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Chargement du portefeuille...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              Kwenda Pay
            </CardTitle>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {wallet?.is_active ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-primary-foreground/80 text-sm">Solde disponible</p>
              <p className="text-3xl font-bold">{formatAmount(wallet?.balance || 0)}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Recharger
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Recharger votre Kwenda Pay</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Montant (CDF)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="10000"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="provider">Opérateur Mobile Money</Label>
                      <Select value={topUpProvider} onValueChange={setTopUpProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un opérateur" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              <span className="flex items-center gap-2">
                                <span>{provider.icon}</span>
                                {provider.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Numéro de téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+243 XXX XXX XXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleTopUp} 
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? 'Traitement...' : 'Confirmer le rechargement'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">Récentes</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recent" className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune transaction pour le moment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium text-sm ${
                          transaction.transaction_type === 'credit' ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.transaction_type === 'credit' ? '+' : '-'}
                          {formatAmount(transaction.amount)}
                        </p>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(transaction.status)}
                          <span className="text-xs text-muted-foreground capitalize">
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="space-y-4">
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.transaction_type)}
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString('fr-FR')}
                          {transaction.payment_method && ` • ${transaction.payment_method}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium text-sm ${
                        transaction.transaction_type === 'credit' ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {formatAmount(transaction.amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(transaction.status)}
                        <span className="text-xs text-muted-foreground capitalize">
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};