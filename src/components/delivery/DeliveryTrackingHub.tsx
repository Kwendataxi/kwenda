/**
 * Hub centralisé pour le suivi de livraison temps réel
 * Combine carte, chat, notifications et suivi de statut
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock, 
  Package, 
  Navigation,
  Truck,
  CheckCircle2,
  Bell,
  Eye
} from 'lucide-react';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import RealTimeDeliveryChat from './RealTimeDeliveryChat';
import { useEnhancedDeliveryTracking } from '@/hooks/useEnhancedDeliveryTracking';
// import { usePushNotifications } from '@/hooks/usePushNotifications';

interface DeliveryTrackingHubProps {
  orderId: string;
  onBack?: () => void;
}

export default function DeliveryTrackingHub({ orderId, onBack }: DeliveryTrackingHubProps) {
  const [activeTab, setActiveTab] = useState('tracking');
  const [showChat, setShowChat] = useState(false);
  
  const {
    order,
    statusLabel,
    estimatedArrival,
    deliveryProgress,
    driverProfile,
    driverLocation,
    recipientProfile,
    notifications,
    unreadNotifications,
    contactDriver,
    markNotificationAsRead
  } = useEnhancedDeliveryTracking(orderId);

  // Note: Push notifications à implémenter avec un hook dédié
  const isPushSupported = 'Notification' in window;
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  useEffect(() => {
    // Vérifier et demander la permission pour les notifications push
    if (isPushSupported) {
      if (Notification.permission === 'granted') {
        setIsPushEnabled(true);
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setIsPushEnabled(permission === 'granted');
        });
      }
    }
  }, [isPushSupported]);

  const getPickupCoords = () => {
    const coords = order?.pickup_coordinates;
    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      return { lat: coords.lat, lng: coords.lng };
    }
    return undefined;
  };

  const getDestinationCoords = () => {
    const coords = order?.delivery_coordinates;
    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      return { lat: coords.lat, lng: coords.lng };
    }
    return undefined;
  };

  const getDriverLocationForMap = () => {
    if (driverLocation?.latitude && driverLocation?.longitude) {
      return {
        lat: driverLocation.latitude,
        lng: driverLocation.longitude,
        heading: driverLocation.heading || null
      };
    }
    return undefined;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      driver_assigned: 'bg-purple-500',
      picked_up: 'bg-orange-500',
      in_transit: 'bg-green-500',
      delivered: 'bg-emerald-600',
      cancelled: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec statut principal */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)} animate-pulse`} />
            <div>
              <h1 className="text-lg font-bold">{statusLabel}</h1>
              <p className="text-sm opacity-90">Commande #{orderId.slice(-8)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold">
              {formatPrice(order.estimated_price || order.actual_price || 0)}
            </div>
            {estimatedArrival && (
              <div className="text-xs opacity-90">
                ETA: {estimatedArrival}
              </div>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <Progress value={deliveryProgress} className="h-2 bg-white/20" />
          <div className="flex justify-between text-xs mt-1 opacity-75">
            <span>Confirmée</span>
            <span>En route</span>
            <span>Livrée</span>
          </div>
        </div>
      </div>

      {/* Contenu principal avec onglets */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 glassmorphism">
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Carte
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alertes
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="w-5 h-5 text-xs rounded-full">
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Onglet Carte et Suivi */}
          <TabsContent value="tracking" className="space-y-4">
            {/* Carte interactive */}
            <Card className="glassmorphism border-0 shadow-xl">
              <CardContent className="p-0">
                <GoogleMapsKwenda
                  pickup={getPickupCoords()}
                  destination={getDestinationCoords()}
                  driverLocation={getDriverLocationForMap()}
                  showRoute={Boolean(getPickupCoords() && getDestinationCoords())}
                  height="300px"
                  deliveryMode={order.delivery_type || 'flex'}
                />
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <div className="grid grid-cols-2 gap-3">
              {driverProfile?.phone_number && (
                <Button
                  onClick={contactDriver}
                  className="h-12 glassmorphism-button border border-primary/30 hover:border-primary"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler le livreur
                </Button>
              )}
              
              <Button
                onClick={() => setShowChat(true)}
                variant="outline"
                className="h-12 glassmorphism-button border border-primary/30 hover:border-primary"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </div>

            {/* Informations du livreur */}
            {driverProfile && (
              <Card className="glassmorphism border-0 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={driverProfile.profile_photo_url} />
                      <AvatarFallback>
                        <Truck className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{driverProfile.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {driverProfile.vehicle_make} {driverProfile.vehicle_model} • 
                        ⭐ {driverProfile.rating_average?.toFixed(1) || 'N/A'}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {order.delivery_type?.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Détails */}
          <TabsContent value="details" className="space-y-4">
            {/* Adresses */}
            <Card className="glassmorphism border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  Itinéraire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Collecte</p>
                    <p className="font-medium">{order.pickup_location}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Livraison</p>
                    <p className="font-medium">{order.delivery_location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations de la commande */}
            <Card className="glassmorphism border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Détails du colis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{order.package_type || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{order.delivery_type?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix</span>
                  <span className="font-bold text-primary">
                    {formatPrice(order.estimated_price || order.actual_price || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`glassmorphism border-0 shadow-xl cursor-pointer transition-all hover:shadow-glow ${
                    !notification.read ? 'border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune notification</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full h-3/4 bg-background rounded-t-xl">
            <div className="p-4 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Chat en développement</p>
              <p className="text-sm text-muted-foreground">
                Le chat sera disponible prochainement
              </p>
              <Button 
                onClick={() => setShowChat(false)}
                className="mt-4"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bouton retour */}
      {onBack && (
        <div className="p-4">
          <Button onClick={onBack} variant="outline" className="w-full">
            Retour à l'accueil
          </Button>
        </div>
      )}
    </div>
  );
}