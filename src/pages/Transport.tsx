import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ModernTaxiInterface from '@/components/transport/ModernTaxiInterface';
import AdvancedTaxiTracker from '@/components/transport/AdvancedTaxiTracker';
import DriverRideNotifications from '@/components/driver/DriverRideNotifications';
import { TransportErrorBoundary } from '@/components/transport/TransportErrorBoundary';
import type { LocationData } from '@/types/location';

interface NavigationState {
  prefilledAddress?: {
    address: string;
    name?: string;
    lat: number;
    lng: number;
  };
  addressType?: 'destination' | 'pickup';
}

const TransportPage = () => {
  const location = useLocation();
  const [activeView, setActiveView] = useState<'create' | 'track'>('create');
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [initialDestination, setInitialDestination] = useState<LocationData | null>(null);

  // Récupérer l'adresse pré-remplie depuis la navigation (Mes adresses)
  useEffect(() => {
    const state = location.state as NavigationState | null;
    
    if (state?.prefilledAddress && state?.addressType === 'destination') {
      setInitialDestination({
        address: state.prefilledAddress.address,
        name: state.prefilledAddress.name,
        lat: state.prefilledAddress.lat,
        lng: state.prefilledAddress.lng,
        type: 'database'
      });
      
      // Nettoyer le state pour éviter re-application au retour
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
          initialDestination={initialDestination}
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