import React, { useEffect } from 'react';
import { UnifiedVendorHeader } from './UnifiedVendorHeader';
import { VendorBottomNav } from './modern/VendorBottomNav';
import { VendorDesktopSidebar } from './modern/VendorDesktopSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import '@/styles/vendor-modern.css';

interface VendorStats {
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  escrowBalance: number;
  pendingEscrow: number;
}

interface ResponsiveVendorLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: VendorStats;
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  unreadChatCount?: number;
}

export const ResponsiveVendorLayout: React.FC<ResponsiveVendorLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  stats,
  onOpenChat,
  onOpenNotifications,
  unreadChatCount,
}) => {
  const isMobile = useIsMobile();

  // Swipe gestures pour navigation mobile
  const tabs = ['dashboard', 'shop', 'orders', 'profile', 'subscription'];
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isMobile) return;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        onTabChange(tabs[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      if (!isMobile) return;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        onTabChange(tabs[currentIndex - 1]);
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: false,
  });

  return (
    <div className="vendor-layout-container vendor-gradient-bg">
      {/* Header fixe avec glassmorphism */}
      <header className="flex-shrink-0 sticky top-0 z-40">
        <div className="vendor-card-glass border-b border-border/20">
          <UnifiedVendorHeader 
            onOpenChat={onOpenChat}
            onOpenNotifications={onOpenNotifications}
            unreadChatCount={unreadChatCount}
          />
        </div>
      </header>

      {/* Container principal avec sidebar et contenu */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar Desktop uniquement */}
        {!isMobile && (
          <div className="vendor-card-glass border-r border-border/20">
            <VendorDesktopSidebar 
              activeTab={activeTab}
              onTabChange={onTabChange}
              stats={stats}
            />
          </div>
        )}

        {/* Zone de contenu scrollable avec swipe support */}
        <main 
          {...(isMobile ? handlers : {})}
          className={cn(
            isMobile ? 'content-with-bottom-nav' : 'content-scrollable',
            'vendor-scrollbar'
          )}
        >
          <div className="container max-w-6xl mx-auto p-4 space-y-4">
            {children}
          </div>
        </main>
      </div>

      {/* Footer Mobile uniquement - Ne scroll jamais */}
      {isMobile && (
        <footer className="bottom-nav-standard">
            <VendorBottomNav 
              activeTab={activeTab}
              onTabChange={onTabChange}
              stats={stats}
            />
        </footer>
      )}
    </div>
  );
};
