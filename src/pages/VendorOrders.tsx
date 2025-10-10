import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVendorOrders } from '@/hooks/useVendorOrders';
import { Package, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function VendorOrders() {
  const { pendingOrders, loading, confirmOrder, rejectOrder, loadPendingOrders } = useVendorOrders();

  useEffect(() => {
    loadPendingOrders();
  }, []);

  const handleConfirm = async (orderId: string) => {
    const success = await confirmOrder(orderId);
    if (success) {
      toast.success('Commande confirmée avec succès');
      loadPendingOrders();
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = prompt('Raison du refus (optionnel):');
    const success = await rejectOrder(orderId, reason || 'Refus vendeur');
    if (success) {
      toast.success('Commande refusée');
      loadPendingOrders();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes Commandes Vendeur</h1>
        <p className="text-muted-foreground">
          {pendingOrders.length} commande{pendingOrders.length > 1 ? 's' : ''} en attente de confirmation
        </p>
      </div>

      {pendingOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Aucune commande en attente</h2>
          <p className="text-muted-foreground">
            Les nouvelles commandes apparaîtront ici automatiquement
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingOrders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold text-lg">Commande #{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                  En attente
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-medium mb-2">Produit</h4>
                  <p className="text-sm text-muted-foreground">
                    {order.product?.name || 'Produit inconnu'}
                  </p>
                  <p className="text-sm">
                    Quantité: <span className="font-semibold">{order.quantity}</span>
                  </p>
                  <p className="text-lg font-bold text-primary mt-2">
                    {order.total_price?.toLocaleString()} {order.currency || 'CDF'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Livraison
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {order.delivery_address || 'Adresse non spécifiée'}
                  </p>
                  {order.buyer_contact && (
                    <p className="text-sm mt-1">
                      Contact: <span className="font-medium">{order.buyer_contact}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleConfirm(order.id)}
                  className="flex-1"
                  variant="default"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accepter la commande
                </Button>
                <Button
                  onClick={() => handleReject(order.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Refuser
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
