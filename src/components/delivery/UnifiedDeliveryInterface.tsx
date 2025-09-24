import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import DeliveryTrackingHub from './DeliveryTrackingHub';
import DriverDeliveryActions from '@/components/driver/DriverDeliveryActions';
import { Card, CardContent } from '@/components/ui/card';

interface UnifiedDeliveryInterfaceProps {
  orderId: string;
  onBack?: () => void;
}

export default function UnifiedDeliveryInterface({ orderId, onBack }: UnifiedDeliveryInterfaceProps) {
  const { user } = useAuth();
  const { userRole } = useUserRole();

  // Fonction pour rafraîchir l'interface après une action
  const handleStatusUpdate = () => {
    // Force un re-render en modifiant la clé du composant
    window.location.reload();
  };

  // Interface spécifique pour chauffeur avec actions
  if (userRole === 'chauffeur') {
    return (
      <div className="min-h-screen bg-background">
        <DeliveryTrackingHub orderId={orderId} onBack={onBack} />
        
        {/* Ajouter les actions chauffeur en overlay */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
          <DriverDeliveryActions 
            order={{ 
              id: orderId,
              status: '', // Le hook va récupérer les vraies données
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

  // Interface standard pour client
  return <DeliveryTrackingHub orderId={orderId} onBack={onBack} />;
}