import { Bike, Truck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type DeliveryMode = 'flash' | 'cargo' | 'flex' | 'maxicharge';

interface DeliveryModeSelectorProps {
  selectedMode: DeliveryMode;
  onModeChange: (mode: DeliveryMode) => void;
}

const DeliveryModeSelector = ({ selectedMode, onModeChange }: DeliveryModeSelectorProps) => {
  const { t } = useLanguage();
  return (
    <div className="px-4 py-3 bg-white border-b border-grey-100">
      <div className="flex bg-grey-100 rounded-xl p-1">
        <button
          onClick={() => onModeChange('flash')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-200 ${
            selectedMode === 'flash'
              ? 'bg-white shadow-sm text-orange-600 font-semibold'
              : 'text-grey-600'
          }`}
        >
          <Bike className="w-5 h-5" />
          <span>{t('delivery.mode.flash')}</span>
        </button>
        <button
          onClick={() => onModeChange('cargo')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-200 ${
            selectedMode === 'cargo'
              ? 'bg-white shadow-sm text-red-600 font-semibold'
              : 'text-grey-600'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span>{t('delivery.mode.cargo')}</span>
        </button>
      </div>
    </div>
  );
};

export default DeliveryModeSelector;