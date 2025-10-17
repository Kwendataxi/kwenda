import { useMemo } from 'react';
import { Car, Truck, ShoppingBag, Utensils, MoreHorizontal } from 'lucide-react';
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
    food: number;
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
    food: Utensils,
    more: MoreHorizontal
  };
  
  const gradientMap: Record<string, string> = {
    taxi: 'from-congo-red-electric via-congo-red to-congo-red-vibrant',
    delivery: 'from-congo-yellow-electric via-congo-yellow to-congo-yellow-vibrant',
    rental: 'from-congo-green-electric via-congo-green to-congo-green-vibrant',
    marketplace: 'from-secondary via-accent to-secondary-light',
    food: 'from-orange-500 via-red-500 to-orange-600',
    more: 'from-gray-500 via-gray-600 to-gray-700'
  };

  const nameMap: Record<string, string> = {
    taxi: 'Taxi',
    delivery: t('home.services.delivery'),
    rental: t('home.services.rental'),
    marketplace: t('home.services.shopping'),
    food: t('home.services.food'),
    more: t('home.services.more')
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
        { id: 'food', name: t('home.services.food'), icon: Utensils, gradient: 'from-orange-500 to-red-500', available: true },
        { id: 'more', name: t('home.services.more'), icon: MoreHorizontal, gradient: 'from-gray-500 to-gray-700', available: true }
      ];
    }
    
    // Grouper par catégorie et prendre le premier service actif de chaque catégorie
    const categories: Array<'taxi' | 'delivery' | 'rental' | 'marketplace' | 'food'> = 
      ['taxi', 'delivery', 'rental', 'marketplace', 'food'];
    
    const servicesList = categories.map(category => {
      const service = configurations.find(
        c => c.service_category === category && c.is_active
      );
      
      if (!service) return null;

      const serviceId = category === 'taxi' ? 'transport' : category;
      
      return {
        id: serviceId,
        name: category === 'taxi' ? 'Taxi' : (category === 'food' ? 'Food' : (service.display_name || nameMap[category])),
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

    // Ajouter le service "Plus" à la fin
    return [...servicesList, {
      id: 'more',
      name: t('home.services.more'),
      icon: MoreHorizontal,
      gradient: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
      available: true
    }];
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

  // Couleurs plates modernes pour chaque service
  const serviceColors: Record<string, string> = {
    transport: '#E31E24',
    delivery: '#F4B223',
    rental: '#00A651',
    marketplace: 'linear-gradient(135deg, #2596be 0%, #5b21b6 100%)',
    food: '#FF6B35',
    more: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)'
  };

  return (
    <div className="px-4">
      <div className="grid grid-cols-3 gap-x-5 gap-y-6">
        {mainServices.map((service, index) => {
          const Icon = service.icon;
          const notificationCount = serviceNotifications?.[service.id as keyof typeof serviceNotifications] || 0;

          return (
            <button
              key={service.id}
              onClick={() => onServiceSelect(service.id)}
              className="relative flex flex-col items-center gap-2.5 group transition-all duration-400 ease-out hover:scale-105 active:scale-95 animate-fade-in"
              style={{
                animationDelay: `${index * 80}ms`,
              }}
            >
              {/* Icon container - design doux 2 lignes */}
              <div
                className="relative flex items-center justify-center w-[72px] h-[72px] rounded-[28px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all duration-400 ease-out group-hover:-translate-y-0.5 group-active:translate-y-0"
                style={{
                  background: serviceColors[service.id] || serviceColors.transport
                }}
              >
                <Icon className="w-11 h-11 text-white transition-all duration-400 ease-out group-hover:rotate-3 group-hover:scale-105" strokeWidth={2.5} />
                
                {/* Notification badge */}
                {notificationCount > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 bg-[#E31E24] text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg border border-white animate-pulse">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </div>
                )}
              </div>
              
              {/* Service name - typographie épurée */}
              <span className="text-sm font-bold text-center leading-tight text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-primary">
                {service.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};