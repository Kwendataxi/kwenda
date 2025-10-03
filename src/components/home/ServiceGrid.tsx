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
    taxi: 'from-congo-red-electric via-congo-red to-congo-red-vibrant',
    delivery: 'from-congo-yellow-electric via-congo-yellow to-congo-yellow-vibrant',
    rental: 'from-congo-green-electric via-congo-green to-congo-green-vibrant',
    marketplace: 'from-secondary via-accent to-secondary-light',
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

  // Couleurs pures pour chaque service (design original)
  const pureColorMap: Record<string, string> = {
    transport: '#E31E24', // Rouge Congo pur
    delivery: '#F4B223',  // Jaune doré
    rental: '#00A651',    // Vert éclatant
    marketplace: '#F4B223', // Jaune-orange
    lottery: 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)' // Gradient violet-rose
  };

  return (
    <div className="px-6">
      <div className="grid grid-cols-4 gap-6">
        {mainServices.map((service, index) => {
          const Icon = service.icon;
          const notificationCount = serviceNotifications?.[service.id as keyof typeof serviceNotifications] || 0;
          const isGradient = service.id === 'lottery';

          return (
            <button
              key={service.id}
              onClick={() => onServiceSelect(service.id)}
              className="relative flex flex-col items-center gap-3 p-6 rounded-[32px] bg-neutral-100 dark:bg-neutral-800 group transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md animate-fade-in"
              style={{
                animationDelay: `${index * 80}ms`,
              }}
            >
              {/* Icon container avec couleur pure et effet 3D */}
              <div
                className="relative flex items-center justify-center w-20 h-20 rounded-[28px] shadow-[0_8px_16px_rgba(0,0,0,0.15)] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all duration-300"
                style={{
                  background: pureColorMap[service.id] || pureColorMap.transport
                }}
              >
                <Icon className="w-9 h-9 text-white relative z-10 drop-shadow-md" strokeWidth={2.5} />
                
                {/* Notification badge - très visible */}
                {notificationCount > 0 && (
                  <div className="absolute -top-2 -right-2 min-w-[24px] h-[24px] px-1.5 bg-[#E31E24] text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-white animate-bounce">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </div>
                )}
              </div>
              
              {/* Service name - noir gras */}
              <span className="text-sm font-black text-center leading-tight text-gray-900 dark:text-gray-100">
                {service.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};