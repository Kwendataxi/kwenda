/**
 * Hub centralisé pour le suivi de livraison temps réel
 * Design soft-modern: pas de gradients agressifs, UI épurée et professionnelle
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock, 
  Package, 
  Navigation,
  Truck,
  Bike,
  Container,
  CheckCircle2,
  Bell,
  ArrowLeft,
  X,
  Check,
  AlertCircle,
  Loader2,
  type LucideIcon
} from 'lucide-react';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { useEnhancedDeliveryTracking } from '@/hooks/useEnhancedDeliveryTracking';
import { useUserRole } from '@/hooks/useUserRole';
import DriverDeliveryActions from '@/components/driver/DriverDeliveryActions';
import { DeliveryDriverChatModal } from './DeliveryDriverChatModal';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Motifs d'annulation prédéfinis
const CANCEL_REASONS = [
  { id: 'changed_mind', label: "J'ai changé d'avis" },
  { id: 'wrong_address', label: "Mauvaise adresse" },
  { id: 'found_alternative', label: "J'ai trouvé une autre solution" },
  { id: 'too_expensive', label: "Prix trop élevé" },
  { id: 'driver_delayed', label: "Délai d'attente trop long" },
  { id: 'other', label: "Autre raison" }
];

interface DeliveryTrackingHubProps {
  orderId: string;
  onBack?: () => void;
}

// Status configuration for the timeline
const STATUS_STEPS = [
  { status: 'pending', label: 'Créée', index: 0 },
  { status: 'confirmed', label: 'Confirmée', index: 1 },
  { status: 'driver_assigned', label: 'Livreur assigné', index: 1 },
  { status: 'picked_up', label: 'Collecté', index: 2 },
  { status: 'in_transit', label: 'En route', index: 3 },
  { status: 'delivered', label: 'Livré', index: 4 }
];

const getStatusIndex = (status: string) => {
  const step = STATUS_STEPS.find(s => s.status === status);
  return step?.index ?? 0;
};

const getDeliveryTypeConfig = (type: string): { label: string; color: string; bg: string; Icon: LucideIcon } => {
  switch (type?.toLowerCase()) {
    case 'flash':
      return { label: 'Flash', color: 'text-amber-600', bg: 'bg-amber-500/10', Icon: Bike };
    case 'maxicharge':
      return { label: 'Maxicharge', color: 'text-purple-600', bg: 'bg-purple-500/10', Icon: Container };
    default:
      return { label: 'Flex', color: 'text-primary', bg: 'bg-primary/10', Icon: Truck };
  }
};

export default function DeliveryTrackingHub({ orderId, onBack }: DeliveryTrackingHubProps) {
  const [activeTab, setActiveTab] = useState('tracking');
  const [showChat, setShowChat] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const { userRole } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    order,
    statusLabel,
    estimatedArrival,
    deliveryProgress,
    driverProfile,
    driverLocation,
    notifications,
    unreadNotifications,
    contactDriver,
    markNotificationAsRead,
    loading
  } = useEnhancedDeliveryTracking(orderId);

  // Confirm cancellation with reason
  const handleConfirmCancel = async () => {
    if (!order || !user || !cancelReason) return;
    
    const reason = cancelReason === 'other' 
      ? customReason.trim() 
      : CANCEL_REASONS.find(r => r.id === cancelReason)?.label || 'Annulé par le client';

    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason
        })
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Commande annulée",
        description: "Votre livraison a été annulée avec succès"
      });
      
      setShowCancelSheet(false);
      setCancelReason('');
      setCustomReason('');
      onBack?.();
    } catch (error) {
      console.error('❌ Erreur annulation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler cette commande",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getPickupCoords = () => {
    const coords = order?.pickup_coordinates;
    if (!coords) return undefined;
    
    if (typeof coords === 'object' && coords.lat !== undefined && coords.lng !== undefined) {
      return { 
        lat: typeof coords.lat === 'number' ? coords.lat : Number(coords.lat), 
        lng: typeof coords.lng === 'number' ? coords.lng : Number(coords.lng) 
      };
    }
    
    try {
      if (typeof coords === 'string') {
        const parsed = JSON.parse(coords);
        if (parsed.lat && parsed.lng) {
          return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
        }
      }
    } catch (e) {}
    
    return undefined;
  };

  const getDestinationCoords = () => {
    const coords = order?.delivery_coordinates;
    if (!coords) return undefined;
    
    if (typeof coords === 'object' && coords.lat !== undefined && coords.lng !== undefined) {
      return { 
        lat: typeof coords.lat === 'number' ? coords.lat : Number(coords.lat), 
        lng: typeof coords.lng === 'number' ? coords.lng : Number(coords.lng) 
      };
    }
    
    try {
      if (typeof coords === 'string') {
        const parsed = JSON.parse(coords);
        if (parsed.lat && parsed.lng) {
          return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
        }
      }
    } catch (e) {}
    
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

  const formatPrice = (price: number) => formatCurrency(price, 'CDF');
  const currentStatusIndex = getStatusIndex(order?.status || 'pending');
  const deliveryTypeConfig = getDeliveryTypeConfig(order?.delivery_type || 'flex');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold">Commande introuvable</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cette commande n'existe pas ou vous n'y avez pas accès
            </p>
          </div>
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm">
              Retour
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Soft-modern Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/30 safe-area-top">
        <div className="px-4 py-3">
          {/* Row 1: Back + Status + Price */}
          <div className="flex items-center justify-between">
            <button 
              onClick={onBack}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="flex-1 mx-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  order.status === 'pending' ? 'bg-amber-500 animate-pulse' :
                  order.status === 'delivered' ? 'bg-green-500' :
                  order.status === 'cancelled' ? 'bg-red-500' : 'bg-primary'
                )} />
                <span className="font-semibold text-foreground text-sm">{statusLabel}</span>
              </div>
              <p className="text-xs text-muted-foreground">#{orderId.slice(-8)}</p>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-foreground text-sm">
                {formatPrice(order.estimated_price || order.actual_price || 0)}
              </p>
              {estimatedArrival && (
                <p className="text-xs text-muted-foreground">ETA {estimatedArrival}</p>
              )}
            </div>
          </div>
          
          {/* Progress Bar - Simple */}
          <div className="mt-3 flex gap-1">
            {[0, 1, 2, 3, 4].map((step) => (
              <div 
                key={step} 
                className={cn(
                  "flex-1 h-1 rounded-full transition-colors",
                  step <= currentStatusIndex ? "bg-primary" : "bg-muted"
                )} 
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-28 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 border border-border/30 rounded-xl p-1 mb-4">
            <TabsTrigger 
              value="tracking" 
              className="flex items-center gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Carte</span>
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="flex items-center gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Détails</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="relative flex items-center gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alertes</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadNotifications}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4 mt-0">
            {/* Service Badge + Map */}
            <div className="relative">
              <Card className="border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <CardContent className="p-0 relative">
                  {/* Service Badge - Minimalist */}
                  <div className="absolute top-3 left-3 z-[105]">
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "px-3 py-1.5 bg-background/90 backdrop-blur-md border border-border/50 shadow-sm",
                        deliveryTypeConfig.color
                      )}
                    >
                      <deliveryTypeConfig.Icon className={cn("w-4 h-4 mr-1.5", deliveryTypeConfig.color)} />
                      <span className="font-semibold text-xs uppercase">{deliveryTypeConfig.label}</span>
                    </Badge>
                  </div>

                  <GoogleMapsKwenda
                    pickup={getPickupCoords()}
                    destination={getDestinationCoords()}
                    driverLocation={getDriverLocationForMap()}
                    showRoute={Boolean(getPickupCoords() && getDestinationCoords())}
                    height="280px"
                    deliveryMode={order.delivery_type || 'flex'}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {driverProfile?.phone_number && (
                <Button
                  onClick={contactDriver}
                  className="h-12 bg-primary hover:bg-primary/90 rounded-xl font-medium"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Appeler
                </Button>
              )}
              
              <Button
                onClick={() => setShowChat(true)}
                variant="outline"
                className="h-12 rounded-xl font-medium border-border/50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </div>

            {/* Searching for Driver - Soft Card */}
            {!driverProfile && order.status === 'pending' && (
              <Card className="bg-muted/30 border border-border/50 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">Recherche d'un livreur...</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Service {deliveryTypeConfig.label} • À proximité
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                          className="w-1.5 h-1.5 bg-amber-500 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline - Professional */}
            <Card className="border border-border/50 rounded-2xl">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm mb-4 flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  Progression
                </h3>
                
                <div className="space-y-3">
                  {[
                    { key: 'created', label: 'Commande créée', index: 0 },
                    { key: 'confirmed', label: 'Confirmée', index: 1 },
                    { key: 'picked_up', label: 'Colis collecté', index: 2 },
                    { key: 'in_transit', label: 'En livraison', index: 3 },
                    { key: 'delivered', label: 'Livré', index: 4 }
                  ].map((step, idx) => {
                    const isDone = step.index <= currentStatusIndex;
                    const isCurrent = step.index === currentStatusIndex;
                    
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className="relative">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors",
                            isDone 
                              ? "bg-primary border-primary text-white" 
                              : "border-muted bg-background text-muted-foreground"
                          )}>
                            {isDone ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <span className="text-xs font-medium">{idx + 1}</span>
                            )}
                          </div>
                          {idx < 4 && (
                            <div className={cn(
                              "absolute top-7 left-1/2 w-0.5 h-4 -translate-x-1/2",
                              isDone && step.index < currentStatusIndex ? "bg-primary" : "bg-muted"
                            )} />
                          )}
                        </div>
                        <p className={cn(
                          "text-sm font-medium transition-colors",
                          isDone ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </p>
                        {isCurrent && order.status !== 'delivered' && (
                          <span className="ml-auto text-xs text-primary font-medium">En cours</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Driver Info - If assigned */}
            {driverProfile && (
              <Card className="border border-border/50 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage src={driverProfile.profile_photo_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Truck className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {driverProfile.display_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{driverProfile.vehicle_make} {driverProfile.vehicle_model}</span>
                        <span>•</span>
                        <span className="text-amber-500">⭐ {driverProfile.rating_average?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs font-medium", deliveryTypeConfig.bg, deliveryTypeConfig.color)}
                    >
                      {deliveryTypeConfig.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivered Success */}
            {order.status === 'delivered' && (
              <Card className="bg-green-500/10 border border-green-500/30 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-green-800 dark:text-green-200">
                        Livraison terminée !
                      </h3>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                        Votre colis a été livré avec succès
                      </p>
                    </div>
                    <p className="font-bold text-lg text-green-700 dark:text-green-300">
                      {formatPrice(order.actual_price || order.estimated_price || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cancel Button - Only for pending/confirmed */}
            {['pending', 'confirmed'].includes(order.status) && (
              <Button
                variant="outline"
                onClick={() => setShowCancelSheet(true)}
                className="w-full h-11 text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler la commande
              </Button>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-0">
            {/* Contacts */}
            {(order.sender_name || order.recipient_name) && (
              <Card className="border border-border/50 rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-primary" />
                    Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.sender_name && (
                    <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Expéditeur</p>
                          <p className="text-sm font-medium">{order.sender_name}</p>
                        </div>
                      </div>
                      {order.sender_phone && (
                        <a href={`tel:${order.sender_phone}`} className="p-2 hover:bg-green-500/10 rounded-lg transition-colors">
                          <Phone className="w-4 h-4 text-green-600" />
                        </a>
                      )}
                    </div>
                  )}
                  
                  {order.recipient_name && (
                    <div className="flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Destinataire</p>
                          <p className="text-sm font-medium">{order.recipient_name}</p>
                        </div>
                      </div>
                      {order.recipient_phone && (
                        <a href={`tel:${order.recipient_phone}`} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Phone className="w-4 h-4 text-red-600" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Addresses */}
            <Card className="border border-border/50 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-primary" />
                  Itinéraire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Collecte</p>
                    <p className="text-sm font-medium">{order.pickup_location}</p>
                  </div>
                </div>
                
                <div className="ml-1 border-l-2 border-dashed border-muted h-4" />
                
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Livraison</p>
                    <p className="text-sm font-medium">{order.delivery_location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Details */}
            <Card className="border border-border/50 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Package className="w-4 h-4 text-primary" />
                  Détails du colis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium">{order.package_type || 'Standard'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">Service</span>
                  <Badge variant="secondary" className={cn("text-xs", deliveryTypeConfig.bg, deliveryTypeConfig.color)}>
                    {deliveryTypeConfig.label}
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5 border-t border-border/30 mt-2 pt-2">
                  <span className="text-sm text-muted-foreground">Prix estimé</span>
                  <span className="text-sm font-bold text-primary">
                    {formatPrice(order.estimated_price || order.actual_price || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-3 mt-0">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={cn(
                    "border rounded-2xl cursor-pointer transition-all hover:shadow-sm",
                    !notification.read ? 'border-l-4 border-l-primary border-border/50' : 'border-border/50'
                  )}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                        <Bell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(notification.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Modal */}
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

      {/* Cancel Order Sheet - Modern with Reasons */}
      <Sheet open={showCancelSheet} onOpenChange={setShowCancelSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Annuler la livraison
            </SheetTitle>
            <SheetDescription>
              Veuillez indiquer le motif de l'annulation
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-3 py-4">
            {CANCEL_REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => setCancelReason(reason.id)}
                className={cn(
                  "w-full p-4 rounded-xl border text-left transition-all",
                  cancelReason === reason.id
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-border/50 hover:border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    cancelReason === reason.id
                      ? "border-destructive bg-destructive"
                      : "border-muted-foreground/30"
                  )}>
                    {cancelReason === reason.id && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="font-medium text-sm">{reason.label}</span>
                </div>
              </button>
            ))}
            
            {/* Custom reason input */}
            <AnimatePresence>
              {cancelReason === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Input
                    placeholder="Précisez votre raison..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="mt-2 rounded-xl h-12"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <SheetFooter className="flex gap-3 pt-4 sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCancelSheet(false);
                setCancelReason('');
                setCustomReason('');
              }}
              className="flex-1 h-12 rounded-xl"
            >
              Non, garder
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancelReason || (cancelReason === 'other' && !customReason.trim()) || isCancelling}
              className="flex-1 h-12 rounded-xl"
            >
              {isCancelling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmer l'annulation
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Driver Actions - If driver role */}
      {userRole === 'chauffeur' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border/30 bg-background/98 backdrop-blur-lg z-20 safe-area-padding">
          <DriverDeliveryActions 
            order={{ 
              id: orderId,
              status: order.status,
              pickup_location: order.pickup_location,
              delivery_location: order.delivery_location,
              pickup_coordinates: order.pickup_coordinates,
              delivery_coordinates: order.delivery_coordinates,
              delivery_type: order.delivery_type,
              estimated_price: order.estimated_price || 0,
              user_id: order.user_id,
              sender_name: order.sender_name,
              sender_phone: order.sender_phone,
              recipient_name: order.recipient_name,
              recipient_phone: order.recipient_phone
            }}
            onStatusUpdate={() => {}}
          />
        </div>
      )}
    </div>
  );
}
