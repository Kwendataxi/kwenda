/**
 * Tracker de livraison amélioré avec temps réel et chat
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
  ChevronLeft,
  Camera,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';

interface EnhancedDeliveryTrackerProps {
  orderId: string;
  onBack?: () => void;
}

interface DeliveryOrder {
  id: string;
  status: string;
  pickup_location: string;
  delivery_location: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: string;
  estimated_price: number;
  actual_price?: number;
  package_type?: string;
  recipient_name?: string;
  recipient_phone?: string;
  driver_id?: string;
  driver_assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  created_at: string;
  driver?: {
    id: string;
    display_name: string;
    phone_number: string;
    rating_average: number;
    vehicle_model: string;
    vehicle_plate: string;
    profile_photo_url?: string;
  };
  delivery_proof?: any;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  updated_at: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Commande reçue', progress: 10, color: 'secondary' },
  confirmed: { label: 'Commande confirmée', progress: 20, color: 'primary' },
  driver_assigned: { label: 'Livreur assigné', progress: 40, color: 'primary' },
  picked_up: { label: 'Colis récupéré', progress: 60, color: 'primary' },
  in_transit: { label: 'En cours de livraison', progress: 80, color: 'primary' },
  delivered: { label: 'Livré avec succès', progress: 100, color: 'success' },
  cancelled: { label: 'Commande annulée', progress: 0, color: 'destructive' }
};

export default function EnhancedDeliveryTracker({ orderId, onBack }: EnhancedDeliveryTrackerProps) {
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [activeTab, setActiveTab] = useState('tracking');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [eta, setEta] = useState<string | null>(null);

  // Charger les données de commande
  const fetchOrderData = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          driver:chauffeurs(
            id,
            display_name,
            phone_number,
            rating_average,
            vehicle_model,
            vehicle_plate,
            profile_photo_url
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      const cleanedData = {
        ...data,
        driver: data.driver_id && data.driver && typeof data.driver === 'object' && !Array.isArray(data.driver) ? {
          id: (data.driver as any).id || '',
          display_name: (data.driver as any).display_name || 'Livreur',
          phone_number: (data.driver as any).phone_number || '',
          rating_average: (data.driver as any).rating_average || 0,
          vehicle_model: (data.driver as any).vehicle_model || '',
          vehicle_plate: (data.driver as any).vehicle_plate || '',
          profile_photo_url: (data.driver as any).profile_photo_url
        } : undefined
      };
      
      setOrder(cleanedData as DeliveryOrder);
      
      // Charger la position du livreur si assigné
      if (data.driver_id) {
        loadDriverLocation(data.driver_id);
      }
      
    } catch (error) {
      console.error('Erreur chargement commande:', error);
      toast.error('Impossible de charger les détails de la commande');
    } finally {
      setLoading(false);
    }
  };

  // Charger la position du livreur
  const loadDriverLocation = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (error) throw error;
      
      setDriverLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        updated_at: data.updated_at
      });
    } catch (error) {
      console.error('Erreur chargement position livreur:', error);
    }
  };

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_notifications')
        .select('*')
        .eq('delivery_order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  // Calculer l'ETA
  const calculateETA = () => {
    if (!driverLocation || !order?.delivery_coordinates) return;
    
    const distance = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      order.delivery_coordinates.lat,
      order.delivery_coordinates.lng
    );
    
    const estimatedMinutes = Math.round(distance * 3); // 3 min par km pour livraison
    setEta(`${estimatedMinutes} min`);
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Abonnements temps réel
  useEffect(() => {
    fetchOrderData();
    loadNotifications();

    const orderChannel = supabase
      .channel(`delivery-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔄 Order updated:', payload);
          fetchOrderData();
          
          const newStatus = payload.new.status;
          if (newStatus === 'driver_assigned') {
            toast.success('Livreur assigné ! Il se dirige vers le point de collecte.');
          } else if (newStatus === 'picked_up') {
            toast.info('Colis récupéré. Livraison en cours...');
          } else if (newStatus === 'delivered') {
            toast.success('Colis livré avec succès !');
          }
        }
      )
      .subscribe();

    const notificationChannel = supabase
      .channel(`delivery-notifications-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_notifications',
          filter: `delivery_order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('🔔 New notification:', payload);
          loadNotifications();
          toast.info(payload.new.message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, [orderId]);

  // Abonnement position livreur
  useEffect(() => {
    if (!order?.driver_id) return;

    const driverChannel = supabase
      .channel(`driver-location-${order.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${order.driver_id}`
        },
        (payload) => {
          console.log('📍 Driver location updated:', payload);
          loadDriverLocation(order.driver_id!);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(driverChannel);
    };
  }, [order?.driver_id]);

  // Calculer l'ETA quand la position change
  useEffect(() => {
    calculateETA();
  }, [driverLocation, order]);

  const handleCallDriver = () => {
    if (order?.driver?.phone_number) {
      window.open(`tel:${order.driver.phone_number}`);
    } else {
      toast.error('Numéro du livreur non disponible');
    }
  };

  const getStatusInfo = () => {
    if (!order) return STATUS_CONFIG.pending;
    return STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

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

  const statusInfo = getStatusInfo();
  const hasDriver = order?.driver_id && order?.driver;
  const canOpenChat = hasDriver && ['driver_assigned', 'picked_up', 'in_transit'].includes(order?.status || '');
  const isCompleted = order?.status === 'delivered';
  const showMap = hasDriver && ['driver_assigned', 'picked_up', 'in_transit'].includes(order?.status || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Commande non trouvée</p>
            {onBack && (
              <Button onClick={onBack} variant="outline" className="mt-4">
                Retour
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="text-primary-foreground">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full bg-white animate-pulse`} />
            <div>
              <h1 className="text-lg font-bold">{statusInfo.label}</h1>
              <p className="text-sm opacity-90">Commande #{orderId.slice(-8)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold">
              {formatPrice(order.estimated_price || order.actual_price || 0)}
            </div>
            {eta && ['driver_assigned', 'picked_up', 'in_transit'].includes(order.status) && (
              <div className="text-xs opacity-90">
                ETA: {eta}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Progress value={statusInfo.progress} className="h-2 bg-white/20" />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Suivi
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Alertes
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="w-5 h-5 text-xs rounded-full">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Onglet Suivi */}
          <TabsContent value="tracking" className="space-y-4">
            {/* Carte temps réel */}
            {showMap && (
              <Card>
                <CardContent className="p-0">
                  <GoogleMapsKwenda
                    pickup={getPickupCoords()}
                    destination={getDestinationCoords()}
                    driverLocation={getDriverLocationForMap()}
                    showRoute={Boolean(getPickupCoords() && getDestinationCoords())}
                    height="250px"
                    deliveryMode={order.delivery_type as "flash" | "flex" | "maxicharge"}
                  />
                </CardContent>
              </Card>
            )}

            {/* Actions rapides */}
            <div className="grid grid-cols-2 gap-3">
              {order.driver?.phone_number && (
                <Button
                  onClick={handleCallDriver}
                  className="h-12"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler le livreur
                </Button>
              )}
              
              {canOpenChat && (
                <Button
                  onClick={() => setShowChat(true)}
                  variant="outline"
                  className="h-12"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              )}
            </div>

            {/* Informations du livreur */}
            {hasDriver && order.driver && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={order.driver.profile_photo_url} />
                      <AvatarFallback>
                        <Truck className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{order.driver.display_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.driver.vehicle_model} • ⭐ {order.driver.rating_average?.toFixed(1) || 'N/A'}
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
            <Card>
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
                    {order.recipient_name && (
                      <p className="text-sm text-muted-foreground">À l'attention de: {order.recipient_name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations du colis */}
            <Card>
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

            {/* Preuve de livraison si disponible */}
            {isCompleted && order.delivery_proof && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    Preuve de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.delivery_proof.photo_taken && (
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Photo de livraison prise</span>
                    </div>
                  )}
                  {order.delivery_proof.recipient_name && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Reçu par: {order.delivery_proof.recipient_name}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Livré le {new Date(order.delivered_at!).toLocaleString('fr-FR')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString('fr-FR')}
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

      {/* Chat modal placeholder */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full h-3/4 bg-background rounded-t-xl">
            <div className="p-4 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Chat en développement</p>
              <Button onClick={() => setShowChat(false)} className="mt-4">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}