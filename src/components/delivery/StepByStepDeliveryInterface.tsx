import React from 'react';
import ModernDeliveryInterface from './ModernDeliveryInterface';

interface StepByStepDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const StepByStepDeliveryInterface = ({ onSubmit, onCancel }: StepByStepDeliveryInterfaceProps) => {
  // Interface moderne simplifiée avec géolocalisation robuste
  return <ModernDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default StepByStepDeliveryInterface;