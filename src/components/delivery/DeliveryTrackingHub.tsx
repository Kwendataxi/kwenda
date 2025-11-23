/**
 * Hub centralisé pour le suivi de livraison temps réel
 * Combine carte, chat, notifications et suivi de statut
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
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
import { useUserRole } from '@/hooks/useUserRole';
import DriverDeliveryActions from '@/components/driver/DriverDeliveryActions';
import { DeliveryDriverChatModal } from './DeliveryDriverChatModal';

interface DeliveryTrackingHubProps {
  orderId: string;
  onBack?: () => void;
}

export default function DeliveryTrackingHub({ orderId, onBack }: DeliveryTrackingHubProps) {
  const [activeTab, setActiveTab] = useState('tracking');
  const [showChat, setShowChat] = useState(false);
  const { userRole } = useUserRole();
  const { toast } = useToast();
  
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
    if (!coords) return undefined;
    
    // Gérer le format {lat, lng, type: 'geocoded'}
    if (typeof coords === 'object' && coords.lat !== undefined && coords.lng !== undefined) {
      return { 
        lat: typeof coords.lat === 'number' ? coords.lat : Number(coords.lat), 
        lng: typeof coords.lng === 'number' ? coords.lng : Number(coords.lng) 
      };
    }
    
    // Gérer le format JSON stringifié
    try {
      if (typeof coords === 'string') {
        const parsed = JSON.parse(coords);
        if (parsed.lat && parsed.lng) {
          return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
        }
      }
    } catch (e) {
      console.error('Error parsing pickup coordinates:', e);
    }
    
    return undefined;
  };

  const getDestinationCoords = () => {
    const coords = order?.delivery_coordinates;
    if (!coords) return undefined;
    
    // Gérer le format {lat, lng, type: 'geocoded'}
    if (typeof coords === 'object' && coords.lat !== undefined && coords.lng !== undefined) {
      return { 
        lat: typeof coords.lat === 'number' ? coords.lat : Number(coords.lat), 
        lng: typeof coords.lng === 'number' ? coords.lng : Number(coords.lng) 
      };
    }
    
    // Gérer le format JSON stringifié
    try {
      if (typeof coords === 'string') {
        const parsed = JSON.parse(coords);
        if (parsed.lat && parsed.lng) {
          return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
        }
      }
    } catch (e) {
      console.error('Error parsing destination coordinates:', e);
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

  // ✅ Afficher le chargement seulement si vraiment en cours de chargement
  const state = useEnhancedDeliveryTracking(orderId);
  
  if (state.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  // ✅ Si pas d'order trouvé après chargement
  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold text-lg">Commande introuvable</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Cette commande n'existe pas ou vous n'y avez pas accès
            </p>
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              Retour
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/10 flex flex-col">
      {/* Header moderne avec glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 backdrop-blur-xl bg-gradient-to-r from-primary/90 to-secondary/90 border-b border-white/20 shadow-2xl"
      >
        <div className="p-4 space-y-4">
          {/* Status principal avec animation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-3 h-3 rounded-full ${getStatusColor(order.status)} shadow-lg`}
              />
              <div>
                <h1 className="text-lg font-bold text-white drop-shadow-lg">
                  {statusLabel}
                </h1>
                <p className="text-sm text-white/80">
                  Commande #{orderId.slice(-8)}
                </p>
              </div>
            </div>
            
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-right backdrop-blur-md bg-white/10 px-4 py-2 rounded-xl border border-white/20"
            >
              <div className="text-lg font-bold text-white">
                {formatPrice(order.estimated_price || order.actual_price || 0)}
              </div>
              {estimatedArrival && (
                <div className="text-xs text-white/80">
                  ETA: {estimatedArrival}
                </div>
              )}
            </motion.div>
          </div>

          {/* Barre de progression moderne */}
          <div className="space-y-2">
            <Progress 
              value={deliveryProgress} 
              className="h-3 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden"
            />
            <div className="flex justify-between text-xs text-white/80 font-medium">
              <span>📋 Confirmée</span>
              <span>🚗 En route</span>
              <span>✅ Livrée</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contenu principal avec onglets */}
      <div className="flex-1 content-scrollable p-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 backdrop-blur-xl bg-white/10 dark:bg-gray-900/50 border border-white/20 rounded-2xl shadow-xl p-1 sticky top-0 z-10 mb-4">
            <TabsTrigger 
              value="tracking" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Carte</span>
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Détails</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="relative flex items-center gap-2 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Alertes</span>
              {unreadNotifications > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg"
                >
                  {unreadNotifications}
                </motion.div>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Onglet Carte et Suivi */}
          <TabsContent value="tracking" className="space-y-4">
            {/* Carte interactive avec glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-2 border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  <GoogleMapsKwenda
                    pickup={getPickupCoords()}
                    destination={getDestinationCoords()}
                    driverLocation={getDriverLocationForMap()}
                    showRoute={Boolean(getPickupCoords() && getDestinationCoords())}
                    height="320px"
                    deliveryMode={order.delivery_type || 'flex'}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions rapides avec animations */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-3"
            >
              {driverProfile?.phone_number && (
                <Button
                  onClick={contactDriver}
                  className="h-14 backdrop-blur-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-2 border-white/20 shadow-xl rounded-2xl font-semibold text-white transition-all duration-300 hover:scale-105"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Appeler
                </Button>
              )}
              
              <Button
                onClick={() => setShowChat(true)}
                className="h-14 backdrop-blur-xl bg-white/10 dark:bg-gray-800/50 border-2 border-primary/30 hover:border-primary hover:bg-white/20 shadow-xl rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat
              </Button>
            </motion.div>

            {/* Message recherche avec animations */}
            {!driverProfile && order.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="backdrop-blur-xl bg-gradient-to-r from-yellow-50/90 to-orange-50/90 dark:from-yellow-950/50 dark:to-orange-950/50 border-2 border-yellow-400/40 shadow-xl rounded-2xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center"
                      >
                        <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-100 mb-1">
                          🔍 Recherche de chauffeur en cours...
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Nous recherchons le meilleur chauffeur <span className="font-semibold uppercase">{order.delivery_type}</span> disponible près de vous
                        </p>
                        <div className="mt-3 flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                              className="w-2 h-2 bg-yellow-500 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Informations du livreur avec glassmorphism */}
            {driverProfile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="backdrop-blur-xl bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 border-2 border-white/20 shadow-2xl rounded-2xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="relative"
                      >
                        <Avatar className="w-16 h-16 border-4 border-white/50 shadow-xl">
                          <AvatarImage src={driverProfile.profile_photo_url} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
                            <Truck className="w-8 h-8" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                      </motion.div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground mb-1">
                          {driverProfile.display_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{driverProfile.vehicle_make} {driverProfile.vehicle_model}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-semibold">{driverProfile.rating_average?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Badge 
                        variant="secondary" 
                        className="px-4 py-2 text-sm font-bold uppercase backdrop-blur-md bg-primary/20 border-2 border-primary/30 shadow-lg"
                      >
                        {order.delivery_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Section paiement si livraison terminée */}
            {order.status === 'delivered' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="backdrop-blur-xl bg-gradient-to-br from-green-50/90 to-emerald-50/90 dark:from-green-950/50 dark:to-emerald-950/50 border-2 border-green-500/40 shadow-2xl rounded-2xl overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-green-900 dark:text-green-100">
                          ✅ Livraison terminée !
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Votre colis a été livré avec succès
                        </p>
                      </div>
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                        <span className="font-medium">Montant final</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(order.actual_price || order.estimated_price || 0)}
                        </span>
                      </div>
                      
                      <Button
                        className="w-full h-14 backdrop-blur-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-xl rounded-xl transition-all duration-300 hover:scale-105"
                        onClick={() => {
                          toast({
                            title: "Paiement",
                            description: "Fonctionnalité en cours d'implémentation",
                          });
                        }}
                      >
                        💳 Payer maintenant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Onglet Détails */}
          <TabsContent value="details" className="space-y-4">
            {/* Contacts */}
            {(order.sender_name || order.recipient_name) && (
              <Card className="bg-card border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.sender_name && (
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Expéditeur</p>
                          <p className="font-medium">{order.sender_name}</p>
                          {order.sender_phone && (
                            <p className="text-sm text-muted-foreground">{order.sender_phone}</p>
                          )}
                        </div>
                      </div>
                      {order.sender_phone && (
                        <a 
                          href={`tel:${order.sender_phone}`}
                          className="p-2 hover:bg-green-500/20 rounded-full transition-colors"
                        >
                          <Phone className="w-4 h-4 text-green-600" />
                        </a>
                      )}
                    </div>
                  )}
                  
                  {order.recipient_name && (
                    <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Destinataire</p>
                          <p className="font-medium">{order.recipient_name}</p>
                          {order.recipient_phone && (
                            <p className="text-sm text-muted-foreground">{order.recipient_phone}</p>
                          )}
                        </div>
                      </div>
                      {order.recipient_phone && (
                        <a 
                          href={`tel:${order.recipient_phone}`}
                          className="p-2 hover:bg-red-500/20 rounded-full transition-colors"
                        >
                          <Phone className="w-4 h-4 text-red-600" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Adresses */}
            <Card className="bg-card border border-border shadow-lg">
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
            <Card className="bg-card border border-border shadow-lg">
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
                  className={`bg-card border border-border shadow-lg cursor-pointer transition-all hover:shadow-glow ${
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

      {/* Chat modal avec DeliveryDriverChatModal */}
      {showChat && driverProfile && order && (
        <DeliveryDriverChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          driverData={{
            driver_id: driverProfile.id,
            driver_profile: {
              display_name: driverProfile.display_name,
              phone_number: driverProfile.phone_number || '',
              rating_average: driverProfile.rating_average || 0,
              vehicle_type: driverProfile.vehicle_type || 'N/A',
              vehicle_plate: driverProfile.license_plate || 'N/A'
            },
            distance: 0,
            estimated_arrival: estimatedArrival ? parseInt(estimatedArrival.split(' ')[0]) : 15
          }}
          orderId={orderId}
          deliveryPrice={order.estimated_price || order.actual_price || 0}
        />
      )}

      {/* Actions chauffeur si connecté en tant que chauffeur */}
      {userRole === 'chauffeur' && (
        <div className="sticky bottom-0 p-4 border-t bg-background/98 backdrop-blur-xl z-20 safe-area-padding">
          <DriverDeliveryActions 
            order={{ 
              id: orderId,
              status: order.status,
              pickup_location: order.pickup_location,
              delivery_location: order.delivery_location,
              pickup_coordinates: order.pickup_coordinates,
              delivery_coordinates: order.delivery_coordinates,
              delivery_type: order.delivery_type || 'flex',
              estimated_price: order.estimated_price || order.actual_price || 0,
              user_id: order.user_id,
              sender_name: order.sender_name,
              sender_phone: order.sender_phone,
              recipient_name: order.recipient_name,
              recipient_phone: order.recipient_phone
            }}
            onStatusUpdate={() => window.location.reload()}
          />
        </div>
      )}

      {/* Bouton retour - toujours visible */}
      {onBack && (
        <div className={`sticky bottom-0 p-4 bg-background/98 backdrop-blur-xl z-20 safe-area-padding ${userRole === 'chauffeur' ? '' : 'border-t'}`}>
          <Button onClick={onBack} variant="outline" className="w-full min-touch-target bg-card hover:bg-muted">
            Retour à l'accueil
          </Button>
        </div>
      )}
    </div>
  );
}