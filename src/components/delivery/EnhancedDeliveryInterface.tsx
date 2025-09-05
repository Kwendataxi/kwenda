import React from 'react';
import SimpleDeliveryInterface from './SimpleDeliveryInterface';

interface EnhancedDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Interface de livraison moderne épurée - Sans confusion ni redondances
const EnhancedDeliveryInterface = ({ onSubmit, onCancel }: EnhancedDeliveryInterfaceProps) => {
  return <SimpleDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default EnhancedDeliveryInterface;