import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  MapPin, 
  Phone, 
  Clock,
  CheckCircle2
} from 'lucide-react';
import DeliveryStatusModal from './DeliveryStatusModal';
import { useEnhancedDeliveryTracking } from '@/hooks/useEnhancedDeliveryTracking';

interface SimpleDeliveryTrackerProps {
  orderId: string;
  showModal?: boolean;
  onModalClose?: () => void;
}

export default function SimpleDeliveryTracker({ 
  orderId, 
  showModal = false, 
  onModalClose 
}: SimpleDeliveryTrackerProps) {
  const [showStatusModal, setShowStatusModal] = useState(showModal);
  const { 
    order, 
    statusLabel, 
    deliveryProgress, 
    driverProfile,
    estimatedArrival,
    loading,
    contactDriver
  } = useEnhancedDeliveryTracking(orderId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Commande non trouvée</p>
        </CardContent>
      </Card>
    );
  }

  const handleTrack = () => {
    window.open(`/delivery/track/${orderId}`, '_blank');
  };

  const handleContact = () => {
    if (driverProfile?.phone_number) {
      contactDriver();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Livraison #{orderId.slice(-8)}
            </CardTitle>
            <Badge variant="outline">{statusLabel}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progression</span>
              <span>{Math.round(deliveryProgress)}%</span>
            </div>
            <Progress value={deliveryProgress} className="h-2" />
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{order.delivery_location}</span>
            </div>
            
            {estimatedArrival && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Arrivée estimée: {estimatedArrival}</span>
              </div>
            )}

            {driverProfile && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Chauffeur: {driverProfile.display_name}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleTrack} className="flex-1">
              <MapPin className="h-4 w-4 mr-2" />
              Suivre
            </Button>
            
            {driverProfile?.phone_number && (
              <Button variant="outline" onClick={handleContact}>
                <Phone className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Modal */}
      <DeliveryStatusModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          onModalClose?.();
        }}
        orderId={orderId}
        status={order.status}
        amount={order.estimated_price || 0}
        estimatedTime={estimatedArrival}
        driverName={driverProfile?.display_name}
        driverPhone={driverProfile?.phone_number}
        onTrack={handleTrack}
        onContact={handleContact}
      />
    </>
  );
}