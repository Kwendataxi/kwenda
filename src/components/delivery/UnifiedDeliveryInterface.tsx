import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useRealTimeDeliveryTracking } from '@/hooks/useRealTimeDeliveryTracking';
import EnhancedDeliveryTracker from '@/components/delivery/EnhancedDeliveryTracker';
import DriverDeliveryDashboard from '@/components/driver/DriverDeliveryDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface UnifiedDeliveryInterfaceProps {
  orderId: string;
  onBack?: () => void;
}

export default function UnifiedDeliveryInterface({ orderId, onBack }: UnifiedDeliveryInterfaceProps) {
  const { userRole } = useUserRole();
  
  // Utiliser le hook temps réel pour le tracking
  const {
    trackingData,
    loading,
    error,
    connectionStatus,
    sendMessage,
    callDriver,
    callClient,
    refreshTracking
  } = useRealTimeDeliveryTracking({
    orderId,
    enableDriverTracking: true,
    enableChat: true
  });

  // Interface pour chauffeurs - Dashboard complet
  if (userRole === 'chauffeur') {
    return (
      <DriverDeliveryDashboard 
        onSelectDelivery={(deliveryId) => {
          console.log('Livraison sélectionnée:', deliveryId);
        }}
      />
    );
  }

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
            <div className="w-24 h-6 bg-muted rounded animate-pulse" />
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="w-32 h-8 bg-muted rounded animate-pulse" />
              <div className="w-full h-2 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-destructive/5 p-4">
        <div className="max-w-md mx-auto">
          <Card className="border-destructive/20 shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">Erreur de suivi</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button onClick={refreshTracking} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Interface pour clients - Tracker amélioré avec données temps réel
  return (
    <EnhancedDeliveryTracker 
      orderId={orderId}
      onBack={onBack}
    />
  );
}