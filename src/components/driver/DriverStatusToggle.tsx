import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useUnifiedDispatcher } from '@/hooks/useUnifiedDispatcher';
import { useGeolocation } from '@/hooks/useGeolocation';
import { 
  Power, 
  MapPin, 
  Car, 
  Package, 
  ShoppingBag, 
  Wifi, 
  WifiOff,
  Activity,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DriverStatusToggleProps {
  className?: string;
}

const DriverStatusToggle: React.FC<DriverStatusToggleProps> = ({ className }) => {
  const { 
    dispatchStatus, 
    updateDriverStatus, 
    activeOrders,
    loading 
  } = useUnifiedDispatcher();
  
  const { latitude, longitude } = useGeolocation({ watchPosition: true });

  const [updating, setUpdating] = useState(false);

  // Update location in dispatch system
  useEffect(() => {
    if (latitude && longitude && dispatchStatus.isOnline) {
      updateDriverStatus({
        currentLocation: { lat: latitude, lng: longitude }
      });
    }
  }, [latitude, longitude, dispatchStatus.isOnline, updateDriverStatus]);

  const handleOnlineToggle = async (isOnline: boolean) => {
    setUpdating(true);
    try {
      const success = await updateDriverStatus({ 
        isOnline,
        isAvailable: isOnline ? true : dispatchStatus.isAvailable
      });
      
      if (!success) {
        // Revert if failed
        return;
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleAvailabilityToggle = async (isAvailable: boolean) => {
    if (activeOrders.length > 0 && !isAvailable) {
      return; // Cannot go unavailable with active orders
    }

    setUpdating(true);
    try {
      await updateDriverStatus({ isAvailable });
    } finally {
      setUpdating(false);
    }
  };

  const handleServiceTypeToggle = async (serviceType: string, enabled: boolean) => {
    const newServiceTypes = enabled 
      ? [...dispatchStatus.serviceTypes, serviceType]
      : dispatchStatus.serviceTypes.filter(s => s !== serviceType);

    setUpdating(true);
    try {
      await updateDriverStatus({ serviceTypes: newServiceTypes });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = () => {
    if (!dispatchStatus.isOnline) {
      return <Badge variant="secondary" className="bg-gray-500 text-white">Hors ligne</Badge>;
    }
    
    if (activeOrders.length > 0) {
      return <Badge variant="secondary" className="bg-blue-500 text-white">En course</Badge>;
    }
    
    if (dispatchStatus.isAvailable) {
      return <Badge variant="secondary" className="bg-green-500 text-white">Disponible</Badge>;
    }
    
    return <Badge variant="secondary" className="bg-yellow-500 text-white">Occupé</Badge>;
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Statut Chauffeur
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Online Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {dispatchStatus.isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium">
              {dispatchStatus.isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
          <Switch
            checked={dispatchStatus.isOnline}
            onCheckedChange={handleOnlineToggle}
            disabled={updating || loading}
          />
        </div>

        {/* Availability Status (only when online) */}
        {dispatchStatus.isOnline && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                activeOrders.length > 0 
                  ? "bg-blue-500" 
                  : dispatchStatus.isAvailable 
                    ? "bg-green-500" 
                    : "bg-yellow-500"
              )} />
              <span className="text-sm font-medium">
                {activeOrders.length > 0 
                  ? `En course (${activeOrders.length})`
                  : dispatchStatus.isAvailable 
                    ? 'Disponible pour commandes' 
                    : 'Occupé'}
              </span>
            </div>
            <Switch
              checked={dispatchStatus.isAvailable}
              onCheckedChange={handleAvailabilityToggle}
              disabled={updating || loading || activeOrders.length > 0}
            />
          </div>
        )}

        {/* Service Types (only when online) */}
        {dispatchStatus.isOnline && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Types de service acceptés :
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Courses taxi</span>
                </div>
                <Switch
                  checked={dispatchStatus.serviceTypes.includes('taxi')}
                  onCheckedChange={(checked) => handleServiceTypeToggle('taxi', checked)}
                  disabled={updating || loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Livraisons directes</span>
                </div>
                <Switch
                  checked={dispatchStatus.serviceTypes.includes('delivery')}
                  onCheckedChange={(checked) => handleServiceTypeToggle('delivery', checked)}
                  disabled={updating || loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Livraisons marketplace</span>
                </div>
                <Switch
                  checked={dispatchStatus.serviceTypes.includes('marketplace')}
                  onCheckedChange={(checked) => handleServiceTypeToggle('marketplace', checked)}
                  disabled={updating || loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Location Status */}
        {dispatchStatus.isOnline && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {latitude && longitude ? (
                <span>Position: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              ) : (
                <span>Localisation en cours...</span>
              )}
            </div>
            {latitude && longitude && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</span>
              </div>
            )}
          </div>
        )}

        {/* Active Orders Summary */}
        {activeOrders.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <div className="text-sm font-medium mb-2">Commandes actives:</div>
            <div className="space-y-1">
              {activeOrders.map((order, index) => (
                <div key={order.id} className="text-xs bg-blue-50 p-2 rounded border">
                  {order.type === 'taxi' && `Course: ${order.pickup_location}`}
                  {order.type === 'delivery' && `Livraison: ${order.pickup_location}`}
                  {order.type === 'marketplace' && `Marketplace: ${order.pickup_location}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DriverStatusToggle;