import { Bike, Truck, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type DeliveryMode = 'flash' | 'cargo' | 'flex' | 'maxicharge';

interface DeliveryModeSelectorProps {
  selectedMode: DeliveryMode;
  onModeChange: (mode: DeliveryMode) => void;
}

const DeliveryModeSelector = ({ selectedMode, onModeChange }: DeliveryModeSelectorProps) => {
  const { t } = useLanguage();
  return (
    <div className="px-4 py-3 bg-white border-b border-border">
      <div className="flex bg-muted/50 rounded-xl p-1">
        <button
          onClick={() => onModeChange('flash')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-200 ${
            selectedMode === 'flash'
              ? 'bg-white shadow-sm text-secondary font-semibold'
              : 'text-muted-foreground'
          }`}
        >
          <Bike className="w-5 h-5" />
          <span>{t('delivery.mode.flash')}</span>
        </button>
        <button
          onClick={() => onModeChange('flex')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-200 ${
            selectedMode === 'flex'
              ? 'bg-white shadow-sm text-primary font-semibold'
              : 'text-muted-foreground'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span>{t('delivery.mode.flex')}</span>
        </button>
        <button
          onClick={() => onModeChange('maxicharge')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-200 ${
            selectedMode === 'maxicharge'
              ? 'bg-white shadow-sm text-primary font-semibold'
              : 'text-muted-foreground'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>{t('delivery.mode.maxicharge')}</span>
        </button>
      </div>
    </div>
  );
};

export default DeliveryModeSelector;