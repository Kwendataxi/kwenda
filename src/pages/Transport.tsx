import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ModernTaxiInterface from '@/components/transport/ModernTaxiInterface';
import TaxiLiveTracker from '@/components/transport/TaxiLiveTracker';
import { Car, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TransportPage = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'create' | 'track'>('create');
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

  if (activeView === 'track' && activeBookingId) {
    return (
      <TaxiLiveTracker
        bookingId={activeBookingId}
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
                Kwenda Transport
              </h1>
              <p className="text-sm text-muted-foreground">Service de transport VTC</p>
            </div>
          </div>
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