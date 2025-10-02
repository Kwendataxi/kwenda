import { useMemo } from 'react';
import { Car, Truck, ShoppingBag, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import { Skeleton } from '@/components/ui/skeleton';

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
    taxi: 'from-pink-500 via-rose-500 to-pink-600',
    delivery: 'from-yellow-400 via-amber-400 to-yellow-500',
    rental: 'from-green-500 via-emerald-500 to-green-600',
    marketplace: 'from-yellow-300 via-amber-300 to-yellow-400',
    lottery: 'from-purple-500 via-pink-500 to-purple-600'
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

  // Skeleton loader pendant le chargement
  if (loading) {
    return (
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 justify-items-center">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
              <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-2xl" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 justify-items-center">
        {mainServices.map((service, index) => {
          const Icon = service.icon;
          const notificationCount = serviceNotifications?.[service.id as keyof typeof serviceNotifications] || 0;
          
          return (
            <div 
              key={service.id} 
              className="flex flex-col items-center animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative group">
                <button
                  onClick={() => onServiceSelect(service.id)}
                  className={`
                    w-20 h-20 md:w-24 md:h-24
                    bg-gradient-to-br ${service.gradient}
                    rounded-2xl
                    flex items-center justify-center
                    text-white
                    
                    shadow-xl
                    ring-2 ring-white/20
                    border border-white/10
                    
                    transition-all duration-300 ease-out
                    
                    hover:scale-110
                    hover:rotate-2
                    hover:shadow-2xl
                    
                    active:scale-95
                    active:rotate-0
                  `}
                >
                  <Icon className="h-9 w-9 md:h-11 md:w-11 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" />
                </button>
                
                {/* Badge de notification premium */}
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 animate-pulse">
                    <NotificationBadge 
                      count={notificationCount}
                      variant="destructive"
                      size="sm"
                      pulse={true}
                      className="shadow-lg shadow-red-500/50"
                    />
                  </div>
                )}
              </div>
              <span className="text-sm md:text-base font-semibold tracking-tight text-foreground mt-3 text-center line-clamp-2 transition-colors group-hover:text-primary">
                {service.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};