import React from 'react';
import { Home, Car, Users, DollarSign, BarChart3, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MobilePartnerTabsProps {
  currentView: 'dashboard' | 'vehicles' | 'drivers' | 'deliveries' | 'subscription-earnings' | 'subscriptions' | 'analytics' | 'notifications' | 'profile';
  onViewChange: (view: string) => void;
  variant?: 'bottom' | 'horizontal' | 'vertical';
}

const tabItems = [
  { id: 'dashboard', label: 'Accueil', icon: Home },
  { id: 'vehicles', label: 'Véhicules', icon: Car },
  { id: 'drivers', label: 'Chauffeurs', icon: Users },
  { id: 'subscription-earnings', label: 'Gains', icon: DollarSign },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Profil', icon: User },
];

export const MobilePartnerTabs: React.FC<MobilePartnerTabsProps> = ({
  currentView,
  onViewChange,
  variant = 'bottom'
}) => {
  if (variant === 'bottom') {
    return (
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bottom-nav-standard lg:hidden"
      >
        {/* Ligne de gradient en haut */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        
        <div className="flex items-center justify-around px-2 h-full pb-safe">
          {tabItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-0 flex-1 relative",
                currentView === item.id 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              {currentView === item.id && (
                <motion.div
                  layoutId="partner-tab-highlight"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className="h-5 w-5 shrink-0 relative z-10" />
              <span className="text-[10px] font-medium truncate max-w-full relative z-10">
                {item.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.nav>
    );
  }

  if (variant === 'horizontal') {
    // Horizontal tabs for desktop
    return (
      <div className="flex overflow-x-auto scrollbar-hide border-b">
        {tabItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex-shrink-0 rounded-none border-b-2 border-transparent px-6 py-3",
              currentView === item.id && "border-primary text-primary"
            )}
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.label}
          </Button>
        ))}
      </div>
    );
  }

  // Vertical tabs for sidebar
  return (
    <div className="space-y-2">
      {tabItems.map((item) => (
        <Button
          key={item.id}
          variant="ghost"
          onClick={() => onViewChange(item.id)}
          className={cn(
            "w-full justify-start rounded-xl",
            currentView === item.id && "bg-primary text-primary-foreground"
          )}
        >
          <item.icon className="h-4 w-4 mr-3" />
          {item.label}
        </Button>
      ))}
    </div>
  );
};