import { LayoutDashboard, ShoppingBag, ChefHat, BarChart3, CreditCard, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestaurantMobileTabsProps {
  currentTab: 'dashboard' | 'orders' | 'menu' | 'analytics' | 'pos' | 'profile';
  onTabChange: (tab: 'dashboard' | 'orders' | 'menu' | 'analytics' | 'pos' | 'profile') => void;
}

export function RestaurantMobileTabs({ currentTab, onTabChange }: RestaurantMobileTabsProps) {
  const tabs = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'orders', label: 'Commandes', icon: ShoppingBag },
    { id: 'menu', label: 'Menu', icon: ChefHat },
    { id: 'analytics', label: 'Stats', icon: BarChart3 },
    { id: 'pos', label: 'Caisse', icon: CreditCard },
    { id: 'profile', label: 'Profil', icon: User },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="grid grid-cols-6 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive 
                  ? 'text-orange-600 dark:text-orange-500' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
