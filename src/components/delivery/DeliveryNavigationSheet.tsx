import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, ExternalLink, PackageCheck, CheckCircle2 } from 'lucide-react';
import { NavigationMap } from '@/components/maps/NavigationMap';
import { UnifiedLocationService } from '@/services/unifiedLocationService';
import { useRealtimeTracking } from '@/hooks/useRealtimeTracking';
import type { UnifiedDeliveryItem } from '@/hooks/useUnifiedDeliveryQueue';

interface DeliveryNavigationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: UnifiedDeliveryItem;
  onPickedUp?: () => void;
  onDelivered?: () => void;
}

export const DeliveryNavigationSheet: React.FC<DeliveryNavigationSheetProps> = ({
  open,
  onOpenChange,
  delivery,
  onPickedUp,
  onDelivered,
}) => {
  const [origin, setOrigin] = useState<{ lat: number; lng: number; address?: string } | undefined>();
  const [destination, setDestination] = useState<{ lat: number; lng: number; address?: string } | undefined>();
  const [routeInfo, setRouteInfo] = useState<{ distanceText: string; durationText: string } | null>(null);

  const targetIsPickup = useMemo(
    () => ['assigned', 'confirmed'].includes(delivery.status),
    [delivery.status]
  );

  // Real-time tracking bound to this delivery
  const { startTracking, stopTracking } = useRealtimeTracking({
    trackingId: delivery.id,
    userType: 'driver',
    enabled: open,
  });

  // Initialize origin (current location)
  useEffect(() => {
    if (!open) return;
    let mounted = true;

    const init = async () => {
      const curr = await UnifiedLocationService.getCurrentLocation();
      if (!mounted) return;
      setOrigin({ lat: curr.lat, lng: curr.lng, address: curr.address });
      // Start realtime presence at first location
      await startTracking({ latitude: curr.lat, longitude: curr.lng });
    };

    init();
    return () => {
      mounted = false;
      stopTracking();
    };
  }, [open, startTracking, stopTracking]);

  // Resolve destination coordinates from delivery data (pickup first, then delivery)
  useEffect(() => {
    if (!open) return;

    const resolveDestination = async () => {
      const addr = targetIsPickup ? delivery.pickup_location : delivery.delivery_location;
      const coords = targetIsPickup ? delivery.pickup_coordinates : delivery.delivery_coordinates;

      if (coords?.lat && coords?.lng) {
        setDestination({ lat: coords.lat, lng: coords.lng, address: addr });
        return;
      }

      // Geocode address as fallback
      const results = await UnifiedLocationService.searchLocation(addr);
      if (results && results.length > 0) {
        setDestination({ lat: results[0].lat, lng: results[0].lng, address: results[0].address });
      }
    };

    resolveDestination();
  }, [open, delivery.pickup_location, delivery.delivery_location, delivery.pickup_coordinates, delivery.delivery_coordinates, targetIsPickup]);

  const handleRouteCalculated = useCallback((route: any) => {
    setRouteInfo({ distanceText: route.distanceText, durationText: route.durationText });
  }, []);

  const openExternalMaps = useCallback(() => {
    if (!origin || !destination) return;
    const saddr = `${origin.lat},${origin.lng}`;
    const daddr = `${destination.lat},${destination.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(saddr)}&destination=${encodeURIComponent(daddr)}&travelmode=driving`;
    window.open(url, '_blank');
  }, [origin, destination]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Navigation {targetIsPickup ? '→ Récupération' : '→ Livraison'}
            <Badge variant="secondary" className="ml-2">
              {delivery.type === 'marketplace' ? 'Marketplace' : 'Directe'}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-40">
          <Card className="mb-3 p-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-sm font-medium break-words">
                  {targetIsPickup ? delivery.pickup_location : delivery.delivery_location}
                </p>
              </div>
            </div>
            {routeInfo && (
              <div className="mt-2 text-xs text-muted-foreground">
                {routeInfo.distanceText} • {routeInfo.durationText}
              </div>
            )}
          </Card>

          <NavigationMap
            origin={origin}
            destination={destination}
            onRouteCalculated={handleRouteCalculated}
            showTrafficLayer
            enableNavigation
            className="rounded-none"
          />
        </div>

        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3">
          <div className="grid grid-cols-3 gap-2">
            {targetIsPickup ? (
              <Button onClick={onPickedUp} className="col-span-2">
                <PackageCheck className="h-4 w-4 mr-1" />
                Colis récupéré
              </Button>
            ) : (
              <Button onClick={onDelivered} className="col-span-2 bg-success hover:bg-success/90">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Marquer livré
              </Button>
            )}
            <Button variant="outline" onClick={openExternalMaps}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Maps
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DeliveryNavigationSheet;
