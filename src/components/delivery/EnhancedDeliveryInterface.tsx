import React from 'react';
import SimpleDeliveryInterface from './SimpleDeliveryInterface';

interface EnhancedDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// DEPRECATED: Use SimpleDeliveryInterface directly instead
// Cette interface sera supprimée dans une prochaine version
const EnhancedDeliveryInterface = ({ onSubmit, onCancel }: EnhancedDeliveryInterfaceProps) => {
  console.warn('⚠️ EnhancedDeliveryInterface is deprecated. Use SimpleDeliveryInterface directly.');
  return <SimpleDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default EnhancedDeliveryInterface;