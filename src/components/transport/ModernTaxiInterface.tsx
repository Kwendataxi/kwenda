import React, { useState } from 'react';
import { ModernTaxiHome } from './ModernTaxiHome';
import StepByStepTaxiInterface from './StepByStepTaxiInterface';

interface ModernTaxiInterfaceProps {
  onBookingRequest: (bookingData: any) => void;
  initialPickup?: { address: string; coordinates?: { lat: number; lng: number } };
  initialDestination?: { address: string; coordinates?: { lat: number; lng: number } };
}

const ModernTaxiInterface: React.FC<ModernTaxiInterfaceProps> = ({
  onBookingRequest,
  initialPickup,
  initialDestination
}) => {
  const [currentView, setCurrentView] = useState<'home' | 'booking'>('home');
  const [selectedDestination, setSelectedDestination] = useState(initialDestination);
  const [selectedMode, setSelectedMode] = useState<'ride' | 'intercity' | 'rental'>('ride');

  const handleDestinationSelect = (destination: { address: string; coordinates?: { lat: number; lng: number } }) => {
    setSelectedDestination(destination);
    setCurrentView('booking');
  };

  const handleModeSelect = (mode: 'ride' | 'intercity' | 'rental') => {
    setSelectedMode(mode);
    setCurrentView('booking');
  };

  if (currentView === 'home') {
    return (
      <ModernTaxiHome 
        onDestinationSelect={handleDestinationSelect}
        onModeSelect={handleModeSelect}
        recentRides={[]} // TODO: Load real recent rides
      />
    );
  }

  return (
    <StepByStepTaxiInterface 
      onBookingRequest={onBookingRequest}
      initialPickup={initialPickup}
      initialDestination={selectedDestination}
      onBack={() => setCurrentView('home')}
    />
  );
};

export default ModernTaxiInterface;