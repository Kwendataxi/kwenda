import { 
  Car, 
  Truck, 
  Store, 
  UtensilsCrossed,
  ShoppingCart,
  MapPin,
  Chrome,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ServiceGridProps {
  onServiceSelect: (service: string) => void;
}

export const ServiceGrid = ({ onServiceSelect }: ServiceGridProps) => {
  const mainServices = [
    {
      id: 'transport',
      name: 'Transport',
      icon: Car,
      color: 'bg-blue-500',
      badge: null
    },
    {
      id: 'delivery',
      name: 'Livraison',
      icon: Truck,
      color: 'bg-green-500',
      badge: 'Flash'
    },
    {
      id: 'marketplace',
      name: 'Shopping',
      icon: Store,
      color: 'bg-purple-500',
      badge: 'Nouveau'
    },
    {
      id: 'meals',
      name: 'Repas',
      icon: UtensilsCrossed,
      color: 'bg-orange-500',
      badge: null
    }
  ];

  const secondaryServices = [
    {
      id: 'supermarket',
      name: 'Supermarché',
      icon: ShoppingCart,
      color: 'bg-indigo-500'
    },
    {
      id: 'places',
      name: 'Lieux',
      icon: MapPin,
      color: 'bg-pink-500'
    },
    {
      id: 'browser',
      name: 'Navigation',
      icon: Chrome,
      color: 'bg-gray-500'
    },
    {
      id: 'cargo',
      name: 'Cargo',
      icon: Package,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="px-4 pb-6">
      {/* Main Services Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {mainServices.map((service) => (
          <Button
            key={service.id}
            variant="ghost"
            className="relative h-20 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all"
            onClick={() => onServiceSelect(service.id)}
          >
            {service.badge && (
              <Badge className="absolute -top-1 -right-1 h-5 px-2 text-xs bg-red-500 text-white">
                {service.badge}
              </Badge>
            )}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 ${service.color} rounded-lg flex items-center justify-center`}>
                <service.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">{service.name}</span>
            </div>
          </Button>
        ))}
      </div>

      {/* Secondary Services Grid */}
      <div className="grid grid-cols-4 gap-3">
        {secondaryServices.map((service) => (
          <Button
            key={service.id}
            variant="ghost"
            className="h-16 p-2 bg-white border border-gray-100 rounded-xl shadow-sm"
            onClick={() => onServiceSelect(service.id)}
          >
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 ${service.color} rounded-lg flex items-center justify-center`}>
                <service.icon className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-900 text-center leading-tight">
                {service.name}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};