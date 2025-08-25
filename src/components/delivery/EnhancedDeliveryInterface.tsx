import React from 'react';
import UltraModernDeliveryInterface from './UltraModernDeliveryInterface';

interface EnhancedDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Interface de livraison ultra-moderne avec design glassmorphism et animations fluides
const EnhancedDeliveryInterface = ({ onSubmit, onCancel }: EnhancedDeliveryInterfaceProps) => {
  return <UltraModernDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default EnhancedDeliveryInterface;