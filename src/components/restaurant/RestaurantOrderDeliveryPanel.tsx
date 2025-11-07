import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRestaurantDelivery, DeliveryAssignment } from '@/hooks/useRestaurantDelivery';
import { Truck, Phone, User, MapPin, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RestaurantOrderDeliveryPanelProps {
  orderId: string;
  orderStatus: string;
  restaurantAddress: string;
  deliveryAddress: string;
  onStatusChange?: () => void;
}

export function RestaurantOrderDeliveryPanel({
  orderId,
  orderStatus,
  restaurantAddress,
  deliveryAddress,
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
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryAssignment | null>(null);

  useEffect(() => {
    if (orderId && (orderStatus === 'ready' || orderStatus === 'driver_assigned' || orderStatus === 'picked_up')) {
      loadDeliveryInfo();
    }
  }, [orderId, orderStatus]);

  const loadDeliveryInfo = async () => {
    const info = await getDeliveryStatus(orderId);
    if (info) {
      setDeliveryInfo(info as any);
    }
  };

  const handleRequestDelivery = async () => {
    const result = await requestDelivery(orderId);
    if (result.success) {
      await loadDeliveryInfo();
      onStatusChange?.();
    }
  };

  const handleSelfDelivery = async () => {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Livraison
          </CardTitle>
          <CardDescription>
            Préparez la commande avant de demander un livreur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              La livraison sera disponible une fois la commande prête
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Si commande prête mais pas encore de livreur assigné
  if (orderStatus === 'ready' && !deliveryInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Demander un livreur
          </CardTitle>
          <CardDescription>
            Commande prête à être livrée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Récupération</p>
                <p className="text-muted-foreground">{restaurantAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">Livraison</p>
                <p className="text-muted-foreground">{deliveryAddress}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button 
              onClick={handleRequestDelivery} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Truck className="mr-2 h-4 w-4" />
                  Demander un livreur Kwenda
                </>
              )}
            </Button>

            <Button 
              onClick={handleSelfDelivery} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              <User className="mr-2 h-4 w-4" />
              Je livre moi-même
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Si livreur assigné ou en cours de livraison
  if (deliveryInfo && orderStatus !== 'delivered') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Suivi de livraison
              </CardTitle>
              <CardDescription>Livreur assigné</CardDescription>
            </div>
            {getStatusBadge(deliveryInfo.assignment_status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliveryInfo.driver && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{deliveryInfo.driver.display_name}</p>
                  <p className="text-sm text-muted-foreground">{deliveryInfo.driver.vehicle_type}</p>
                </div>
              </div>
              
              {deliveryInfo.driver.phone_number && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={`tel:${deliveryInfo.driver.phone_number}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    {deliveryInfo.driver.phone_number}
                  </a>
                </Button>
              )}
            </div>
          )}

          <div className="space-y-2 text-sm">
            {deliveryInfo.estimated_pickup_time && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Récupération estimée</span>
                <span className="font-medium">
                  {new Date(deliveryInfo.estimated_pickup_time).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )}
            {deliveryInfo.estimated_delivery_time && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Livraison estimée</span>
                <span className="font-medium">
                  {new Date(deliveryInfo.estimated_delivery_time).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )}
          </div>

          {deliveryInfo.actual_pickup_time && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Commande récupérée à {new Date(deliveryInfo.actual_pickup_time).toLocaleTimeString('fr-FR', { 
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

  // Si auto-livraison
  if (orderStatus === 'self_delivery') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Auto-livraison
          </CardTitle>
          <CardDescription>
            Vous livrez cette commande vous-même
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCompleteDelivery}
            disabled={loading}
            className="w-full"
            size="lg"
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Livraison terminée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Cette commande a été livrée avec succès
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return null;
}