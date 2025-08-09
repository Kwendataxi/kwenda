import { useState } from 'react';
import OneStepDeliveryInterface from './OneStepDeliveryInterface';
import DeliveryLiveTracker from './DeliveryLiveTracker';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

type DeliveryModeLocal = 'flash' | 'flex' | 'maxicharge';

const ModernDeliveryInterface = ({ 
  onSubmit, 
  onCancel, 
  activeTab = 'home', 
  onTabChange = () => {} 
}: ModernDeliveryInterfaceProps) => {
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
      <DeliveryLiveTracker
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
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
};

export default ModernDeliveryInterface;