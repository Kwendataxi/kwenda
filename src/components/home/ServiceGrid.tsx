import { Car, Truck, ShoppingBag } from 'lucide-react';

interface ServiceGridProps {
  onServiceSelect: (service: string) => void;
}

export const ServiceGrid = ({ onServiceSelect }: ServiceGridProps) => {
  // Services principaux uniquement (3 services)
  const mainServices = [
    {
      id: 'transport',
      name: 'Transport',
      icon: Car,
      gradient: 'from-primary to-primary-glow',
      badge: 'Populaire'
    },
    {
      id: 'delivery',
      name: 'Livraison',
      icon: Truck,
      gradient: 'from-secondary to-secondary-light',
      badge: 'Rapide'
    },
    {
      id: 'marketplace',
      name: 'Shopping',
      icon: ShoppingBag,
      gradient: 'from-accent to-accent-light',
      badge: 'Nouveau'
    }
  ];

  return (
    <div className="px-4 mb-8">
      {/* Services principaux - Design moderne en grille 3x1 */}
      <div className="grid grid-cols-3 gap-4">
        {mainServices.map((service) => {
          const Icon = service.icon;
          return (
            <button
              key={service.id}
              onClick={() => onServiceSelect(service.id)}
              className={`relative group overflow-hidden bg-gradient-to-br ${service.gradient} rounded-2xl text-white transition-all duration-300 hover:scale-105 active:scale-95`}
              style={{ boxShadow: 'var(--shadow-elegant)' }}
            >
              <div className="relative z-10 p-6 flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-semibold text-sm leading-tight">{service.name}</span>
              </div>
              
              {/* Badge moderne */}
              {service.badge && (
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-xs px-2 py-1 rounded-full border border-white/20">
                  {service.badge}
                </div>
              )}
              
              {/* Effet de brillance au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
};