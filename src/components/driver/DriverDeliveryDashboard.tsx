import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Clock, User, Phone, Star, Truck } from 'lucide-react';
import { useUnifiedDeliveryQueue } from '@/hooks/useUnifiedDeliveryQueue';

export const DriverDeliveryDashboard = () => {
  const {
    loading,
    deliveries,
    activeDelivery,
    acceptDelivery,
    updateDeliveryStatus
  } = useUnifiedDeliveryQueue();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'assigned':
      case 'confirmed': return 'bg-primary text-primary-foreground';
      case 'picked_up':
      case 'in_transit': return 'bg-accent text-accent-foreground';
      case 'delivered': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: 'marketplace' | 'direct') => {
    return type === 'marketplace' ? '🛍️' : '📦';
  };

  if (activeDelivery) {
    return (
      <div className="p-4 space-y-4">
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{getTypeIcon(activeDelivery.type)}</span>
              Livraison en cours
              <Badge className={getStatusColor(activeDelivery.status)}>
                {activeDelivery.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <User className="h-4 w-4" />
              <span className="font-medium">{activeDelivery.customer_name}</span>
              {activeDelivery.customer_phone && (
                <Button variant="outline" size="sm" className="ml-auto">
                  <Phone className="h-4 w-4 mr-1" />
                  Appeler
                </Button>
              )}
            </div>

            {/* Marketplace Order Info */}
            {activeDelivery.marketplace_order && (
              <div className="p-3 bg-accent/20 rounded-lg">
                <p className="font-medium">{activeDelivery.marketplace_order.product_title}</p>
                <p className="text-sm text-muted-foreground">
                  Vendeur: {activeDelivery.marketplace_order.seller_name}
                </p>
                <p className="text-sm font-medium">
                  Valeur: {activeDelivery.marketplace_order.total_amount.toLocaleString()} FC
                </p>
              </div>
            )}

            {/* Delivery Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-primary" />
                <div>
                  <p className="text-sm font-medium">Récupération</p>
                  <p className="text-sm text-muted-foreground">{activeDelivery.pickup_location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-success" />
                <div>
                  <p className="text-sm font-medium">Livraison</p>
                  <p className="text-sm text-muted-foreground">{activeDelivery.delivery_location}</p>
                </div>
              </div>
            </div>

            {/* Package Info */}
            {(activeDelivery.package_type || activeDelivery.vehicle_size) && (
              <div className="flex gap-2">
                {activeDelivery.package_type && (
                  <Badge variant="outline">
                    <Package className="h-3 w-3 mr-1" />
                    {activeDelivery.package_type}
                  </Badge>
                )}
                {activeDelivery.vehicle_size && (
                  <Badge variant="outline">
                    <Truck className="h-3 w-3 mr-1" />
                    {activeDelivery.vehicle_size}
                  </Badge>
                )}
                {activeDelivery.loading_assistance && (
                  <Badge variant="outline">
                    Assistance chargement
                  </Badge>
                )}
              </div>
            )}

            {/* Fee */}
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
              <span className="font-medium">Frais de livraison</span>
              <span className="text-lg font-bold text-success">
                {activeDelivery.estimated_fee.toLocaleString()} FC
              </span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {['assigned','confirmed'].includes(activeDelivery.status) && (
                <>
                  <Button 
                    onClick={() => updateDeliveryStatus('picked_up')}
                    disabled={loading}
                  >
                    Colis récupéré
                  </Button>
                  <Button variant="outline">
                    Navigation
                  </Button>
                </>
              )}
              
              {activeDelivery.status === 'picked_up' && (
                <>
                  <Button 
                    onClick={() => updateDeliveryStatus('delivered')}
                    disabled={loading}
                    className="bg-success hover:bg-success/90"
                  >
                    Livré
                  </Button>
                  <Button variant="outline">
                    Navigation
                  </Button>
                </>
              )}
            </div>

            {activeDelivery.notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Notes:</p>
                <p className="text-sm text-muted-foreground">{activeDelivery.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Livraisons disponibles</h2>
        <Badge variant="outline">
          {deliveries.length} disponible{deliveries.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      )}

      {!loading && deliveries.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium mb-1">Aucune livraison disponible</h3>
            <p className="text-sm text-muted-foreground">
              Les nouvelles livraisons apparaîtront ici automatiquement
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {deliveries.map((delivery) => (
          <Card key={delivery.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTypeIcon(delivery.type)}</span>
                  <div>
                    <p className="font-medium">{delivery.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {delivery.type === 'marketplace' ? 'Commande Marketplace' : 'Livraison directe'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success">
                    {delivery.estimated_fee.toLocaleString()} FC
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(delivery.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {delivery.marketplace_order && (
                <div className="mb-3 p-2 bg-accent/10 rounded text-sm">
                  <p className="font-medium">{delivery.marketplace_order.product_title}</p>
                  <p className="text-muted-foreground">
                    Valeur: {delivery.marketplace_order.total_amount.toLocaleString()} FC
                  </p>
                </div>
              )}

              <div className="space-y-2 text-sm mb-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-1 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{delivery.pickup_location}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-1 text-success flex-shrink-0" />
                  <span className="text-muted-foreground">{delivery.delivery_location}</span>
                </div>
              </div>

              {(delivery.package_type || delivery.vehicle_size) && (
                <div className="flex gap-1 mb-3">
                  {delivery.package_type && (
                    <Badge variant="outline" className="text-xs">
                      {delivery.package_type}
                    </Badge>
                  )}
                  {delivery.vehicle_size && (
                    <Badge variant="outline" className="text-xs">
                      {delivery.vehicle_size}
                    </Badge>
                  )}
                </div>
              )}

              <Button 
                onClick={() => acceptDelivery(delivery.id, delivery.type)}
                disabled={loading}
                className="w-full"
              >
                Accepter cette livraison
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};