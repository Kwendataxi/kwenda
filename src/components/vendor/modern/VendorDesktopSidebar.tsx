import React from 'react';
import { LayoutDashboard, Store, ShoppingBag, User, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

interface VendorStats {
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  escrowBalance: number;
  pendingEscrow: number;
}

interface VendorDesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: VendorStats;
}

export const VendorDesktopSidebar: React.FC<VendorDesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  stats
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { id: 'shop', icon: Store, label: 'Mes produits', badge: stats.pendingProducts },
    { id: 'orders', icon: ShoppingBag, label: 'Commandes', badge: stats.pendingOrders },
    { id: 'subscription', icon: CreditCard, label: 'Abonnement' },
    { id: 'profile', icon: User, label: 'Profil & Paramètres' },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r bg-card/50 backdrop-blur-sm overflow-y-auto">
      <nav className="space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium flex-1 text-left">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge 
                  variant={isActive ? "secondary" : "destructive"}
                  className="ml-auto"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
};
