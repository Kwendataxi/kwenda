import React from 'react';
import ModernDeliveryInterface from './ModernDeliveryInterface';

interface EnhancedDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Interface de livraison moderne avec géolocalisation améliorée et UI responsive
const EnhancedDeliveryInterface = ({ onSubmit, onCancel }: EnhancedDeliveryInterfaceProps) => {
  return <ModernDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default EnhancedDeliveryInterface;