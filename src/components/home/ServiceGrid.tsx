import { useMemo } from 'react';
import { Car, Truck, ShoppingBag, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
        name: category === 'taxi' ? 'Taxi' : (service.display_name || nameMap[category]),
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
      <div className="px-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-fade-in">
              <Skeleton className="w-16 h-16 md:w-18 md:h-18 rounded-2xl" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {mainServices.map((service, index) => {
          const Icon = service.icon;
          const notificationCount = serviceNotifications?.[service.id as keyof typeof serviceNotifications] || 0;

          return (
            <button
              key={service.id}
              onClick={() => onServiceSelect(service.id)}
              className={cn(
                'group relative flex flex-col items-center gap-2 p-3',
                'transition-all duration-300 ease-out',
                'hover:scale-105 focus:scale-105',
                'animate-fade-in'
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon container with gradient */}
              <div
                className={cn(
                  'relative flex items-center justify-center',
                  'w-16 h-16 md:w-18 md:h-18',
                  'rounded-2xl shadow-lg',
                  'bg-gradient-to-br',
                  service.gradient,
                  'ring-2 ring-white/20',
                  'border border-white/10',
                  'transition-all duration-300',
                  'group-hover:scale-110 group-hover:rotate-2 group-hover:shadow-2xl',
                  'group-focus:scale-110 group-focus:rotate-2'
                )}
              >
                <Icon className="h-7 w-7 md:h-8 md:w-8 text-white transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" />
                
                {/* Notification badge */}
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse shadow-lg shadow-red-500/50 ring-2 ring-background">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </div>
                )}
              </div>

              {/* Service name */}
              <span className="text-xs md:text-sm font-semibold text-foreground/90 tracking-tight text-center leading-tight">
                {service.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};