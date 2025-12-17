import { LayoutDashboard, ShoppingBag, ChefHat, Wallet, User, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type RestaurantTab = 'dashboard' | 'orders' | 'menu' | 'analytics' | 'wallet' | 'profile' | 'subscription';

interface RestaurantMobileTabsProps {
  currentTab: RestaurantTab;
  onTabChange: (tab: RestaurantTab) => void;
}

export function RestaurantMobileTabs({ currentTab, onTabChange }: RestaurantMobileTabsProps) {
  // 5 tabs principaux pour mobile (menu + profil regroupés)
  const tabs = [
    { id: 'dashboard' as RestaurantTab, label: 'Accueil', icon: LayoutDashboard },
    { id: 'orders' as RestaurantTab, label: 'Commandes', icon: ShoppingBag },
    { id: 'menu' as RestaurantTab, label: 'Menu', icon: ChefHat },
    { id: 'wallet' as RestaurantTab, label: 'Wallet', icon: Wallet },
    { id: 'subscription' as RestaurantTab, label: 'Abo', icon: CreditCard },
    { id: 'profile' as RestaurantTab, label: 'Profil', icon: User },
  ] as const;

  return (
    <div className="bottom-nav-standard md:hidden border-t bg-card/95 backdrop-blur-md">
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
                'flex flex-col items-center justify-center gap-0.5 transition-all relative',
                isActive 
                  ? 'text-orange-600 dark:text-orange-500' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <motion.span
                className="text-[10px] font-medium"
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {tab.label}
              </motion.span>
              
              {isActive && (
                <motion.div
                  layoutId="mobile-bubble"
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
