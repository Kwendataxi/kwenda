import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useVendorOrders } from '@/hooks/useVendorOrders';
import { VendorOrderValidationPanel } from '@/components/marketplace/VendorOrderValidationPanel';
import { VendorOrderManagementInterface } from '@/components/marketplace/VendorOrderManagementInterface';
import { VendorEscrowSummary } from '@/components/vendor/VendorEscrowSummary';
import { Package, CheckCircle, Clock, Truck, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VendorOrdersListProps {
  onRefresh?: () => void;
}

export const VendorOrdersList = ({ onRefresh }: VendorOrdersListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // ✅ PHASE 1: Utiliser le hook dédié pour les commandes en attente
  const { 
    pendingOrders, 
    loading: pendingLoading, 
    confirmOrder, 
    rejectOrder,
    loadPendingOrders 
  } = useVendorOrders();

  // ✅ PHASE 3: État séparé pour les commandes actives et terminées
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ PHASE 3: Fonction pour charger les commandes actives et terminées
  const loadActiveAndCompletedOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // ✅ ÉTAPE 1 : Récupérer d'abord les produits du vendeur
      const { data: vendorProducts, error: productsError } = await supabase
        .from('marketplace_products')
        .select('id, title, images, price')
        .eq('seller_id', user.id);

      if (productsError) throw productsError;

      if (!vendorProducts || vendorProducts.length === 0) {
        setActiveOrders([]);
        setCompletedOrders([]);
        return;
      }

      const vendorProductIds = vendorProducts.map(p => p.id);

      // ✅ ÉTAPE 2 : Récupérer les commandes actives
      const { data: active, error: activeError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .in('product_id', vendorProductIds)
        .in('status', ['confirmed', 'preparing', 'ready_for_pickup', 'in_transit'])
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // ✅ ÉTAPE 3 : Récupérer les commandes terminées
      const { data: completed, error: completedError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .in('product_id', vendorProductIds)
        .in('status', ['completed', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (completedError) throw completedError;

      // ✅ ÉTAPE 4 : Récupérer les infos acheteurs depuis la table clients
      const allOrders = [...(active || []), ...(completed || [])];
      const buyerIds = [...new Set(allOrders.map(o => o.buyer_id).filter(Boolean))];
      
      let buyersMap: Record<string, { display_name: string; phone_number: string }> = {};
      if (buyerIds.length > 0) {
        const { data: buyers } = await supabase
          .from('clients')
          .select('user_id, display_name, phone_number')
          .in('user_id', buyerIds);
        
        if (buyers) {
          buyersMap = buyers.reduce((acc, b) => {
            acc[b.user_id] = { display_name: b.display_name, phone_number: b.phone_number };
            return acc;
          }, {} as Record<string, { display_name: string; phone_number: string }>);
        }
      }

      // ✅ ÉTAPE 5 : Enrichir avec les données produits ET acheteurs
      const enrichOrders = (orders: any[]) => 
        orders.map(order => ({
          ...order,
          product: vendorProducts.find(p => p.id === order.product_id),
          buyer: buyersMap[order.buyer_id] || null
        }));

      setActiveOrders(enrichOrders(active || []));
      setCompletedOrders(enrichOrders(completed || []));
    } catch (error: any) {
      console.error('Error loading orders:', error);
      console.error('Error details:', {
        message: error.message,
        hint: error.hint,
        details: error.details
      });
      
      // Message d'erreur plus spécifique
      const errorMessage = error.message?.includes('permission')
        ? "Vous n'avez pas les permissions nécessaires"
        : error.message?.includes('network')
        ? "Problème de connexion réseau"
        : "Impossible de charger les commandes";
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Charger toutes les catégories au montage
  useEffect(() => {
    if (user) {
      loadPendingOrders();
      loadActiveAndCompletedOrders();
    }
  }, [user]);

  // ✅ PHASE 4: Subscription en temps réel améliorée
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('vendor-orders-all')
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
          
          // ✅ Recharger toutes les catégories
          loadPendingOrders();
          loadActiveAndCompletedOrders();
          onRefresh?.();
          
          // Toast selon l'événement
          if (payload.eventType === 'INSERT') {
            toast({
              title: "🎉 Nouvelle commande !",
              description: "Vous avez reçu une nouvelle commande"
            });
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any).status;
            if (newStatus === 'confirmed') {
              toast({
                title: "✅ Commande confirmée",
                description: "Votre validation a été enregistrée"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

      // ✅ Recharger toutes les catégories
      loadPendingOrders();
      loadActiveAndCompletedOrders();
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
      const allOrders = [...pendingOrders, ...activeOrders, ...completedOrders];
      const csvData = allOrders.map(order => ({
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

  // ✅ Les commandes sont déjà filtrées par catégorie via le hook et les fonctions de chargement

  if (loading || pendingLoading) {
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

  const totalOrders = pendingOrders.length + activeOrders.length + completedOrders.length;

  return (
    <div className="space-y-4">
      {/* Résumé financier escrow */}
      {totalOrders > 0 && <VendorEscrowSummary />}
      
      {/* Export Button */}
      {totalOrders > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      )}
      
      <Tabs defaultValue="pending" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        {/* ✅ PHASE 6: Badge amélioré avec animation */}
        <TabsTrigger value="pending" className="relative">
          À traiter
          {pendingOrders.length > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
            >
              {pendingOrders.length > 99 ? '99+' : pendingOrders.length}
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

      {/* ✅ PHASE 5: TabsContent corrigé avec les bonnes fonctions */}
      <TabsContent value="pending">
        <VendorOrderValidationPanel 
          orders={pendingOrders} 
          onRefresh={() => {
            loadPendingOrders();
            loadActiveAndCompletedOrders();
            onRefresh?.();
          }} 
        />
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
              <VendorOrderManagementInterface 
                key={order.id}
                order={order}
                onStatusUpdate={() => {
                  loadPendingOrders();
                  loadActiveAndCompletedOrders();
                  onRefresh?.();
                }}
              />
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
                        Client: {order.buyer?.display_name || 'Non renseigné'}
                        {order.buyer_phone && ` • ${order.buyer_phone}`} • Qté: {order.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{order.total_amount.toLocaleString()} CDF</p>
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
