import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Car, Package, MoreHorizontal, Search, ShoppingBag, 
  Plus, Activity, Heart, BarChart3, Users, Settings,
  Home, MapPin, Wallet, Star, Bell, Menu, CreditCard, Trophy, User
} from 'lucide-react';

export type UniversalTabType = 
  // Client tabs
  | 'home' | 'services' | 'orders' | 'wallet' | 'profile'
  // Driver tabs  
  | 'orders' | 'earnings' | 'challenges' | 'subscription' | 'profile'
  // Partner tabs
  | 'dashboard' | 'fleet' | 'drivers' | 'analytics' | 'settings'
  // Admin tabs
  | 'overview' | 'users' | 'operations' | 'reports' | 'admin-settings'
  // Marketplace tabs
  | 'explore' | 'sell' | 'activity' | 'favorites' | 'cart';

export type UserType = 'client' | 'driver' | 'partner' | 'admin' | 'marketplace';

interface UniversalBottomNavigationProps {
  userType: UserType;
  activeTab: UniversalTabType;
  onTabChange: (tab: UniversalTabType) => void;
  onMoreAction?: () => void;
  badges?: Partial<Record<UniversalTabType, number>>;
  className?: string;
  variant?: 'default' | 'enhanced';
  showLabels?: boolean;
}

const navigationConfigs = {
  client: [
    { id: 'home' as const, label: 'Accueil', icon: Home },
    { id: 'services' as const, label: 'Services', icon: MapPin },
    { id: 'orders' as const, label: 'Commandes', icon: Package },
    { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
    { id: 'profile' as const, label: 'Profil', icon: Settings }
  ],
  driver: [
    { id: 'orders' as const, label: 'Courses', icon: Car },
    { id: 'earnings' as const, label: 'Gains', icon: Wallet },
    { id: 'challenges' as const, label: 'Défis', icon: Trophy },
    { id: 'subscription' as const, label: 'Abonnement', icon: CreditCard },
    { id: 'profile' as const, label: 'Profil', icon: User }
  ],
  partner: [
    { id: 'dashboard' as const, label: 'Tableau', icon: BarChart3 },
    { id: 'fleet' as const, label: 'Flotte', icon: Car },
    { id: 'drivers' as const, label: 'Chauffeurs', icon: Users },
    { id: 'analytics' as const, label: 'Analytics', icon: Activity },
    { id: 'settings' as const, label: 'Paramètres', icon: Settings }
  ],
  admin: [
    { id: 'overview' as const, label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'users' as const, label: 'Utilisateurs', icon: Users },
    { id: 'operations' as const, label: 'Opérations', icon: Activity },
    { id: 'reports' as const, label: 'Rapports', icon: Package },
    { id: 'admin-settings' as const, label: 'Paramètres', icon: Settings }
  ],
  marketplace: [
    { id: 'explore' as const, label: 'Explorer', icon: Search },
    { id: 'sell' as const, label: 'Vendre', icon: Plus },
    { id: 'activity' as const, label: 'Activité', icon: Activity },
    { id: 'favorites' as const, label: 'Favoris', icon: Heart },
    { id: 'cart' as const, label: 'Panier', icon: ShoppingBag }
  ]
};

export const UniversalBottomNavigation: React.FC<UniversalBottomNavigationProps> = ({
  userType,
  activeTab,
  onTabChange,
  onMoreAction,
  badges = {},
  className,
  variant = 'default',
  showLabels = true
}) => {
  const config = navigationConfigs[userType];
  
  const handleTabPress = (tab: UniversalTabType, isMore?: boolean) => {
    if (isMore && onMoreAction) {
      onMoreAction();
      return;
    }
    onTabChange(tab);
  };

  const getItemClasses = (isActive: boolean) => {
    if (variant === 'enhanced') {
      return cn(
        'relative flex-1 flex flex-col items-center justify-center gap-2',
        'py-3 px-2 transition-all duration-300',
        'rounded-2xl cursor-pointer min-touch-target touch-manipulation',
        isActive && 'bg-primary/10',
        !isActive && 'hover:bg-accent/30'
      );
    }
    
    return cn(
      'flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all duration-200',
      'min-touch-target touch-manipulation',
      isActive 
        ? 'text-primary bg-primary/10 scale-105' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    );
  };

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-[100]',
      variant === 'enhanced' && 'pb-6',
      className
    )}>
      <div className={cn(
        'mx-auto max-w-screen-sm px-4 pb-[env(safe-area-inset-bottom)]',
        variant === 'enhanced' && 'px-6'
      )}>
        <motion.div 
          className={cn(
            'grid transition-all duration-300',
            variant === 'default' && 'bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg',
            variant === 'enhanced' && 'bg-background/98 backdrop-blur-2xl border-2 border-primary/20 rounded-3xl shadow-2xl p-1'
          )}
          style={{ gridTemplateColumns: `repeat(${config.length}, minmax(0, 1fr))` }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: 'spring', 
            stiffness: variant === 'enhanced' ? 260 : 300, 
            damping: variant === 'enhanced' ? 20 : 25 
          }}
        >
          {config.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badge = badges[item.id];
            
            return (
              <motion.button
                key={item.id}
                className={getItemClasses(isActive)}
                onClick={() => handleTabPress(item.id, item.isMore)}
                aria-label={item.label}
                initial={variant === 'enhanced' ? { opacity: 0, y: 20 } : undefined}
                animate={variant === 'enhanced' ? { opacity: 1, y: 0 } : undefined}
                transition={variant === 'enhanced' ? { delay: index * 0.1 } : undefined}
                whileTap={{ scale: 0.9 }}
                whileHover={variant === 'enhanced' ? { scale: 1.1, rotate: 3 } : { scale: 1.02 }}
              >
                {/* Indicateur actif en haut (enhanced only) */}
                {variant === 'enhanced' && isActive && (
                  <motion.div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full"
                    layoutId={`activeIndicator-${userType}`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <div className="relative">
                  <Icon className={cn(
                    'transition-colors duration-200',
                    variant === 'default' && 'h-5 w-5',
                    variant === 'enhanced' && 'h-6 w-6',
                    isActive && 'text-primary',
                    !isActive && 'text-muted-foreground'
                  )} />
                  
                  {/* Effet de brillance pour icône active (enhanced only) */}
                  {variant === 'enhanced' && isActive && (
                    <motion.div 
                      className="absolute inset-0 bg-primary/20 rounded-full blur-lg -z-10"
                      animate={{ 
                        scale: [1, 1.2, 1], 
                        opacity: [0.5, 0.8, 0.5] 
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  
                  {badge && badge > 0 && (
                    <motion.div
                      className="absolute -top-2 -right-2"
                      animate={variant === 'enhanced' ? { scale: [1, 1.2, 1] } : undefined}
                      transition={variant === 'enhanced' ? { duration: 2, repeat: Infinity } : undefined}
                    >
                      <Badge 
                        variant="destructive" 
                        className="h-4 w-4 p-0 text-xs flex items-center justify-center min-w-4 bg-primary text-primary-foreground border-0"
                      >
                        {badge > 99 ? '99+' : badge}
                      </Badge>
                    </motion.div>
                  )}
                </div>

                {showLabels && (
                  <span className={cn(
                    'font-medium transition-colors',
                    variant === 'default' && 'text-xs hidden xs:block',
                    variant === 'enhanced' && 'text-xs font-semibold',
                    isActive && 'text-primary',
                    !isActive && 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </nav>
  );
};

export { UniversalBottomNavigation as default };