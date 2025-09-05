import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SimpleDeliveryInterface from '@/components/delivery/SimpleDeliveryInterface';
import DeliveryLiveTracker from '@/components/delivery/DeliveryLiveTracker';
import { Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DeliveryPage = () => {
  const [activeView, setActiveView] = useState<'create' | 'track'>('create');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const handleOrderCreated = (data: any) => {
    console.log('📦 Order created:', data);
    if (data.orderId) {
      setActiveOrderId(data.orderId);
      setActiveView('track');
    }
  };

  const handleBackToCreate = () => {
    setActiveView('create');
    setActiveOrderId(null);
  };

  if (activeView === 'track' && activeOrderId) {
    return (
      <DeliveryLiveTracker
        orderId={activeOrderId}
        onBack={handleBackToCreate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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

      {/* Main Content */}
      <SimpleDeliveryInterface
        onSubmit={handleOrderCreated}
        onCancel={handleBackToCreate}
      />
    </div>
  );
};

export default DeliveryPage;