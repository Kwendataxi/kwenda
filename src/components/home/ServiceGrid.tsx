import { useMemo, memo } from 'react';
import { Car, Truck, ShoppingBag, Utensils, MoreHorizontal } from 'lucide-react';
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
      more: MoreHorizontal
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
      <div className="grid grid-cols-3 gap-x-6 gap-y-8" style={{ willChange: 'transform' }}>
        {mainServices.map((service, index) => {
          const Icon = service.icon;
          const notificationCount = serviceNotifications?.[service.id as keyof typeof serviceNotifications] || 0;

          return (
            <motion.button
              key={service.id}
              onClick={() => !service.isLoading && onServiceSelect(service.id)}
              className={cn(
                "relative flex flex-col items-center gap-3 group",
                service.isLoading && "pointer-events-none opacity-60"
              )}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                delay: index * 0.08,
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Icon container - design doux amélioré */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-24 h-24 rounded-[32px] shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.12)] group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.12),0_12px_32px_rgba(0,0,0,0.16)] transition-all duration-400 ease-out will-change-transform",
                  service.isLoading && "animate-pulse"
                )}
                style={{
                  background: serviceColors[service.id] || serviceColors.transport,
                  boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.15)'
                }}
              >
                <Icon 
                  className="w-14 h-14 text-white transition-all duration-400 ease-out group-hover:rotate-6 group-hover:scale-110" 
                  strokeWidth={1.8}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}
                />
                
                {/* Notification badge */}
                {notificationCount > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 bg-congo-red text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-background animate-bounce-subtle">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </div>
                )}
              </div>
              
              {/* Service name - typographie améliorée */}
              <span className="text-[15px] font-extrabold text-center leading-tight text-foreground tracking-[-0.01em] transition-all duration-300 group-hover:text-primary group-hover:scale-105">
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