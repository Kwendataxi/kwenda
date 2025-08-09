import { useState } from 'react';
import OneStepDeliveryInterface from './OneStepDeliveryInterface';
import DeliveryLiveTracker from './DeliveryLiveTracker';
import DeliveryHome from './DeliveryHome';
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
  const [currentView, setCurrentView] = useState<'home' | 'form' | 'tracking'>('home');
  const [orderData, setOrderData] = useState<any>(null);
  const [initialMode, setInitialMode] = useState<DeliveryModeLocal | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | undefined>(undefined);
  const { t } = useLanguage();

  const handleDeliverySubmit = (data: any) => {
    setOrderData(data);
    setCurrentView('tracking');
  };

  const handleBackToMain = () => {
    setCurrentView('home');
    setOrderData(null);
    setInitialMode(null);
    setSelectedPackageId(undefined);
  };

  const handleComplete = () => {
    onSubmit(orderData);
  };

  const handleContinueFromHome = (mode: DeliveryModeLocal, pkgId?: string) => {
    setInitialMode(mode);
    setSelectedPackageId(pkgId);
    setCurrentView('form');
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

  if (currentView === 'home') {
    return (
      <DeliveryHome
        onCancel={onCancel}
        onContinue={handleContinueFromHome}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    );
  }

  return (
    <OneStepDeliveryInterface
      onSubmit={handleDeliverySubmit}
      onCancel={onCancel}
      activeTab={activeTab}
      onTabChange={onTabChange}
      initialSelectedMode={initialMode || undefined}
      selectedPackageId={selectedPackageId}
    />
  );
};

export default ModernDeliveryInterface;