import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnifiedDispatcher } from '@/hooks/useUnifiedDispatcher';
import DriverStatusToggle from './DriverStatusToggle';
import { NavigationModal } from './NavigationModal';
import { supabase } from '@/integrations/supabase/client';
import { 
  Car,
  Package, 
  ShoppingBag,
  CheckCircle,
  XCircle,
  MapPin,
  Euro,
  Bell,
  AlertCircle,
  Navigation
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

  // États pour la navigation
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Notification audio
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgE=');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Cannot play audio:', e));
    } catch (error) {
      console.log('Audio notification failed:', error);
    }
  };

  // Effet pour jouer le son quand une nouvelle notification arrive
  React.useEffect(() => {
    if (pendingNotifications.length > 0) {
      playNotificationSound();
    }
  }, [pendingNotifications.length]);

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

  // 🗺️ Fonction pour démarrer la navigation GPS
  const handleStartNavigation = async (order: any) => {
    try {
      // Vérifier si les coordonnées existent
      const hasPickupCoords = order.pickup_coordinates?.lat && order.pickup_coordinates?.lng;
      const hasDestCoords = (order.destination_coordinates?.lat && order.destination_coordinates?.lng) || 
                           (order.delivery_coordinates?.lat && order.delivery_coordinates?.lng);

      if (!hasPickupCoords || !hasDestCoords) {
        toast.loading('Géocodage des adresses...');
        
        // Appeler Edge Function pour géocoder
        const { data, error } = await supabase.functions.invoke('geocode-order', {
          body: { 
            orderId: order.id, 
            orderType: order.type === 'delivery' || order.type === 'marketplace' ? 'delivery' : 'transport'
          }
        });
        
        if (error) {
          console.error('Geocoding error:', error);
          toast.error('Impossible de calculer l\'itinéraire');
          return;
        }

        toast.dismiss();
        toast.success('Itinéraire calculé !');
        
        // Recharger la commande avec les nouvelles coordonnées
        const tableName = order.type === 'delivery' || order.type === 'marketplace' 
          ? 'delivery_orders' 
          : 'transport_bookings';
        
        const { data: updatedOrder } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', order.id)
          .single();
        
        if (updatedOrder) {
          setSelectedOrder(updatedOrder);
          setNavigationOpen(true);
        }
      } else {
        setSelectedOrder(order);
        setNavigationOpen(true);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Erreur lors du lancement de la navigation');
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
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => handleStartNavigation(order)}
                      variant="outline"
                      className="flex-1"
                      disabled={loading}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Navigation GPS
                    </Button>
                    <Button
                      onClick={() => handleCompleteOrder(order.id, order.type)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Terminer
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Modal de navigation GPS */}
      {selectedOrder && navigationOpen && (
        <NavigationModal
          open={navigationOpen}
          onClose={() => {
            setNavigationOpen(false);
            setSelectedOrder(null);
          }}
          orderId={selectedOrder.id}
          orderType={selectedOrder.type === 'delivery' || selectedOrder.type === 'marketplace' ? 'delivery' : 'transport'}
          pickup={{
            lat: selectedOrder.pickup_coordinates?.lat || 0,
            lng: selectedOrder.pickup_coordinates?.lng || 0,
            address: selectedOrder.pickup_location || ''
          }}
          destination={{
            lat: (selectedOrder.destination_coordinates?.lat || selectedOrder.delivery_coordinates?.lat) || 0,
            lng: (selectedOrder.destination_coordinates?.lng || selectedOrder.delivery_coordinates?.lng) || 0,
            address: (selectedOrder.destination || selectedOrder.delivery_location) || ''
          }}
          customerPhone={selectedOrder.user_phone}
        />
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