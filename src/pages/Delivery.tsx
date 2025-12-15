import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StepByStepDeliveryInterface from '@/components/delivery/StepByStepDeliveryInterface';
import { OrderConfirmationStep } from '@/components/delivery/OrderConfirmationStep';
import DeliveryTrackingHub from '@/components/delivery/DeliveryTrackingHub';
import { Package, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoleBasedNavigation } from '@/hooks/useRoleBasedNavigation';

const DeliveryPage = () => {
  const navigate = useNavigate();
  const { getRedirectPath, primaryRole } = useRoleBasedNavigation();
  const [activeView, setActiveView] = useState<'create' | 'confirm' | 'track'>('create');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [deliveryData, setDeliveryData] = useState<any>(null);

  const handleDataReady = (data: any) => {
    console.log('📦 Data ready for confirmation:', data);
    setDeliveryData(data);
    setActiveView('confirm');
  };

  const handleOrderCreated = (orderId: string) => {
    console.log('📦 Order created with ID:', orderId);
    setActiveOrderId(orderId);
    setActiveView('track');
  };

  const handleBackToCreate = () => {
    setActiveView('create');
    setActiveOrderId(null);
    setDeliveryData(null);
  };

  const handleBackToConfirm = () => {
    setActiveView('confirm');
  };

  const handleBackToHome = () => {
    const homePath = getRedirectPath(primaryRole);
    navigate(homePath);
  };

  if (activeView === 'track' && activeOrderId) {
    return (
      <DeliveryTrackingHub
        orderId={activeOrderId}
        onBack={handleBackToCreate}
      />
    );
  }

  if (activeView === 'confirm' && deliveryData) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header moderne et épuré */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/10">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToHome}
                className="h-10 w-10 rounded-xl bg-card hover:bg-muted transition-colors"
              >
                <Home className="h-5 w-5 text-muted-foreground" />
              </Button>

              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>

              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  Confirmation
                </h1>
                <p className="text-xs text-muted-foreground/70">Vérifiez votre livraison</p>
              </div>
            </div>
          </div>
        </header>
        
        <OrderConfirmationStep
          pickup={{
            location: deliveryData.pickup.location,
            contact: deliveryData.pickup.contact || { name: 'Expéditeur', phone: '' }
          }}
          destination={{
            location: deliveryData.destination.location,
            contact: deliveryData.destination.contact || { name: 'Destinataire', phone: '' }
          }}
          service={{
            id: deliveryData.service.mode,
            name: deliveryData.service.name,
            subtitle: deliveryData.service.description,
            description: deliveryData.service.description,
            icon: deliveryData.service.iconEmoji,
            features: deliveryData.service.features || ['Suivi temps réel', 'Support 24/7'],
            estimatedTime: deliveryData.service.estimatedTime || '2-4h'
          }}
          pricing={{
            price: deliveryData.pricing.price,
            distance: deliveryData.distance || 0,
            duration: deliveryData.duration || 0
          }}
          onConfirm={handleOrderCreated}
          onBack={() => setActiveView('create')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header moderne et épuré */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Bouton retour minimaliste */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToHome}
              className="h-10 w-10 rounded-xl bg-card hover:bg-muted transition-colors"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* Icône service avec fond doux */}
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>

            {/* Titre et sous-titre */}
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">
                Kwenda <span className="text-primary">Delivery</span>
              </h1>
              <p className="text-xs text-muted-foreground/70">Livraison express</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Interface moderne stabilisée */}
      <StepByStepDeliveryInterface
        onSubmit={handleDataReady}
        onCancel={handleBackToCreate}
      />
    </div>
  );
};

export default DeliveryPage;