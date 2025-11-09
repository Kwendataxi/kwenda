import React, { useState } from 'react';
import ModernTaxiInterface from '@/components/transport/ModernTaxiInterface';
import AdvancedTaxiTracker from '@/components/transport/AdvancedTaxiTracker';
import DriverRideNotifications from '@/components/driver/DriverRideNotifications';
import { TransportErrorBoundary } from '@/components/transport/TransportErrorBoundary';

const TransportPage = () => {
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
      <TransportErrorBoundary>
        <AdvancedTaxiTracker
          bookingId={activeBookingId}
          onBack={handleBackToCreate}
        />
      </TransportErrorBoundary>
    );
  }

  return (
    <TransportErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Interface taxi Yango */}
        <ModernTaxiInterface
          onSubmit={handleBookingCreated}
          onCancel={handleBackToCreate}
        />

        {/* Notifications pour les chauffeurs */}
        <DriverRideNotifications />
      </div>
    </TransportErrorBoundary>
  );
};

export default TransportPage;