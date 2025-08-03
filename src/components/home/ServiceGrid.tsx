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
      shadowColor: 'shadow-[0_8px_30px_-6px_hsl(357,79%,54%,0.3)]',
      available: true,
      subtitle: 'Courses rapides'
    },
    {
      id: 'delivery',
      name: 'Livraison',
      icon: Truck,
      gradient: 'from-secondary to-secondary-light',
      shadowColor: 'shadow-[0_8px_30px_-6px_hsl(42,89%,52%,0.3)]',
      available: true,
      subtitle: 'Express & Standard'
    },
    {
      id: 'marketplace',
      name: 'Shopping',
      icon: ShoppingBag,
      gradient: 'from-accent to-accent-light',
      shadowColor: 'shadow-[0_8px_30px_-6px_hsl(42,89%,52%,0.3)]',
      available: true,
      subtitle: 'Marketplace local'
    }
  ];

  return (
    <div className="px-6 mb-8">
      {/* Services avec design moderne et effets visuels */}
      <div className="flex justify-center gap-8">
        {mainServices.map((service, index) => {
          const Icon = service.icon;
          return (
            <div 
              key={service.id} 
              className="flex flex-col items-center animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => onServiceSelect(service.id)}
                className={`
                  relative w-20 h-20 bg-gradient-to-br ${service.gradient} 
                  rounded-2xl flex items-center justify-center text-white 
                  transition-all duration-300 hover:scale-110 active:scale-95 
                  ${service.shadowColor} hover:shadow-lg group
                  ${service.available ? '' : 'opacity-50 cursor-not-allowed'}
                `}
              >
                <Icon className="h-8 w-8 group-hover:scale-110 transition-transform duration-200" />
                
                {/* Effet de brillance au hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Indicateur de disponibilité */}
                {service.available && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse">
                    <div className="absolute inset-0.5 bg-green-400 rounded-full"></div>
                  </div>
                )}
              </button>
              
              <div className="text-center mt-3">
                <span className="text-sm font-semibold text-foreground block">{service.name}</span>
                <span className="text-xs text-muted-foreground mt-0.5 block">{service.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Message promotionnel subtil */}
      <div className="text-center mt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Service 24h/7j dans Kinshasa</span>
        </div>
      </div>
    </div>
  );
};