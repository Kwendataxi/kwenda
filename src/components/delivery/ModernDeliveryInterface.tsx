import { useState } from 'react';
import GenericDeliveryInterface from './GenericDeliveryInterface';
import DeliveryConfirmation from './DeliveryConfirmation';
import { Bike, Truck, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ModernDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

type DeliveryModeLocal = 'flash' | 'flex' | 'maxicharge';

const ModernDeliveryInterface = ({ onSubmit, onCancel }: ModernDeliveryInterfaceProps) => {
  const [deliveryMode, setDeliveryMode] = useState<DeliveryModeLocal>('flash');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const { t } = useLanguage();

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
      {/* Floating Mode Selector */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-border/50 px-4 py-2">
        <div className="flex bg-muted/50 rounded-2xl p-1 max-w-xl mx-auto gap-1">
          <button
            onClick={() => setDeliveryMode('flash')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 ${
              deliveryMode === 'flash'
                ? 'bg-white shadow-md text-secondary font-semibold scale-105'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span className="text-sm">Flash</span>
          </button>
          <button
            onClick={() => setDeliveryMode('flex')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 ${
              deliveryMode === 'flex'
                ? 'bg-white shadow-md text-primary font-semibold scale-105'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span className="text-sm">Flex</span>
          </button>
          <button
            onClick={() => setDeliveryMode('maxicharge')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 ${
              deliveryMode === 'maxicharge'
                ? 'bg-white shadow-md text-primary font-semibold scale-105'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-sm">MaxiCharge</span>
          </button>
        </div>
      </div>

      {/* Render generic interface for selected mode */}
      <GenericDeliveryInterface
        mode={deliveryMode}
        onSubmit={handleDeliverySubmit}
        onCancel={onCancel}
      />
    </div>
  );
};

export default ModernDeliveryInterface;