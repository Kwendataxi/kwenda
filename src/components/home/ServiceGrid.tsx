import { Car, Truck, ShoppingBag, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import NotificationBadge from '@/components/notifications/NotificationBadge';

interface ServiceGridProps {
  onServiceSelect: (service: string) => void;
  serviceNotifications?: {
    transport: number;
    delivery: number;
    marketplace: number;
    lottery: number;
    rental: number;
  };
}

export const ServiceGrid = ({ onServiceSelect, serviceNotifications }: ServiceGridProps) => {
  const { t } = useLanguage();
  
  // Services principaux avec designs améliorés
  const mainServices = [
    {
      id: 'transport',
      name: t('home.services.taxi'),
      icon: Car,
      gradient: 'from-primary to-primary-glow',
      available: true
    },
    {
      id: 'delivery',
      name: t('home.services.delivery'),
      icon: Truck,
      gradient: 'from-secondary to-secondary-light',
      available: true
    },
    {
      id: 'rental',
      name: t('home.services.rental'),
      icon: Car,
      gradient: 'from-green-500 to-green-600',
      available: true
    },
    {
      id: 'marketplace',
      name: t('home.services.shopping'),
      icon: ShoppingBag,
      gradient: 'from-accent to-accent-light',
      available: true
    },
    {
      id: 'lottery',
      name: t('home.services.lottery'),
      icon: Zap,
      gradient: 'from-purple-500 to-pink-500',
      available: true
    }
  ];

  return (
    <div className="px-4 mb-6">
      <div className="grid grid-cols-4 gap-4 justify-items-center">
        {mainServices.map((service) => {
          const Icon = service.icon;
          const notificationCount = serviceNotifications?.[service.id as keyof typeof serviceNotifications] || 0;
          
          return (
            <div key={service.id} className="flex flex-col items-center">
              <div className="relative">
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
                
                {/* Badge de notification */}
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <NotificationBadge 
                      count={notificationCount}
                      variant="destructive"
                      size="sm"
                      pulse={true}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-foreground mt-2 text-center line-clamp-2">{service.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};