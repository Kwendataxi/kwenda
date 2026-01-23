import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import SoftServiceCard from './SoftServiceCard';

interface DeliveryService {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  subtitle: string;
  icon: any;
  estimatedTime: string;
}

interface DeliveryPricing {
  price: number;
  distance: number;
  duration: number;
}

interface HorizontalServiceSelectorProps {
  services: DeliveryService[];
  selectedService: DeliveryService | null;
  pricing: Record<string, DeliveryPricing>;
  loadingPricing: boolean;
  onServiceSelect: (service: DeliveryService) => void;
  className?: string;
}

const HorizontalServiceSelector: React.FC<HorizontalServiceSelectorProps> = ({
  services,
  selectedService,
  pricing,
  loadingPricing,
  onServiceSelect,
  className
}) => {
  return (
    <div className={cn("w-full", className)}>
      {/* Section title - Ultra simplifié */}
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-foreground">
          Services
        </h2>
      </div>

      {/* Horizontal scroll container */}
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Services container */}
        <div className="flex gap-3 pb-4 px-2 overflow-x-auto scrollbar-hide horizontal-scroll">
          {services.map((service) => (
            <SoftServiceCard
              key={service.id}
              id={service.id}
              name={service.name}
              subtitle={service.subtitle}
              icon={service.icon}
              estimatedTime={service.estimatedTime}
              price={pricing[service.id]?.price}
              distance={pricing[service.id]?.distance}
              duration={pricing[service.id]?.duration}
              isSelected={selectedService?.id === service.id}
              isLoading={loadingPricing}
              onSelect={() => onServiceSelect(service)}
            />
          ))}
        </div>
      </div>

      {/* Selected service summary - Ultra simplifié */}
      {selectedService && (
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 animate-fade-up">
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-primary animate-bounce" />
            <span className="font-semibold text-foreground">
              {selectedService.name.replace('Kwenda ', '')} prêt !
            </span>
            {pricing[selectedService.id] && !loadingPricing && (
              <span className="font-bold text-primary">
                {new Intl.NumberFormat('fr-CD', {
                  style: 'currency',
                  currency: 'CDF',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(pricing[selectedService.id].price)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalServiceSelector;