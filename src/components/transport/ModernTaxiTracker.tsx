import React from 'react';
import ModernTracker from '@/components/tracking/ModernTracker';

interface ModernTaxiTrackerProps {
  bookingId: string;
  onBack?: () => void;
}

export default function ModernTaxiTracker({ bookingId, onBack }: ModernTaxiTrackerProps) {
  return (
    <ModernTracker 
      trackingId={bookingId}
      trackingType="taxi"
      onBack={onBack}
      enableRealtimeLocation={true}
    />
  );
}