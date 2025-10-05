import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { useMarketplaceOrders } from '@/hooks/useMarketplaceOrders';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  MessageSquare,
  Star,
  RefreshCw,
  Search
} from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RatingDialog } from '../rating/RatingDialog';
import { CancellationDialog } from '../shared/CancellationDialog';

export const PurchaseManagement: React.FC = () => {
  const { orders, loading, refetch, cancelOrder } = useMarketplaceOrders();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingDialog, setRatingDialog] = useState<{
    ratedUserId: string;
    ratedUserName: string;
    orderId: string;
  } | null>(null);
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    orderId: string;
    status: string;
  } | null>(null);

  // Filter orders where current user is the buyer
  const purchaseOrders = orders.filter(order => order.buyer_id === user?.id);

  // Apply search and status filters
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.product?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.seller?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <Package className="w-4 h-4" />;
      case 'delivered': return <Truck className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmé';
      case 'delivered': return 'Livré';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const handleCancelOrder = async (reason: string, cancellationType: string) => {
    if (!cancelDialog) return;

    try {
      await cancelOrder(cancelDialog.orderId, reason, cancellationType);
      toast({
        title: "Commande annulée",
        description: "Votre commande a été annulée avec succès. Le remboursement sera effectué sous peu.",
      });
      setCancelDialog(null);
      refetch();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la commande",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher par produit ou vendeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmé</SelectItem>
            <SelectItem value="delivered">Livré</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun achat trouvé</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || statusFilter !== 'all' 
                ? "Aucun achat ne correspond à vos critères de recherche."
                : "Vous n'avez encore effectué aucun achat."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {order.product?.images?.[0] ? (
                      <img 
                        src={order.product.images[0]} 
                        alt={order.product.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="font-semibold text-lg">{order.product?.title}</h3>
                      <Badge className={`w-fit ${getStatusColor(order.status)}`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>Vendeur: {order.seller?.display_name}</p>
                      <p>Quantité: {order.quantity}</p>
                      <p>Prix unitaire: {order.unit_price?.toLocaleString()} FC</p>
                      <p>Total: {order.total_amount?.toLocaleString()} FC</p>
                    </div>

                    {order.delivery_address && (
                      <p className="text-sm text-muted-foreground">
                        Livraison: {order.delivery_address}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Commandé le {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Contacter le vendeur
                  </Button>
                  
                  {order.status === 'delivered' && (
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Confirmer réception
                    </Button>
                  )}
                  
                  {order.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={() => setRatingDialog({
                        ratedUserId: order.seller_id,
                        ratedUserName: order.seller?.display_name || 'Vendeur',
                        orderId: order.id
                      })}
                    >
                      <Star className="w-4 h-4" />
                      Laisser un avis
                    </Button>
                  )}
                  
                  {order.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 text-destructive"
                      onClick={() => setCancelDialog({ 
                        open: true, 
                        orderId: order.id,
                        status: order.status 
                      })}
                    >
                      <XCircle className="w-4 h-4" />
                      Annuler
                    </Button>
                  )}
                  
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Racheter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rating Dialog */}
      {ratingDialog && (
        <RatingDialog
          open={!!ratingDialog}
          onOpenChange={(open) => !open && setRatingDialog(null)}
          ratedUserId={ratingDialog.ratedUserId}
          ratedUserName={ratingDialog.ratedUserName}
          ratedUserType="seller"
          orderId={ratingDialog.orderId}
          orderType="marketplace"
          onSuccess={() => {
            refetch();
            setRatingDialog(null);
          }}
        />
      )}

      {/* Cancellation Dialog */}
      {cancelDialog && (
        <CancellationDialog
          isOpen={cancelDialog.open}
          onClose={() => setCancelDialog(null)}
          onConfirm={handleCancelOrder}
          title="Annuler la commande"
          userType="client"
          bookingType="marketplace"
          bookingDetails={{
            status: cancelDialog.status
          }}
        />
      )}
    </div>
  );
};