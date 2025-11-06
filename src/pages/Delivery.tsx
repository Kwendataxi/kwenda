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
        {/* Header */}
        <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToHome}
                className="mr-2 gap-2 hover:bg-primary/10"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Accueil</span>
              </Button>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Confirmation de commande
                </h1>
                <p className="text-sm text-muted-foreground">Vérifiez et confirmez votre livraison</p>
              </div>
            </div>
          </div>
        </div>
        
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
            icon: deliveryData.service.icon,
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
      {/* Header */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToHome}
              className="mr-2 gap-2 hover:bg-primary/10"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Accueil</span>
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Kwenda Delivery
              </h1>
              <p className="text-sm text-muted-foreground">Service de livraison rapide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Interface moderne stabilisée */}
      <StepByStepDeliveryInterface
        onSubmit={handleDataReady}
        onCancel={handleBackToCreate}
      />
    </div>
  );
};

export default DeliveryPage;