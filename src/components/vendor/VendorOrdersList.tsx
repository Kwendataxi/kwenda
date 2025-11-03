import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VendorOrderValidationPanel } from '@/components/marketplace/VendorOrderValidationPanel';
import { Package, CheckCircle, Clock, Truck, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VendorOrdersListProps {
  onRefresh?: () => void;
}

export const VendorOrdersList = ({ onRefresh }: VendorOrdersListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
      subscribeToOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          product:marketplace_products(id, title, main_image_url, price)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToOrders = () => {
    if (!user) return;

    const channel = supabase
      .channel('vendor-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_orders',
          filter: `seller_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order updated:', payload);
          loadOrders();
          onRefresh?.();
          
          // Toast notification pour nouvelles commandes
          if (payload.eventType === 'INSERT') {
            toast({
              title: "🎉 Nouvelle commande !",
              description: "Vous avez reçu une nouvelle commande"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleOrderComplete = async (orderId: string) => {
    try {
      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('marketplace_orders')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Libérer le paiement escrow
      const { error: releaseError } = await supabase.functions.invoke('release-escrow-payment', {
        body: { orderId }
      });

      if (releaseError) {
        console.error('Escrow release error:', releaseError);
        toast({ 
          title: "Attention", 
          description: "Commande terminée mais erreur lors de la libération du paiement" 
        });
      } else {
        toast({ 
          title: "✅ Commande terminée", 
          description: "Le paiement a été libéré sur votre wallet vendeur" 
        });
      }

      loadOrders();
      onRefresh?.();
    } catch (error) {
      console.error('Error completing order:', error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de terminer la commande", 
        variant: "destructive" 
      });
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = orders.map(order => ({
        'ID Commande': order.id,
        'Produit': order.product?.title || 'N/A',
        'Client': order.buyer_phone || 'N/A',
        'Quantité': order.quantity,
        'Montant': order.total_amount,
        'Statut': order.status,
        'Date': new Date(order.created_at).toLocaleDateString('fr-FR')
      }));

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => row[h as keyof typeof row]).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "✅ Export réussi",
        description: "Le fichier CSV a été téléchargé"
      });
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les commandes",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      'pending': { variant: 'outline', label: 'En attente', icon: Clock },
      'awaiting_vendor_confirmation': { variant: 'secondary', label: 'À valider', icon: Clock },
      'confirmed': { variant: 'default', label: 'Confirmée', icon: CheckCircle },
      'preparing': { variant: 'default', label: 'En préparation', icon: Package },
      'ready_for_pickup': { variant: 'default', label: 'Prête', icon: Package },
      'in_transit': { variant: 'default', label: 'En livraison', icon: Truck },
      'delivered': { variant: 'default', label: 'Livrée', icon: CheckCircle },
      'completed': { variant: 'default', label: 'Terminée', icon: CheckCircle }
    };

    const config = variants[status] || { variant: 'outline', label: status, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingOrders = orders.filter(o => 
    o.status === 'pending' || o.status === 'awaiting_vendor_confirmation'
  );
  const activeOrders = orders.filter(o => 
    ['confirmed', 'preparing', 'ready_for_pickup', 'in_transit'].includes(o.status)
  );
  const completedOrders = orders.filter(o => 
    o.status === 'completed' || o.status === 'delivered'
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Tabs Skeleton */}
        <div className="flex gap-2 border-b pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 w-32 bg-muted/60 rounded animate-pulse" />
          ))}
        </div>
        
        {/* Orders Grid Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-3/4 bg-muted/60 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-muted/60 rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 w-20 bg-muted/60 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-muted/60 rounded animate-pulse" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-10 w-full bg-muted/60 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Button */}
      {orders.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="pending" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending" className="relative">
          À traiter
          {pendingOrders.length > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
              {pendingOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="active">
          En cours ({activeOrders.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Terminées ({completedOrders.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending">
        <VendorOrderValidationPanel orders={pendingOrders} onRefresh={loadOrders} />
      </TabsContent>

      <TabsContent value="active">
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune commande en cours</p>
              </CardContent>
            </Card>
          ) : (
            activeOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {order.product?.title || 'Produit'}
                        {getStatusBadge(order.status)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Client: {order.buyer_phone || 'Téléphone non disponible'} • Qté: {order.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{order.total_amount} FC</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* ✅ CORRIGÉ: Bouton visible pour tous les statuts actifs */}
                  {['confirmed', 'preparing', 'ready_for_pickup', 'in_transit'].includes(order.status) && (
                    <Button 
                      onClick={() => handleOrderComplete(order.id)}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {order.status === 'in_transit' ? 'Marquer comme livrée' : 'Terminer la commande'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="completed">
        <div className="space-y-4">
          {completedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune commande terminée</p>
              </CardContent>
            </Card>
          ) : (
            completedOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {order.product?.title || 'Produit'}
                        {getStatusBadge(order.status)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Client: {order.buyer_phone || 'Non renseigné'} • Qté: {order.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{order.total_amount} FC</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </TabsContent>
      </Tabs>
    </div>
  );
};
