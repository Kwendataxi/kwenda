import { Car, Truck, ShoppingBag } from 'lucide-react';

interface ServiceGridProps {
  onServiceSelect: (service: string) => void;
}

export const ServiceGrid = ({ onServiceSelect }: ServiceGridProps) => {
  // Services principaux uniquement (3 services)
  const mainServices = [
    {
      id: 'transport',
      name: 'Taxi',
      icon: Car,
      color: 'bg-red-500'
    },
    {
      id: 'delivery',
      name: 'Livraison',
      icon: Truck,
      color: 'bg-yellow-500'
    },
    {
      id: 'marketplace',
      name: 'Shopping',
      icon: ShoppingBag,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="px-6 mb-8">
      {/* Services en cercles simples */}
      <div className="flex justify-center gap-12">
        {mainServices.map((service) => {
          const Icon = service.icon;
          return (
            <div key={service.id} className="flex flex-col items-center">
              <button
                onClick={() => onServiceSelect(service.id)}
                className={`w-16 h-16 ${service.color} rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg`}
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