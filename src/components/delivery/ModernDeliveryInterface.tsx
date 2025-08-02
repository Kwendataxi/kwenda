import { useState } from 'react';
import DeliveryModeSelector, { DeliveryMode } from './DeliveryModeSelector';
import FlashDeliveryInterface from './FlashDeliveryInterface';
import CargoDeliveryInterface from './CargoDeliveryInterface';
import DeliveryConfirmation from './DeliveryConfirmation';

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ModernDeliveryInterface = ({ onSubmit, onCancel }: ModernDeliveryInterfaceProps) => {
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('flash');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  const handleDeliverySubmit = (data: any) => {
    setOrderData(data);
    setShowConfirmation(true);
  };

  const handleTrackOrder = () => {
    // Navigate to order tracking
    onSubmit(orderData);
  };

  const handleBackToHome = () => {
    setShowConfirmation(false);
    setOrderData(null);
    onCancel();
  };

  if (showConfirmation && orderData) {
    return (
      <DeliveryConfirmation
        orderData={orderData}
        onClose={handleBackToHome}
        onTrackOrder={handleTrackOrder}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Delivery Mode Selector */}
      <DeliveryModeSelector
        selectedMode={deliveryMode}
        onModeChange={setDeliveryMode}
      />

      {/* Render appropriate interface based on mode */}
      {deliveryMode === 'flash' ? (
        <FlashDeliveryInterface
          onSubmit={handleDeliverySubmit}
          onCancel={onCancel}
        />
      ) : (
        <CargoDeliveryInterface
          onSubmit={handleDeliverySubmit}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};

export default ModernDeliveryInterface;