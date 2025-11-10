import React from 'react';
import { LayoutDashboard, Store, ShoppingBag, User, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  badgeVariant?: 'default' | 'destructive' | 'warning';
}

interface VendorStats {
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  escrowBalance: number;
  pendingEscrow: number;
}

interface VendorBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: VendorStats;
}

export const VendorBottomNav: React.FC<VendorBottomNavProps> = ({
  activeTab,
  onTabChange,
  stats
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { 
      id: 'shop', 
      icon: Store, 
      label: 'Produits', 
      badge: stats.pendingProducts,
      badgeVariant: 'warning'
    },
    { 
      id: 'orders', 
      icon: ShoppingBag, 
      label: 'Commandes', 
      badge: stats.pendingOrders,
      badgeVariant: 'destructive'
    },
    { id: 'subscription', icon: CreditCard, label: 'Abo' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="bottom-nav-standard">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center gap-1 p-2 min-w-14 rounded-lg transition-all ${
                isActive ? 'bg-primary/10' : 'hover:bg-accent'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative inline-flex items-center justify-center">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.05 }}
                  className={`transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -top-1 -right-1 z-10"
                  >
                    <Badge 
                      variant={item.badgeVariant === 'warning' ? 'default' : 'destructive'}
                      className={`h-4 w-4 min-w-[16px] p-0 text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-background shadow-sm ${
                        item.badgeVariant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent' : ''
                      } animate-pulse-slow`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  </motion.div>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
