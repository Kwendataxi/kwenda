import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import StepByStepTaxiInterface from './StepByStepTaxiInterface';

interface ModernTaxiInterfaceProps {
  onBookingRequest: (bookingData: any) => void;
}

const ModernTaxiInterface: React.FC<ModernTaxiInterfaceProps> = ({
  onBookingRequest
}) => {
  // Use the new step-by-step interface
  return <StepByStepTaxiInterface onBookingRequest={onBookingRequest} />;
};

export default ModernTaxiInterface;