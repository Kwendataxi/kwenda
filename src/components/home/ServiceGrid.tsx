import { useMemo } from 'react';
import { Car, Truck, ShoppingBag, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
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
  const { configurations, loading } = useServiceConfigurations();
  
  // Mapping des icônes et gradients par catégorie
  const iconMap: Record<string, any> = {
    taxi: Car,
    delivery: Truck,
    rental: Car,
    marketplace: ShoppingBag,
    lottery: Zap
  };
  
  const gradientMap: Record<string, string> = {
    taxi: 'from-primary to-primary-glow',
    delivery: 'from-secondary to-secondary-light',
    rental: 'from-green-500 to-green-600',
    marketplace: 'from-accent to-accent-light',
    lottery: 'from-purple-500 to-pink-500'
  };

  const nameMap: Record<string, string> = {
    taxi: 'Taxi',
    delivery: t('home.services.delivery'),
    rental: t('home.services.rental'),
    marketplace: t('home.services.shopping'),
    lottery: t('home.services.lottery')
  };

  // Charger les services dynamiquement depuis la DB
  const mainServices = useMemo(() => {
    if (loading || !configurations.length) {
      // Fallback si pas encore chargé
      return [
        { id: 'transport', name: 'Taxi', icon: Car, gradient: 'from-primary to-primary-glow', available: true },
        { id: 'delivery', name: t('home.services.delivery'), icon: Truck, gradient: 'from-secondary to-secondary-light', available: true },
        { id: 'rental', name: t('home.services.rental'), icon: Car, gradient: 'from-green-500 to-green-600', available: true },
        { id: 'marketplace', name: t('home.services.shopping'), icon: ShoppingBag, gradient: 'from-accent to-accent-light', available: true },
        { id: 'lottery', name: t('home.services.lottery'), icon: Zap, gradient: 'from-purple-500 to-pink-500', available: true }
      ];
    }
    
    // Grouper par catégorie et prendre le premier service actif de chaque catégorie
    const categories: Array<'taxi' | 'delivery' | 'rental' | 'marketplace' | 'lottery'> = 
      ['taxi', 'delivery', 'rental', 'marketplace', 'lottery'];
    
    return categories.map(category => {
      const service = configurations.find(
        c => c.service_category === category && c.is_active
      );
      
      if (!service) return null;

      const serviceId = category === 'taxi' ? 'transport' : category;
      
      return {
        id: serviceId,
        name: service.display_name || nameMap[category],
        icon: iconMap[category],
        gradient: gradientMap[category],
        available: service.is_active
      };
    }).filter(Boolean) as Array<{
      id: string;
      name: string;
      icon: any;
      gradient: string;
      available: boolean;
    }>;
  }, [configurations, loading, t]);

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