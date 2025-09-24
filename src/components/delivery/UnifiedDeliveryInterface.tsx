import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import ModernTracker from '@/components/tracking/ModernTracker';
import DriverDeliveryActions from '@/components/driver/DriverDeliveryActions';

interface UnifiedDeliveryInterfaceProps {
  orderId: string;
  onBack?: () => void;
}

export default function UnifiedDeliveryInterface({ orderId, onBack }: UnifiedDeliveryInterfaceProps) {
  const { user } = useAuth();
  const { userRole } = useUserRole();

  // Fonction pour rafraîchir l'interface après une action
  const handleStatusUpdate = () => {
    window.location.reload();
  };

  // Interface moderne pour tous les utilisateurs
  if (userRole === 'chauffeur') {
    return (
      <div className="min-h-screen bg-background">
        <ModernTracker 
          trackingId={orderId}
          trackingType="delivery"
          onBack={onBack}
          enableRealtimeLocation={true}
        />
        
        {/* Actions chauffeur en overlay */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
          <DriverDeliveryActions 
            order={{ 
              id: orderId,
              status: '',
              pickup_location: '',
              delivery_location: '',
              pickup_coordinates: null,
              delivery_coordinates: null,
              delivery_type: '',
              estimated_price: 0,
              user_id: user?.id || ''
            }}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
      </div>
    );
  }

  // Interface moderne pour client
  return (
    <ModernTracker 
      trackingId={orderId}
      trackingType="delivery"
      onBack={onBack}
      enableRealtimeLocation={false}
    />
  );
}