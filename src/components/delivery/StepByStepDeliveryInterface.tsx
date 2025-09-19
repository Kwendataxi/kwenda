import React from 'react';
import UltraModernDeliveryInterface from './UltraModernDeliveryInterface';

interface StepByStepDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const StepByStepDeliveryInterface = ({ onSubmit, onCancel }: StepByStepDeliveryInterfaceProps) => {
  // Migration vers l'interface ultra-moderne avec géolocalisation robuste
  return <UltraModernDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default StepByStepDeliveryInterface;