import React from 'react';
import { LucideIcon, Package, Plus, ShoppingCart, Shield, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  icon: LucideIcon;
  label: string;
  badge?: number;
  onClick?: () => void;
}

interface FloatingBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  ordersBadge?: number;
}

export const FloatingBottomNav: React.FC<FloatingBottomNavProps> = ({
  activeTab,
  onTabChange,
  ordersBadge = 0
}) => {
  const isMobile = useIsMobile();

  const navItems: NavItem[] = [
    { icon: Package, label: 'orders', badge: ordersBadge },
    { icon: Plus, label: 'add' },
    { icon: ShoppingCart, label: 'cart' },
    { icon: Shield, label: 'security' },
    { icon: Store, label: 'shop' },
  ];

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.label;
            
            return (
              <button
                key={item.label}
                onClick={() => onTabChange(item.label)}
                className="relative flex flex-col items-center gap-1 p-2 min-w-14"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <Icon className="h-6 w-6" />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop horizontal nav
  return (
    <div className="border-b bg-background">
      <div className="flex items-center gap-2 px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.label;
          
          return (
            <motion.button
              key={item.label}
              onClick={() => onTabChange(item.label)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium capitalize">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {item.badge}
                </Badge>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
