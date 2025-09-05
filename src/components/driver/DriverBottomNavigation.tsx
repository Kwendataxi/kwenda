import React from 'react';
import { cn } from '@/lib/utils';
import { Car, Package, MoreHorizontal } from 'lucide-react';

export type DriverMainTab = 'rides' | 'deliveries';

interface DriverBottomNavigationProps {
  activeTab: DriverMainTab;
  onTabChange: (tab: DriverMainTab) => void;
  onOpenMore: () => void;
}

export const DriverBottomNavigation: React.FC<DriverBottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onOpenMore,
}) => {
  const itemCls = (isActive: boolean) =>
    cn(
      'flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors',
      isActive ? 'text-primary bg-muted' : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100]">
      <div className="mx-auto max-w-screen-sm px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-lg grid grid-cols-3 transition-all duration-300">
          <button className={itemCls(activeTab === 'rides')} onClick={() => onTabChange('rides')} aria-label="Courses">
            <Car className="h-5 w-5" />
            <span className="text-xs">Courses</span>
          </button>
          <button className={itemCls(activeTab === 'deliveries')} onClick={() => onTabChange('deliveries')} aria-label="Livraisons">
            <Package className="h-5 w-5" />
            <span className="text-xs">Livraisons</span>
          </button>
          <button className={itemCls(false)} onClick={onOpenMore} aria-label="Plus">
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs">Plus</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default DriverBottomNavigation;
