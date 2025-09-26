import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Clock,
  Package,
  Truck,
  CheckCircle
} from 'lucide-react';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { toast } from 'sonner';

interface DeliveryTrackingMapProps {
  orderId: string;
  showDriverInfo?: boolean;
  showEstimatedTime?: boolean;
}

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  orderId,
  showDriverInfo = true,
  showEstimatedTime = true
}) => {
  const {
    order,
    loading,
    error,
    driverProfile,
    driverLocation,
    statusLabel,
    price
  } = useDeliveryTracking(orderId);

  const { isLoaded } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [driverMarker, setDriverMarker] = useState<google.maps.Marker | null>(null);
  const [pickupMarker, setPickupMarker] = useState<google.maps.Marker | null>(null);
  const [deliveryMarker, setDeliveryMarker] = useState<google.maps.Marker | null>(null);
  const [routeRenderer, setRouteRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  const initializeMap = useCallback(async () => {
    if (!isLoaded || !order || map) return;

    const mapElement = document.getElementById('delivery-tracking-map');
    if (!mapElement) return;

    const newMap = new google.maps.Map(mapElement, {
      zoom: 13,
      center: { lat: -4.3217, lng: 15.3069 }, // Kinshasa center
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(newMap);

    // Add pickup marker
    if (order.pickup_coordinates) {
      const pickup = new google.maps.Marker({
        position: {
          lat: order.pickup_coordinates.lat,
          lng: order.pickup_coordinates.lng
        },
        map: newMap,
        title: 'Point de récupération',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#22c55e" stroke="white" stroke-width="2"/>
              <path d="M16 8v8l4 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });
      setPickupMarker(pickup);
    }

    // Add delivery marker
    if (order.delivery_coordinates) {
      const delivery = new google.maps.Marker({
        position: {
          lat: order.delivery_coordinates.lat,
          lng: order.delivery_coordinates.lng
        },
        map: newMap,
        title: 'Point de livraison',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="2"/>
              <path d="M12 16l3 3 6-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });
      setDeliveryMarker(delivery);
    }

    // Add route if both coordinates exist
    if (order.pickup_coordinates && order.delivery_coordinates) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });

      try {
        const result = await directionsService.route({
          origin: order.pickup_coordinates,
          destination: order.delivery_coordinates,
          travelMode: google.maps.TravelMode.DRIVING
        });
        
        directionsRenderer.setDirections(result);
        setRouteRenderer(directionsRenderer);
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    }

  }, [isLoaded, order, map]);

  // Update driver location
  useEffect(() => {
    if (!map || !driverLocation) return;

    if (driverMarker) {
      driverMarker.setPosition({
        lat: driverLocation.lat || driverLocation.latitude,
        lng: driverLocation.lng || driverLocation.longitude
      });
    } else if (isLoaded) {
      const newDriverMarker = new google.maps.Marker({
        position: {
          lat: driverLocation.lat || driverLocation.latitude,
          lng: driverLocation.lng || driverLocation.longitude
        },
        map,
        title: 'Chauffeur',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="16" fill="#3b82f6" stroke="white" stroke-width="3"/>
              <path d="M15 20h10m-5-5v10" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20)
        }
      });
      setDriverMarker(newDriverMarker);
    }
  }, [map, driverLocation, isLoaded, driverMarker]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  const getStatusIcon = () => {
    switch (order?.status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
      case 'driver_assigned':
        return <Truck className="h-4 w-4" />;
      case 'picked_up':
      case 'in_transit':
        return <Navigation className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (order?.status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
      case 'driver_assigned':
        return 'info';
      case 'picked_up':
      case 'in_transit':
        return 'primary';
      case 'delivered':
        return 'success';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {error || 'Commande non trouvée'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon()}
              Suivi de livraison
            </span>
            <Badge variant={getStatusColor() as any}>
              {statusLabel}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Map Container */}
          <div
            id="delivery-tracking-map"
            className="h-64 w-full rounded-lg border"
          />

          {/* Delivery Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">De</div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{order.pickup_location}</span>
              </div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Vers</div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>{order.delivery_location}</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold text-primary">
              {price.toLocaleString()} CDF
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Driver Info Card */}
      {showDriverInfo && driverProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Chauffeur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{driverProfile.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Chauffeur professionnel
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Service de livraison
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const phone = driverProfile.phone_number;
                    if (phone) {
                      window.open(`tel:${phone}`, '_self');
                    } else {
                      toast.error('Numéro de téléphone non disponible');
                    }
                  }}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.info('Chat en cours de développement');
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};