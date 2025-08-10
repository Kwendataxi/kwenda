import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useMarketplaceOrders } from "@/hooks/useMarketplaceOrders";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderForConfirmation {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  delivery_method: string;
  delivery_address?: string;
  notes?: string;
  vendor_confirmation_status: string;
  created_at: string;
  // Relations
  profiles?: {
    display_name: string;
  };
  marketplace_products?: {
    title: string;
    price: number;
  };
}

interface Props {
  orders: OrderForConfirmation[];
  onOrderUpdate: () => void;
}

export default function VendorOrderConfirmation({ orders, onOrderUpdate }: Props) {
  const { updateOrderStatus } = useMarketplaceOrders();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState<string | null>(null);

  const handleConfirmOrder = async (orderId: string) => {
    setProcessing(orderId);
    try {
      await updateOrderStatus(orderId, 'confirmed', {
        vendor_confirmation_status: 'confirmed',
        vendor_confirmed_at: new Date().toISOString(),
      });
      
      toast({
        title: "Commande confirmée",
        description: "La commande a été confirmée avec succès. Le client a été notifié.",
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la commande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motif requis",
        description: "Veuillez indiquer le motif du refus.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(orderId);
    try {
      await updateOrderStatus(orderId, 'cancelled', {
        vendor_confirmation_status: 'rejected',
        vendor_rejection_reason: rejectionReason,
      });
      
      toast({
        title: "Commande refusée",
        description: "La commande a été refusée. Le client a été notifié.",
      });
      
      setRejectionReason('');
      setShowRejectionForm(null);
      onOrderUpdate();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser la commande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awaiting_confirmation':
        return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'confirmed':
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Confirmé</Badge>;
      case 'rejected':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingOrders = orders.filter(order => 
    order.vendor_confirmation_status === 'awaiting_confirmation'
  );

  if (pendingOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune commande en attente</h3>
          <p className="text-muted-foreground">
            Toutes vos commandes ont été traitées.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold">
          Commandes à confirmer ({pendingOrders.length})
        </h3>
      </div>

      {pendingOrders.map((order) => (
        <Card key={order.id} className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Nouvelle commande
              </CardTitle>
              {getStatusBadge(order.vendor_confirmation_status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Produit</h4>
                <p className="font-medium">
                  {order.marketplace_products?.title || 'Produit inconnu'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Quantité: {order.quantity} × {Number(order.marketplace_products?.price || 0).toLocaleString()} FC
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Client</h4>
                <p className="font-medium">
                  {order.profiles?.display_name || 'Client anonyme'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Commande passée le {new Date(order.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Détails de livraison</h4>
              <p className="text-sm">
                Méthode: <span className="font-medium">
                  {order.delivery_method === 'delivery' ? 'Livraison' : 'Retrait en magasin'}
                </span>
              </p>
              {order.delivery_address && (
                <p className="text-sm mt-1">
                  Adresse: <span className="font-medium">{order.delivery_address}</span>
                </p>
              )}
              {order.notes && (
                <p className="text-sm mt-1">
                  Notes: <span className="italic">{order.notes}</span>
                </p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold">
                  Total: {Number(order.total_amount).toLocaleString()} FC
                </span>
              </div>

              {showRejectionForm === order.id ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Motif du refus (obligatoire)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectOrder(order.id)}
                      disabled={processing === order.id || !rejectionReason.trim()}
                    >
                      {processing === order.id ? 'Refus...' : 'Confirmer le refus'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectionForm(null);
                        setRejectionReason('');
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleConfirmOrder(order.id)}
                    disabled={processing === order.id}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processing === order.id ? 'Confirmation...' : 'Confirmer la commande'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectionForm(order.id)}
                    disabled={processing === order.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}