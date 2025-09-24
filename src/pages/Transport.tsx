import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ModernTaxiInterface from '@/components/transport/ModernTaxiInterface';
import AdvancedTaxiTracker from '@/components/transport/AdvancedTaxiTracker';
import { TaxiTestComponent } from '@/components/transport/TaxiTestComponent';
import { Car, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TransportPage = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'create' | 'track' | 'test'>('create');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const handleBookingCreated = (data: any) => {
    console.log('🚗 Booking created:', data);
    if (data.bookingId) {
      setActiveBookingId(data.bookingId);
      setActiveView('track');
    }
  };

  const handleBackToCreate = () => {
    setActiveView('create');
    setActiveBookingId(null);
  };

  const handleShowTest = () => {
    setActiveView('test');
  };

  if (activeView === 'track' && activeBookingId) {
    return (
      <AdvancedTaxiTracker
        bookingId={activeBookingId}
        onBack={handleBackToCreate}
      />
    );
  }

  // Si on est en mode test
  if (activeView === 'test') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tests Système Taxi</h1>
          <button 
            onClick={handleBackToCreate}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            Retour à l'interface
          </button>
        </div>
        <TaxiTestComponent />
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
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Kwenda Taxi
              </h1>
              <p className="text-sm text-muted-foreground">Service de taxi VTC</p>
            </div>
          </div>
          <button 
            onClick={handleShowTest}
            className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
          >
            Tests Système
          </button>
        </div>
      </div>

      {/* Main Content - Interface taxi moderne */}
      <ModernTaxiInterface
        onSubmit={handleBookingCreated}
        onCancel={handleBackToCreate}
      />
    </div>
  );
};

export default TransportPage;