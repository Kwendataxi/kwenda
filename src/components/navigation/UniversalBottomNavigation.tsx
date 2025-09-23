import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Car, Package, MoreHorizontal, Search, ShoppingBag, 
  Plus, Activity, Heart, BarChart3, Users, Settings,
  Home, MapPin, Wallet, Star, Bell, Menu
} from 'lucide-react';

export type UniversalTabType = 
  // Client tabs
  | 'home' | 'services' | 'orders' | 'wallet' | 'profile'
  // Driver tabs  
  | 'rides' | 'deliveries' | 'earnings' | 'challenges' | 'more'
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
    { id: 'rides' as const, label: 'Courses', icon: Car },
    { id: 'deliveries' as const, label: 'Livraisons', icon: Package },
    { id: 'earnings' as const, label: 'Gains', icon: BarChart3 },
    { id: 'challenges' as const, label: 'Défis', icon: Star },
    { id: 'more' as const, label: 'Plus', icon: MoreHorizontal, isMore: true }
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
  className
}) => {
  const config = navigationConfigs[userType];
  
  const handleTabPress = (tab: UniversalTabType, isMore?: boolean) => {
    if (isMore && onMoreAction) {
      onMoreAction();
      return;
    }
    onTabChange(tab);
  };

  const getItemClasses = (isActive: boolean) =>
    cn(
      'flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all duration-200',
      'min-touch-target touch-manipulation',
      isActive 
        ? 'text-primary bg-primary/10 scale-105' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
    );

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-[100]',
      className
    )}>
      <div className="mx-auto max-w-screen-sm px-4 pb-[env(safe-area-inset-bottom)]">
        <motion.div 
          className="bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg grid transition-all duration-300"
          style={{ gridTemplateColumns: `repeat(${config.length}, minmax(0, 1fr))` }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {config.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badge = badges[item.id];
            
            return (
              <motion.button
                key={item.id}
                className={getItemClasses(isActive)}
                onClick={() => handleTabPress(item.id, item.isMore)}
                aria-label={item.label}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {badge && badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center min-w-4 bg-primary text-primary-foreground border-0"
                    >
                      {badge > 99 ? '99+' : badge}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  'text-xs font-medium transition-colors',
                  // Responsive text - hide on very small screens
                  'hidden xs:block',
                  isActive ? 'text-primary' : ''
                )}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </nav>
  );
};

export { UniversalBottomNavigation as default };