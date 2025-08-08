import { useState } from 'react';
import OneStepDeliveryInterface from './OneStepDeliveryInterface';
import DeliveryTracking from './DeliveryTracking';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

type DeliveryModeLocal = 'flash' | 'flex' | 'maxicharge';

const ModernDeliveryInterface = ({ onSubmit, onCancel }: ModernDeliveryInterfaceProps) => {
  const [currentView, setCurrentView] = useState<'main' | 'tracking'>('main');
  const [orderData, setOrderData] = useState<any>(null);
  const { t } = useLanguage();

  const handleDeliverySubmit = (data: any) => {
    setOrderData(data);
    setCurrentView('tracking');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setOrderData(null);
  };

  const handleComplete = () => {
    onSubmit(orderData);
  };

  if (currentView === 'tracking' && orderData) {
    return (
      <DeliveryTracking
        orderId={orderData.orderId}
        orderData={orderData}
        onBack={handleBackToMain}
      />
    );
  }

  return (
    <OneStepDeliveryInterface
      onSubmit={handleDeliverySubmit}
      onCancel={onCancel}
    />
  );
};

export default ModernDeliveryInterface;