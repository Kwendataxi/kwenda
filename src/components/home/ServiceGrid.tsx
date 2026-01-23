import { useMemo, memo } from 'react';
import { Car, Truck, ShoppingBag, Utensils, LayoutGrid } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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

export const ServiceGrid = memo<ServiceGridProps>(({ onServiceSelect, serviceNotifications }) => {
  const { t } = useLanguage();
  const { configurations, loading } = useServiceConfigurations();
  
  // Charger les services dynamiquement depuis la DB avec maps intégrés (évite dépendances circulaires)
  const mainServices = useMemo(() => {
    // Maps locaux (pas de dépendances externes)
    const icons = {
      taxi: Car,
      delivery: Truck,
      rental: Car,
      marketplace: ShoppingBag,
      food: Utensils,
      more: LayoutGrid
    };
    
    const gradients = {
      taxi: 'from-congo-red-electric via-congo-red to-congo-red-vibrant',
      delivery: 'from-congo-yellow-electric via-congo-yellow to-congo-yellow-vibrant',
      rental: 'from-congo-green-electric via-congo-green to-congo-green-vibrant',
      marketplace: 'from-secondary via-accent to-secondary-light',
      food: 'from-orange-500 via-red-500 to-orange-600',
      more: 'from-gray-500 via-gray-600 to-gray-700'
    };
    
    const names = {
      taxi: 'Taxi',
      delivery: t('home.services.delivery'),
      rental: t('home.services.rental'),
      marketplace: t('home.services.shopping'),
      food: t('home.services.food'),
      more: t('home.services.more')
    };
    
    // Retourner toujours 6 éléments (placeholders si loading) pour éviter l'erreur de hooks
    if (loading) {
      return [
        { id: 'transport-loading', name: names.taxi, icon: icons.taxi, gradient: gradients.taxi, available: false, isLoading: true },
        { id: 'delivery-loading', name: names.delivery, icon: icons.delivery, gradient: gradients.delivery, available: false, isLoading: true },
        { id: 'rental-loading', name: names.rental, icon: icons.rental, gradient: gradients.rental, available: false, isLoading: true },
        { id: 'marketplace-loading', name: names.marketplace, icon: icons.marketplace, gradient: gradients.marketplace, available: false, isLoading: true },
        { id: 'food-loading', name: names.food, icon: icons.food, gradient: gradients.food, available: false, isLoading: true },
        { id: 'more-loading', name: names.more, icon: icons.more, gradient: gradients.more, available: false, isLoading: true },
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
        name: category === 'taxi' ? 'Taxi' : (category === 'food' ? 'Food' : (service.display_name || names[category])),
        icon: icons[category],
        gradient: gradients[category],
        available: service.is_active,
        isLoading: false
      };
    }).filter(Boolean) as Array<{
      id: string;
      name: string;
      icon: any;
      gradient: string;
      available: boolean;
      isLoading: boolean;
    }>;

    // Ajouter le service "Plus" à la fin
    return [...servicesList, {
      id: 'more',
      name: names.more,
      icon: icons.more,
      gradient: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)',
      available: true,
      isLoading: false
    }];
  }, [configurations, loading, t]);

  // ✅ Plus besoin de skeleton loader séparé - useMemo retourne déjà des placeholders

  // Couleurs plates modernes pour chaque service
  const serviceColors = useMemo(() => ({
    transport: '#E31E24',
    delivery: '#F4B223',
    rental: '#00A651',
    marketplace: 'linear-gradient(135deg, #2596be 0%, #5b21b6 100%)',
    food: '#FF6B35',
    more: 'linear-gradient(135deg, #6B7280 0%, #374151 100%)'
  }), []);

  return (
    <div className="px-4">
      <div className="grid grid-cols-3 gap-x-5 gap-y-6" style={{ willChange: 'transform' }}>
        {mainServices.map((service, index) => {
          const Icon = service.icon;
          const notificationCount = serviceNotifications?.[service.id as keyof typeof serviceNotifications] || 0;
          const isMoreService = service.id === 'more';

          return (
            <motion.button
              key={service.id}
              onClick={() => !service.isLoading && onServiceSelect(service.id)}
              className={cn(
                "relative flex flex-col items-center gap-2.5 group",
                service.isLoading && "pointer-events-none opacity-60"
              )}
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                delay: index * 0.06,
                type: "spring",
                stiffness: 300,
                damping: 22
              }}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.92 }}
            >
              {/* Icon container - design moderne avec inner glow */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-[72px] h-[72px] rounded-[24px] transition-all duration-300 ease-out will-change-transform service-icon-float",
                  "ring-1 ring-white/10",
                  service.isLoading && "animate-pulse",
                  isMoreService && "group-hover:rotate-45"
                )}
                style={{
                  background: serviceColors[service.id] || serviceColors.transport,
                  boxShadow: `
                    0 8px 20px -4px ${serviceColors[service.id]}50,
                    inset 0 1px 4px rgba(255,255,255,0.25),
                    inset 0 -2px 6px rgba(0,0,0,0.15)
                  `
                }}
              >
                <Icon 
                  className={cn(
                    "w-10 h-10 text-white transition-all duration-300 ease-out",
                    "group-hover:scale-115",
                    isMoreService && "group-hover:-rotate-45"
                  )}
                  strokeWidth={2}
                  style={{
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))'
                  }}
                />
                
                {/* Subtle inner shine */}
                <div className="absolute inset-0 rounded-[24px] bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                
                {/* Notification badge */}
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 bg-destructive text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg border-2 border-background animate-bounce-subtle">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </div>
                )}
              </div>
              
              {/* Service name - typographie raffinée */}
              <span className="text-[13px] font-bold text-center leading-tight text-foreground/90 tracking-tight transition-all duration-300 group-hover:text-primary group-hover:translate-y-0.5">
                {service.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});

ServiceGrid.displayName = 'ServiceGrid';