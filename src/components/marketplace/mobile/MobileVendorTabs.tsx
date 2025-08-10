import React from 'react';
import { Package, CheckCircle, DollarSign, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TouchOptimizedInterface } from '@/components/mobile/TouchOptimizedInterface';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

interface MobileVendorTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  confirmationCount?: number;
  notificationCount?: number;
  variant?: 'bottom' | 'horizontal';
  showLabels?: boolean;
}

export const MobileVendorTabs: React.FC<MobileVendorTabsProps> = ({
  currentTab,
  onTabChange,
  confirmationCount = 0,
  notificationCount = 0,
  variant = 'horizontal',
  showLabels = false
}) => {
  const tabs: TabItem[] = [
    {
      id: 'products',
      label: 'Produits',
      icon: Package
    },
    {
      id: 'confirmations',
      label: 'Confirmations',
      icon: CheckCircle,
      badge: confirmationCount
    },
    {
      id: 'revenue',
      label: 'Revenus',
      icon: DollarSign
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: notificationCount
    }
  ];

  if (variant === 'bottom') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="grid grid-cols-4 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <TouchOptimizedInterface key={tab.id}>
                <Button
                  variant="ghost"
                  className={`h-full flex-col gap-1 rounded-none relative ${
                    isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                  }`}
                  onClick={() => onTabChange(tab.id)}
                 >
                   <Icon className="w-5 h-5" />
                   {showLabels && <span className="text-xs">{tab.label}</span>}
                   {tab.badge && tab.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Badge>
                  )}
                </Button>
              </TouchOptimizedInterface>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 p-4 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <TouchOptimizedInterface key={tab.id}>
               <Button
                 variant={isActive ? 'default' : 'outline'}
                 size={showLabels ? "sm" : "icon"}
                 className={`relative ${showLabels ? 'whitespace-nowrap min-h-11' : 'h-11 w-11'}`}
                 onClick={() => onTabChange(tab.id)}
               >
                 <Icon className={`w-4 h-4 ${showLabels ? 'mr-2' : ''}`} />
                 {showLabels && tab.label}
                {tab.badge && tab.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Badge>
                )}
              </Button>
            </TouchOptimizedInterface>
          );
        })}
      </div>
    </ScrollArea>
  );
};