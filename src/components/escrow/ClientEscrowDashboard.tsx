import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Shield, Clock, CheckCircle, AlertTriangle, Package, CreditCard, Eye, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EscrowTransaction {
  id: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  driver_id?: string;
  total_amount: number;
  seller_amount: number;
  driver_amount?: number;
  platform_fee: number;
  status: 'held' | 'completed' | 'disputed' | 'refunded';
  currency: string;
  held_at: string;
  released_at?: string;
  completed_at?: string;
  dispute_reason?: string;
  order?: {
    product_id: string;
    quantity: number;
    unit_price: number;
    delivery_method: string;
    status: string;
    created_at: string;
    confirmed_at?: string;
    delivered_at?: string;
    marketplace_products?: {
      title: string;
      images: string[];
    };
  };
}

interface WalletInfo {
  balance: number;
  currency: string;
  pending_withdrawals: number;
}

export const ClientEscrowDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEscrowData();
    }
  }, [user]);

  const fetchEscrowData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch escrow transactions via marketplace_orders with escrow_payments
      const { data: escrowData, error: escrowError } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          marketplace_products (
            title,
            images
          ),
          escrow_payments (
            id,
            status,
            amount,
            currency,
            held_at,
            released_at,
            completed_at
          )
        `)
        .eq('buyer_id', user.id)
        .not('escrow_payments', 'is', null)
        .order('created_at', { ascending: false });

      if (escrowError) throw escrowError;

      // Fetch wallet info
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance, currency')
        .eq('user_id', user.id)
        .eq('currency', 'CDF')
        .single();

      // Transform data to expected format
      const transformedData = (escrowData as any[])?.map(order => ({
        id: order.escrow_payments?.[0]?.id || order.id,
        order_id: order.id,
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        driver_id: null,
        total_amount: order.escrow_payments?.[0]?.amount || order.total_amount,
        seller_amount: order.escrow_payments?.[0]?.amount || order.total_amount,
        platform_fee: 0,
        status: order.escrow_payments?.[0]?.status || 'held',
        currency: order.escrow_payments?.[0]?.currency || 'CDF',
        held_at: order.escrow_payments?.[0]?.held_at || order.created_at,
        released_at: order.escrow_payments?.[0]?.released_at,
        completed_at: order.escrow_payments?.[0]?.completed_at,
        order: {
          product_id: order.product_id,
          quantity: order.quantity,
          unit_price: order.unit_price,
          delivery_method: order.delivery_method,
          status: order.status,
          created_at: order.created_at,
          confirmed_at: order.confirmed_at,
          delivered_at: order.delivered_at,
          marketplace_products: order.marketplace_products
        }
      })) || [];
      
      setEscrowTransactions(transformedData);
      setWalletInfo(walletData ? { ...walletData, pending_withdrawals: 0 } : null);

    } catch (error) {
      console.error('Error fetching escrow data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données escrow',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async (transactionId: string) => {
    setConfirmingDelivery(transactionId);

    try {
      const { data, error } = await supabase.functions.invoke('escrow-management', {
        body: {
          action: 'confirmDeliveryAndRelease',
          transactionId,
          userId: user?.id
        }
      });

      if (error) throw error;

      toast({
        title: 'Livraison confirmée',
        description: 'Les fonds ont été libérés au vendeur',
      });

      fetchEscrowData();

    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de confirmer la livraison',
        variant: 'destructive',
      });
    } finally {
      setConfirmingDelivery(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      held: { color: 'bg-yellow-500', text: 'En escrow', icon: Clock },
      completed: { color: 'bg-green-500', text: 'Terminé', icon: CheckCircle },
      disputed: { color: 'bg-red-500', text: 'Litige', icon: AlertTriangle },
      refunded: { color: 'bg-blue-500', text: 'Remboursé', icon: Shield }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge className={`${config?.color || 'bg-gray-500'} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config?.text || status}
      </Badge>
    );
  };

  const getProgressPercentage = (transaction: EscrowTransaction) => {
    const order = transaction.order;
    if (!order) return 0;

    switch (order.status) {
      case 'pending': return 10;
      case 'confirmed': return 25;
      case 'preparing': return 40;
      case 'ready_for_pickup': return 60;
      case 'in_transit': return 80;
      case 'delivered': return 90;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const getOrderStatusText = (status: string) => {
    const statusTexts = {
      pending: 'En attente de confirmation',
      confirmed: 'Confirmée par le vendeur',
      preparing: 'En préparation',
      ready_for_pickup: 'Prête pour collecte',
      in_transit: 'En livraison',
      delivered: 'Livrée',
      completed: 'Terminée'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 mobile-safe-layout">
      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Solde KwendaPay</p>
                <p className="text-2xl font-bold">
                  {walletInfo ? `${walletInfo.balance.toLocaleString()} CDF` : '0 CDF'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">En escrow</p>
                <p className="text-2xl font-bold">
                  {escrowTransactions
                    .filter(t => t.status === 'held')
                    .reduce((sum, t) => sum + t.total_amount, 0)
                    .toLocaleString()} CDF
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Commandes actives</p>
                <p className="text-2xl font-bold">
                  {escrowTransactions.filter(t => t.status === 'held').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Mes Transactions Escrow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Actives</TabsTrigger>
              <TabsTrigger value="completed">Terminées</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              <EscrowTransactionsList
                transactions={escrowTransactions.filter(t => t.status === 'held')}
                onConfirmDelivery={confirmDelivery}
                confirmingDelivery={confirmingDelivery}
                getStatusBadge={getStatusBadge}
                getProgressPercentage={getProgressPercentage}
                getOrderStatusText={getOrderStatusText}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <EscrowTransactionsList
                transactions={escrowTransactions.filter(t => t.status === 'completed')}
                onConfirmDelivery={confirmDelivery}
                confirmingDelivery={confirmingDelivery}
                getStatusBadge={getStatusBadge}
                getProgressPercentage={getProgressPercentage}
                getOrderStatusText={getOrderStatusText}
              />
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <EscrowTransactionsList
                transactions={escrowTransactions}
                onConfirmDelivery={confirmDelivery}
                confirmingDelivery={confirmingDelivery}
                getStatusBadge={getStatusBadge}
                getProgressPercentage={getProgressPercentage}
                getOrderStatusText={getOrderStatusText}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface EscrowTransactionsListProps {
  transactions: EscrowTransaction[];
  onConfirmDelivery: (id: string) => void;
  confirmingDelivery: string | null;
  getStatusBadge: (status: string) => React.ReactNode;
  getProgressPercentage: (transaction: EscrowTransaction) => number;
  getOrderStatusText: (status: string) => string;
}

const EscrowTransactionsList: React.FC<EscrowTransactionsListProps> = ({
  transactions,
  onConfirmDelivery,
  confirmingDelivery,
  getStatusBadge,
  getProgressPercentage,
  getOrderStatusText
}) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
        <p className="text-muted-foreground">Vos transactions escrow apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 content-scrollable">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="border-l-4 border-l-primary/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-semibold">
                    {transaction.order?.marketplace_products?.title || 'Produit non disponible'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Commande #{transaction.order_id.slice(-8)}
                  </p>
                </div>
                {getStatusBadge(transaction.status)}
              </div>

              {/* Order Progress */}
              {transaction.order && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression de la commande</span>
                    <span>{getProgressPercentage(transaction)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(transaction)} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {getOrderStatusText(transaction.order.status)}
                  </p>
                </div>
              )}

              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Montant total</p>
                  <p className="font-semibold">{transaction.total_amount.toLocaleString()} CDF</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date de création</p>
                  <p className="font-semibold">
                    {formatDistanceToNow(new Date(transaction.held_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                {transaction.status === 'held' && 
                 transaction.order?.status === 'delivered' && (
                  <Button
                    onClick={() => onConfirmDelivery(transaction.id)}
                    disabled={confirmingDelivery === transaction.id}
                    className="bg-green-600 hover:bg-green-700 touch-manipulation"
                  >
                    {confirmingDelivery === transaction.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Confirmation...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmer la livraison
                      </>
                    )}
                  </Button>
                )}
                
                <Button variant="outline" size="sm" className="touch-manipulation">
                  <Eye className="w-4 h-4 mr-2" />
                  Détails
                </Button>
                
                <Button variant="outline" size="sm" className="touch-manipulation">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};