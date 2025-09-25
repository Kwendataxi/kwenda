import React from 'react';
import UniversalTaxiTracker from './UniversalTaxiTracker';

interface ModernTaxiTrackerProps {
  bookingId: string;
  onBack?: () => void;
}

export default function ModernTaxiTracker({ bookingId, onBack }: ModernTaxiTrackerProps) {
  return (
    <UniversalTaxiTracker 
      bookingId={bookingId}
      onBack={onBack}
    />
  );
}