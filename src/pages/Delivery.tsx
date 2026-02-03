import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StepByStepDeliveryInterface from '@/components/delivery/StepByStepDeliveryInterface';
import { OrderConfirmationStep } from '@/components/delivery/OrderConfirmationStep';
import DeliveryTrackingHub from '@/components/delivery/DeliveryTrackingHub';
import { Package, ArrowLeft } from 'lucide-react';
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
        {/* Header soft et épuré */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/5">
          <div className="max-w-6xl mx-auto px-4 py-2.5">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToHome}
                className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
                <Package className="h-4.5 w-4.5 text-foreground/60" />
              </div>

              <div className="flex flex-col">
                <h1 className="text-base font-medium text-foreground tracking-tight">
                  Confirmation
                </h1>
                <p className="text-[11px] text-muted-foreground/60">Vérifiez votre livraison</p>
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
    <StepByStepDeliveryInterface
      onSubmit={handleDataReady}
      onCancel={handleBackToHome}
    />
  );
};

export default DeliveryPage;