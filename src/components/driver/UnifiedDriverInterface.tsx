/**
 * 🎯 Interface Chauffeur Unifiée
 * PHASE 2: Fusionne MobileDriverInterface + ProductionDriverInterface
 * 
 * Affiche TOUTES les commandes (taxi, delivery, marketplace) dans une seule vue
 * Utilise les hooks unifiés de la PHASE 1
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverSubscriptions } from '@/hooks/useDriverSubscriptions';
import DriverStatusToggle from './DriverStatusToggle';
import SubscriptionDepletedAlert from './SubscriptionDepletedAlert';
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
  Navigation,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UnifiedDriverInterfaceProps {
  className?: string;
}

const UnifiedDriverInterface: React.FC<UnifiedDriverInterfaceProps> = ({ className }) => {
  const { status: driverStatus } = useDriverStatus();
  const { 
    loading,
    pendingNotifications,
    activeOrders,
    acceptOrder,
    rejectOrder,
    completeOrder
  } = useDriverDispatch();

  // 🎯 Récupérer les infos d'abonnement
  const { currentSubscription } = useDriverSubscriptions();

  // États pour la navigation
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Notification audio
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmcdCD2V2OzGeSgE=');
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

  // ✅ Filtrer les notifications par type
  const getFilteredNotifications = () => {
    if (activeTab === 'all') return pendingNotifications;
    return pendingNotifications.filter(n => n.type === activeTab);
  };

  // ✅ Filtrer les commandes actives par type
  const getFilteredActiveOrders = () => {
    if (activeTab === 'all') return activeOrders;
    return activeOrders.filter(o => o.type === activeTab);
  };

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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'taxi': return 'Course VTC';
      case 'delivery': return 'Livraison';
      case 'marketplace': return 'Marketplace';
      default: return type;
    }
  };

  const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'taxi': return 'default';
      case 'delivery': return 'secondary';
      case 'marketplace': return 'outline';
      default: return 'secondary';
    }
  };

  const handleAcceptOrder = async (notification: any) => {
    const success = await acceptOrder(notification);
    if (success) {
      toast.success('✅ Commande acceptée !');
    }
  };

  const handleRejectOrder = (notificationId: string) => {
    rejectOrder(notificationId);
    toast.info('Commande refusée');
  };

  const handleCompleteOrder = async (orderId: string, type: string) => {
    const success = await completeOrder(orderId, type as 'taxi' | 'delivery' | 'marketplace');
    if (success) {
      toast.success('✅ Commande terminée !');
    }
  };

  // 🗺️ Fonction pour démarrer la navigation GPS
  const handleStartNavigation = async (order: any) => {
    try {
      const hasPickupCoords = order.pickup_coordinates?.lat && order.pickup_coordinates?.lng;
      const hasDestCoords = (order.destination_coordinates?.lat && order.destination_coordinates?.lng) || 
                           (order.delivery_coordinates?.lat && order.delivery_coordinates?.lng);

      if (!hasPickupCoords || !hasDestCoords) {
        toast.loading('Géocodage des adresses...');
        
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
        
        const tableName = order.type === 'delivery' || order.type === 'marketplace' 
          ? 'delivery_orders' 
          : 'transport_bookings';
        
        const { data: updatedOrder } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', order.id)
          .single();
        
        if (updatedOrder) {
          setSelectedOrder({ ...updatedOrder, type: order.type });
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

  const filteredNotifications = getFilteredNotifications();
  const filteredActiveOrders = getFilteredActiveOrders();

  return (
    <div className={cn("space-y-4", className)}>
      {/* 🚨 Alerte abonnement épuisé */}
      {currentSubscription && (
        <SubscriptionDepletedAlert
          ridesRemaining={currentSubscription.rides_remaining}
          subscriptionStatus={currentSubscription.status}
          planName={currentSubscription.subscription_plans?.name}
        />
      )}

      {/* Driver Status */}
      <DriverStatusToggle />

      {/* ✅ Onglets de filtrage par type de service */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs">
            Tous
            {pendingNotifications.length + activeOrders.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {pendingNotifications.length + activeOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="taxi" className="text-xs">
            <Car className="h-3 w-3 mr-1" />
            VTC
          </TabsTrigger>
          <TabsTrigger value="delivery" className="text-xs">
            <Package className="h-3 w-3 mr-1" />
            Livraison
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="text-xs">
            <ShoppingBag className="h-3 w-3 mr-1" />
            Market
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* ✅ Message quand aucune course disponible */}
          {!loading && filteredNotifications.length === 0 && filteredActiveOrders.length === 0 && (
            <Card className="border-muted">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {activeTab === 'all' ? 'Aucune course disponible' : `Aucune ${getTypeLabel(activeTab).toLowerCase()}`}
                </h3>
                <p className="text-muted-foreground text-center mb-4 max-w-sm">
                  {driverStatus.isOnline ? (
                    <>Vous êtes en ligne et prêt à recevoir des commandes. 
                    Les nouvelles {activeTab === 'all' ? 'commandes' : getTypeLabel(activeTab).toLowerCase()} apparaîtront ici automatiquement.</>
                  ) : (
                    <>Passez en ligne pour recevoir des commandes.</>
                  )}
                </p>
                {driverStatus.isOnline && (
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Actualiser
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pending Notifications */}
          {filteredNotifications.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Bell className="h-5 w-5" />
                  Nouvelles commandes ({filteredNotifications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredNotifications.map((notification) => {
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
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-semibold">{notification.title}</h4>
                            <Badge variant={getTypeBadgeVariant(notification.type)}>
                              {getTypeLabel(notification.type)}
                            </Badge>
                            {notification.urgency === 'high' && (
                              <Badge variant="destructive" className="gap-1">
                                <Zap className="h-3 w-3" />
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {notification.location}
                            </div>
                            {notification.distance && (
                              <div className="flex items-center gap-1 text-primary">
                                <Navigation className="h-3 w-3" />
                                {notification.distance.toFixed(1)} km
                              </div>
                            )}
                            <div className="flex items-center gap-1 font-semibold">
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
                          disabled={loading}
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
          {filteredActiveOrders.length > 0 && (
            <Card className="border-success/20 bg-success/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  Commandes en cours ({filteredActiveOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredActiveOrders.map((order) => {
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
                              {getTypeLabel(order.type)}
                            </h4>
                            <Badge variant={getTypeBadgeVariant(order.type)}>
                              En cours
                            </Badge>
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
                              <p><strong>Produit:</strong> {order.marketplace_orders?.marketplace_products?.title || 'Produit marketplace'}</p>
                              <p><strong>Collecte:</strong> {order.pickup_location}</p>
                              <p><strong>Livraison:</strong> {order.delivery_location}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm mt-2">
                            <div className="flex items-center gap-1 font-semibold">
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
                          Navigation
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
        </TabsContent>
      </Tabs>

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

      {/* Offline State */}
      {!driverStatus.isOnline && (
        <Card className="border-muted/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Vous êtes hors ligne. Activez votre statut pour recevoir des commandes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedDriverInterface;
