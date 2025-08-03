import { Car, Truck, ShoppingBag, Zap } from 'lucide-react';

interface ServiceGridProps {
  onServiceSelect: (service: string) => void;
}

export const ServiceGrid = ({ onServiceSelect }: ServiceGridProps) => {
  // Services principaux avec designs améliorés
  const mainServices = [
      {
      id: 'transport',
      name: 'Taxi',
      icon: Car,
      gradient: 'from-primary to-primary-glow',
      available: true
    },
    {
      id: 'delivery',
      name: 'Livraison',
      icon: Truck,
      gradient: 'from-secondary to-secondary-light',
      available: true
    },
    {
      id: 'marketplace',
      name: 'Shopping',
      icon: ShoppingBag,
      gradient: 'from-accent to-accent-light',
      available: true
    }
  ];

  return (
    <div className="px-4 mb-6">
      <div className="flex justify-center gap-6">
        {mainServices.map((service) => {
          const Icon = service.icon;
          return (
            <div key={service.id} className="flex flex-col items-center">
              <button
                onClick={() => onServiceSelect(service.id)}
                className={`
                  w-16 h-16 bg-gradient-to-br ${service.gradient} 
                  rounded-xl flex items-center justify-center text-white 
                  transition-all duration-200 hover:scale-105 active:scale-95
                  shadow-md hover:shadow-lg
                `}
              >
                <Icon className="h-7 w-7" />
              </button>
              <span className="text-sm font-medium text-foreground mt-2">{service.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};