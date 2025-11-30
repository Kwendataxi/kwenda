import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminMobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

export const AdminMobileNav: React.FC<AdminMobileNavProps> = ({
  activeTab,
  onTabChange
}) => {
  const navItems: NavItem[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Accueil' },
    { id: 'users', icon: Users, label: 'Utilisateurs' },
    { id: 'operations', icon: TrendingUp, label: 'Opérations' },
    { id: 'reports', icon: FileText, label: 'Rapports' },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <nav className="flex items-center justify-around px-2 py-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'relative flex flex-col items-center gap-1 p-2 min-w-14 rounded-lg transition-all',
              isActive ? 'bg-primary/10' : 'hover:bg-accent'
            )}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <motion.div
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              className={cn(
                'transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            
            <span className={cn(
              'text-[10px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
            
            {isActive && (
              <motion.div
                layoutId="adminActiveIndicator"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-8 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
