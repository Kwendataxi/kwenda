import { LayoutDashboard, ShoppingBag, ChefHat, BarChart3, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RestaurantMobileTabsProps {
  currentTab: 'dashboard' | 'orders' | 'menu' | 'analytics' | 'wallet' | 'profile';
  onTabChange: (tab: 'dashboard' | 'orders' | 'menu' | 'analytics' | 'wallet' | 'profile') => void;
}

export function RestaurantMobileTabs({ currentTab, onTabChange }: RestaurantMobileTabsProps) {
  const tabs = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'orders', label: 'Commandes', icon: ShoppingBag },
    { id: 'menu', label: 'Menu', icon: ChefHat },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profil', icon: User },
  ] as const;

  return (
    <div className="bottom-nav-standard md:hidden">
      <div className="grid grid-cols-6 h-16 relative">
        {/* Active indicator */}
        <motion.div
          className="absolute bottom-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-full"
          initial={false}
          animate={{
            x: `${tabs.findIndex(tab => tab.id === currentTab) * 100}%`,
            width: `${100 / tabs.length}%`,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-all relative',
                isActive 
                  ? 'text-orange-600 dark:text-orange-500' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <motion.span
                className="text-xs font-medium"
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab.label}
              </motion.span>
              
              {isActive && (
                <motion.div
                  layoutId="bubble"
                  className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent rounded-t-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
