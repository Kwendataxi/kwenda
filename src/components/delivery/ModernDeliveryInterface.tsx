import { useState } from 'react';
import DeliveryModeSelector, { DeliveryMode } from './DeliveryModeSelector';
import FlashDeliveryInterface from './FlashDeliveryInterface';
import CargoDeliveryInterface from './CargoDeliveryInterface';

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ModernDeliveryInterface = ({ onSubmit, onCancel }: ModernDeliveryInterfaceProps) => {
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('flash');

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
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      ) : (
        <CargoDeliveryInterface
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};

export default ModernDeliveryInterface;