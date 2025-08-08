import React from 'react';
import { Home, Car, Users, BarChart3, Settings, Wallet, DollarSign, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobilePartnerTabsProps {
  currentView: 'dashboard' | 'vehicles' | 'drivers' | 'rentals' | 'analytics' | 'finances' | 'commissions' | 'withdrawals';
  onViewChange: (view: string) => void;
  variant?: 'bottom' | 'horizontal' | 'vertical';
}

const tabItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'vehicles', label: 'Véhicules', icon: Car },
  { id: 'drivers', label: 'Chauffeurs', icon: Users },
  { id: 'finances', label: 'Finances', icon: Wallet },
  { id: 'commissions', label: 'Commissions', icon: DollarSign },
  { id: 'withdrawals', label: 'Retraits', icon: ArrowUpRight },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const MobilePartnerTabs: React.FC<MobilePartnerTabsProps> = ({
  currentView,
  onViewChange,
  variant = 'bottom'
}) => {
  if (variant === 'bottom') {
    // Bottom navigation for mobile
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-grey-100 px-2 py-2 flex justify-around z-40">
        {tabItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
              currentView === item.id 
                ? 'text-primary bg-primary-light' 
                : 'text-muted-foreground hover:text-primary hover:bg-grey-50'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium truncate max-w-full">{item.label}</span>
          </button>
        ))}
      </div>
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
            currentView === item.id && "bg-primary text-white"
          )}
        >
          <item.icon className="h-4 w-4 mr-3" />
          {item.label}
        </Button>
      ))}
    </div>
  );
};