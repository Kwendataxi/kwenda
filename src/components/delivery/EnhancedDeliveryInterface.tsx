import React from 'react';
import SlideDeliveryInterface from './SlideDeliveryInterface';

interface EnhancedDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Interface de livraison moderne avec slides fluides - Sans tremblements
const EnhancedDeliveryInterface = ({ onSubmit, onCancel }: EnhancedDeliveryInterfaceProps) => {
  return <SlideDeliveryInterface onSubmit={onSubmit} onCancel={onCancel} />;
};

export default EnhancedDeliveryInterface;