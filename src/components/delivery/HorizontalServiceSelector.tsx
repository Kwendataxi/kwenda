import React from 'react';
import { cn } from '@/lib/utils';
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
      {/* Section title */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Choisissez votre service
        </h2>
        <p className="text-muted-foreground mt-2">
          Sélectionnez le service qui correspond à vos besoins
        </p>
      </div>

      {/* Horizontal scroll container */}
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        {/* Services container */}
        <div className="flex gap-4 pb-4 px-4 overflow-x-auto scrollbar-hide horizontal-scroll">
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

      {/* Selected service summary */}
      {selectedService && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 animate-fade-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="font-medium text-foreground">
                {selectedService.name} sélectionné
              </span>
            </div>
            {pricing[selectedService.id] && !loadingPricing && (
              <div className="text-right">
                <div className="font-bold text-primary">
                  {new Intl.NumberFormat('fr-CD', {
                    style: 'currency',
                    currency: 'CDF',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(pricing[selectedService.id].price)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Estimation finale
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HorizontalServiceSelector;