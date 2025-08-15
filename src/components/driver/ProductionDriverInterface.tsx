import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnifiedDispatcher } from '@/hooks/useUnifiedDispatcher';
import DriverStatusToggle from './DriverStatusToggle';
import { 
  Car,
  Package, 
  ShoppingBag,
  CheckCircle,
  XCircle,
  MapPin,
  Euro,
  Bell,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProductionDriverInterfaceProps {
  className?: string;
}

const ProductionDriverInterface: React.FC<ProductionDriverInterfaceProps> = ({ className }) => {
  const { 
    loading,
    dispatchStatus,
    pendingNotifications,
    activeOrders,
    acceptOrder,
    rejectOrder,
    completeOrder
  } = useUnifiedDispatcher();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'taxi': return Car;
      case 'delivery': return Package;
      case 'marketplace': return ShoppingBag;
      default: return Bell;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'medium': return 'bg-warning/10 border-warning/30 text-warning';
      case 'low': return 'bg-info/10 border-info/30 text-info';
      default: return 'bg-muted/10 border-muted/30 text-muted-foreground';
    }
  };

  const handleAcceptOrder = async (notification: any) => {
    const success = await acceptOrder(notification);
    if (success) {
      toast.success('Commande acceptée !');
    }
  };

  const handleRejectOrder = (notificationId: string) => {
    rejectOrder(notificationId);
    toast.info('Commande refusée');
  };

  const handleCompleteOrder = async (orderId: string, type: string) => {
    const success = await completeOrder(orderId, type);
    if (success) {
      toast.success('Commande terminée !');
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Driver Status */}
      <DriverStatusToggle />

      {/* Pending Notifications */}
      {pendingNotifications.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Bell className="h-5 w-5" />
              Nouvelles commandes ({pendingNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <div 
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg border-2",
                    getUrgencyColor(notification.urgency)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-6 w-6 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{notification.title}</h4>
                        <Badge 
                          variant={notification.urgency === 'high' ? 'destructive' : 'secondary'}
                        >
                          {notification.urgency === 'high' ? 'Urgent' : 'Normal'}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {notification.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {notification.estimatedPrice.toLocaleString()} CDF
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => handleAcceptOrder(notification)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accepter
                    </Button>
                    <Button
                      onClick={() => handleRejectOrder(notification.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <Card className="border-success/20 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              Commandes en cours ({activeOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeOrders.map((order) => {
              const Icon = getNotificationIcon(order.type);
              return (
                <div 
                  key={order.id}
                  className="p-4 rounded-lg border border-success/30 bg-card"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-6 w-6 mt-1 text-success" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {order.type === 'taxi' ? 'Course' : 
                           order.type === 'delivery' ? 'Livraison' : 
                           'Livraison Marketplace'}
                        </h4>
                        <Badge variant="default">En cours</Badge>
                      </div>
                      
                      {order.type === 'taxi' && (
                        <div className="space-y-1 text-sm">
                          <p><strong>Départ:</strong> {order.pickup_location}</p>
                          <p><strong>Destination:</strong> {order.destination}</p>
                        </div>
                      )}
                      
                      {order.type === 'delivery' && (
                        <div className="space-y-1 text-sm">
                          <p><strong>Collecte:</strong> {order.pickup_location}</p>
                          <p><strong>Livraison:</strong> {order.delivery_location}</p>
                          <p><strong>Type:</strong> {order.delivery_type}</p>
                        </div>
                      )}
                      
                      {order.type === 'marketplace' && (
                        <div className="space-y-1 text-sm">
                          <p><strong>Produit:</strong> {order.marketplace_orders?.marketplace_products?.title}</p>
                          <p><strong>Collecte:</strong> {order.pickup_location}</p>
                          <p><strong>Livraison:</strong> {order.delivery_location}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm mt-2">
                        <div className="flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {(order.estimated_price || order.delivery_fee || 0).toLocaleString()} CDF
                        </div>
                        <Badge variant="outline">
                          {order.status || order.assignment_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleCompleteOrder(order.id, order.type)}
                    disabled={loading}
                    className="w-full mt-3"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Terminer la commande
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* No Orders State */}
      {!dispatchStatus.isOnline && (
        <Card className="border-muted/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Vous êtes hors ligne. Activez votre statut pour recevoir des commandes.
            </p>
          </CardContent>
        </Card>
      )}

      {dispatchStatus.isOnline && pendingNotifications.length === 0 && activeOrders.length === 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-primary">
              En attente de commandes... Vous recevrez une notification dès qu'une commande sera disponible.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductionDriverInterface;