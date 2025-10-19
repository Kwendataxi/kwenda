import React from 'react';
import { Store, ShoppingBag, User, Shield, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { MarketplaceRoleSwitcher } from '@/components/marketplace/MarketplaceRoleSwitcher';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

interface VendorDesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  ordersBadge?: number;
}

export const VendorDesktopSidebar: React.FC<VendorDesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  ordersBadge = 0
}) => {
  const navItems: NavItem[] = [
    { id: 'shop', icon: Store, label: 'Boutique' },
    { id: 'orders', icon: ShoppingBag, label: 'Commandes', badge: ordersBadge },
    { id: 'profile', icon: User, label: 'Profil' },
    { id: 'verification', icon: Shield, label: 'Vérification' },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <aside className="hidden md:block w-64 border-r bg-card/50 backdrop-blur-sm">
      <nav className="sticky top-[76px] space-y-2 p-4">
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

        {/* Footer avec retour marketplace */}
        <div className="pt-4 mt-4 border-t">
          <MarketplaceRoleSwitcher currentMode="vendor" />
        </div>
      </nav>
    </aside>
  );
};
