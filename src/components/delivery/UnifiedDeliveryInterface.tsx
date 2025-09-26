import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import UnifiedDeliveryTracker from '@/components/delivery/UnifiedDeliveryTracker';
import DriverDeliveryDashboard from '@/components/driver/DriverDeliveryDashboard';

interface UnifiedDeliveryInterfaceProps {
  orderId: string;
  onBack?: () => void;
}

export default function UnifiedDeliveryInterface({ orderId, onBack }: UnifiedDeliveryInterfaceProps) {
  const { userRole } = useUserRole();

  // Interface pour chauffeurs - Dashboard complet
  if (userRole === 'chauffeur') {
    return (
      <DriverDeliveryDashboard 
        onSelectDelivery={(deliveryId) => {
          // Navigation vers le suivi spécifique si nécessaire
          console.log('Livraison sélectionnée:', deliveryId);
        }}
      />
    );
  }

  // Interface pour clients - Tracker unifié
  return (
    <UnifiedDeliveryTracker 
      orderId={orderId}
      onBack={onBack}
    />
  );
}