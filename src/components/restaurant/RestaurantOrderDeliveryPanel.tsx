/**
 * Panel de livraison moderne pour restaurants
 * Design glassmorphism avec cards cliquables
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRestaurantDelivery, DeliveryAssignment } from '@/hooks/useRestaurantDelivery';
import { useDynamicDeliveryPricing } from '@/hooks/useDynamicDeliveryPricing';
import { RestaurantDeliveryDrawer } from './RestaurantDeliveryDrawer';
import { Truck, Phone, User, MapPin, Clock, CheckCircle2, Loader2, Bike } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';

interface RestaurantOrderDeliveryPanelProps {
  orderId: string;
  orderStatus: string;
  restaurantAddress: string;
  deliveryAddress: string;
  deliveryCoordinates?: { lat: number; lng: number };
  restaurantProfile?: {
    restaurant_name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    phone_number?: string;
  };
  deliveryPhone?: string;
  orderNumber?: string;
  onStatusChange?: () => void;
}

export function RestaurantOrderDeliveryPanel({
  orderId,
  orderStatus,
  restaurantAddress,
  deliveryAddress,
  deliveryCoordinates,
  restaurantProfile,
  deliveryPhone,
  orderNumber,
  onStatusChange
}: RestaurantOrderDeliveryPanelProps) {
  const { 
    loading, 
    assignment,
    requestDelivery, 
    startSelfDelivery, 
    completeDelivery,
    getDeliveryStatus 
  } = useRestaurantDelivery();
  
  const { calculatePrice, formatPrice } = useDynamicDeliveryPricing();
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryAssignment | null>(null);
  const [showDeliveryDrawer, setShowDeliveryDrawer] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<'kwenda' | 'self' | null>(null);

  useEffect(() => {
    if (orderId && (orderStatus === 'ready' || orderStatus === 'driver_assigned' || orderStatus === 'picked_up')) {
      loadDeliveryInfo();
    }
  }, [orderId, orderStatus]);

  // Calculer le prix estimé
  useEffect(() => {
    const estimate = async () => {
      if (restaurantProfile?.latitude && restaurantProfile?.longitude && deliveryCoordinates) {
        const R = 6371;
        const dLat = (deliveryCoordinates.lat - restaurantProfile.latitude) * Math.PI / 180;
        const dLon = (deliveryCoordinates.lng - restaurantProfile.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(restaurantProfile.latitude * Math.PI / 180) * Math.cos(deliveryCoordinates.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        const result = await calculatePrice('flash', distance);
        setEstimatedPrice(result?.calculated_price || 7500);
      } else {
        // Prix par défaut
        setEstimatedPrice(7500);
      }
    };
    estimate();
  }, [restaurantProfile, deliveryCoordinates]);

  const loadDeliveryInfo = async () => {
    const info = await getDeliveryStatus(orderId);
    if (info) {
      setDeliveryInfo(info as any);
    }
  };

  const handleDeliveryRequested = async (deliveryFee: number, serviceType: string) => {
    const result = await requestDelivery(orderId, serviceType as 'flash' | 'flex' | 'maxicharge');
    if (result.success) {
      await loadDeliveryInfo();
      onStatusChange?.();
    }
  };

  const handleSelfDelivery = async () => {
    setSelectedMethod('self');
    const result = await startSelfDelivery(orderId);
    if (result.success) {
      onStatusChange?.();
    }
  };

  const handleCompleteDelivery = async () => {
    const result = await completeDelivery(orderId);
    if (result.success) {
      onStatusChange?.();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      searching: { label: 'Recherche livreur', variant: 'secondary' },
      driver_found: { label: 'Livreur trouvé', variant: 'default' },
      driver_accepted: { label: 'Accepté', variant: 'default' },
      picked_up: { label: 'En cours', variant: 'default' },
      in_transit: { label: 'En route', variant: 'default' },
      delivered: { label: 'Livré', variant: 'default' },
      cancelled: { label: 'Annulé', variant: 'destructive' }
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Si commande pas encore prête
  if (orderStatus === 'pending' || orderStatus === 'confirmed' || orderStatus === 'preparing') {
    return (
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4" />
            Livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-muted/50 border-border/40">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Disponible une fois la commande prête
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Si commande prête mais pas encore de livreur assigné
  if (orderStatus === 'ready' && !deliveryInfo) {
    return (
      <>
        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-border/40 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4 text-primary" />
              Livraison
            </CardTitle>
            <CardDescription className="text-xs">Choisissez votre mode de livraison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Adresses compactes */}
            <div className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg p-2">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-muted-foreground">{deliveryAddress}</span>
            </div>

            {/* Cards de sélection */}
            <div className="space-y-2">
              {/* Kwenda Delivery */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card 
                  className={`p-3 cursor-pointer transition-all duration-300 border-2 ${
                    selectedMethod === 'kwenda'
                      ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/40 shadow-md'
                      : 'bg-white/40 dark:bg-slate-900/40 border-border/40 hover:border-red-500/30 hover:bg-red-500/5'
                  }`}
                  onClick={() => {
                    setSelectedMethod('kwenda');
                    setShowDeliveryDrawer(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Livreur Kwenda</p>
                        <p className="text-xs text-muted-foreground">
                          {estimatedPrice > 0 ? `~${formatPrice(estimatedPrice)}` : 'Cliquez pour voir les tarifs'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-600 border-0">
                      Express
                    </Badge>
                  </div>
                </Card>
              </motion.div>

              {/* Self Delivery */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card 
                  className={`p-3 cursor-pointer transition-all duration-300 border-2 ${
                    selectedMethod === 'self'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 shadow-md'
                      : 'bg-white/40 dark:bg-slate-900/40 border-border/40 hover:border-emerald-500/30 hover:bg-emerald-500/5'
                  }`}
                  onClick={handleSelfDelivery}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
                        <Bike className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Je livre moi-même</p>
                        <p className="text-xs text-muted-foreground">Livraison personnelle</p>
                      </div>
                    </div>
                    {loading && selectedMethod === 'self' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 border-0">
                        Gratuit
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Drawer de livraison */}
        <RestaurantDeliveryDrawer
          isOpen={showDeliveryDrawer}
          onClose={() => setShowDeliveryDrawer(false)}
          order={{
            id: orderId,
            order_number: orderNumber,
            delivery_address: deliveryAddress,
            delivery_coordinates: deliveryCoordinates,
            delivery_phone: deliveryPhone
          }}
          restaurantProfile={restaurantProfile}
          onDeliveryRequested={handleDeliveryRequested}
        />
      </>
    );
  }

  // Si livreur assigné ou en cours de livraison
  if (deliveryInfo && orderStatus !== 'delivered') {
    return (
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4 text-primary" />
                Suivi livraison
              </CardTitle>
            </div>
            {getStatusBadge(deliveryInfo.assignment_status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {deliveryInfo.driver && (
            <div className="bg-muted/50 p-3 rounded-xl space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{deliveryInfo.driver.display_name}</p>
                  <p className="text-xs text-muted-foreground">{deliveryInfo.driver.vehicle_type}</p>
                </div>
              </div>
              
              {deliveryInfo.driver.phone_number && (
                <Button variant="outline" size="sm" className="w-full h-8 text-xs" asChild>
                  <a href={`tel:${deliveryInfo.driver.phone_number}`}>
                    <Phone className="mr-2 h-3 w-3" />
                    {deliveryInfo.driver.phone_number}
                  </a>
                </Button>
              )}
            </div>
          )}

          {deliveryInfo.actual_pickup_time && (
            <Alert className="bg-emerald-500/10 border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <AlertDescription className="text-xs">
                Récupérée à {new Date(deliveryInfo.actual_pickup_time).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Si auto-livraison (in_transit sans livreur Kwenda assigné)
  if (orderStatus === 'in_transit' && !deliveryInfo) {
    return (
      <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bike className="h-4 w-4 text-emerald-500" />
            Auto-livraison en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCompleteDelivery}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmation...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Marquer comme livrée
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Si livraison terminée
  if (orderStatus === 'delivered') {
    return (
      <Card className="bg-emerald-500/10 border-emerald-500/20">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Livraison terminée</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
