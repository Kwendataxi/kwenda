import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAdminHeader } from './MobileAdminHeader';
import { MobileKPIGrid } from './MobileKPIGrid';
import { AdminVerticalNav } from './AdminVerticalNav';
import { AdminPermissionSettings, AdminPermissionProvider, useAdminPermissions } from './AdminPermissionContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { BackToTopButton } from '@/components/navigation/BackToTopButton';
import { cn } from '@/lib/utils';

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode;
  realTimeStats: any;
  activeTab: string;
  onTabChange: (value: string) => void;
}

const ResponsiveAdminLayoutInner: React.FC<ResponsiveAdminLayoutProps> = ({
  children,
  realTimeStats,
  activeTab,
  onTabChange
}) => {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { devMode, showAllSections } = useAdminPermissions();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileAdminHeader onMenuToggle={() => setMobileMenuOpen(true)} />
        
        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent 
            side="left" 
            className={cn(
              "p-0 flex flex-col h-full",
              "w-[85vw] max-w-sm sm:max-w-md md:max-w-lg",
              "backdrop-blur-sm"
            )}
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              {process.env.NODE_ENV === 'development' && (
                <div className="p-4 border-b border-border/60 bg-card/50">
                  <h2 className="text-lg font-semibold mb-3">Navigation Admin</h2>
                  <AdminPermissionSettings />
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto smooth-scroll admin-scrollbar">
                <AdminVerticalNav 
                  activeTab={activeTab} 
                  onTabChange={(value) => {
                    onTabChange(value);
                    setMobileMenuOpen(false);
                  }}
                  devMode={devMode}
                  isMobile={true}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* KPI Grid - only on overview */}
        {activeTab === 'overview' && <MobileKPIGrid realTimeStats={realTimeStats} />}
        
        {/* Content */}
        <main className="p-2 sm:p-4">
          {children}
        </main>
        
        {/* Back to Top - Mobile */}
        <BackToTopButton 
          showAfter={400} 
          className="bottom-20 right-4 z-50"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileAdminHeader />
      <div className="container py-4">
        <div className="flex gap-6">
          <aside className={cn(
            "shrink-0 sticky top-4 self-start",
            "w-56 lg:w-64 xl:w-72",
            "max-h-[calc(100vh-3rem)]",
            "overflow-hidden rounded-lg border border-border/40 bg-card/50",
            "shadow-sm transition-all duration-300"
          )}>
            {process.env.NODE_ENV === 'development' && <AdminPermissionSettings />}
            <AdminVerticalNav activeTab={activeTab} onTabChange={onTabChange} devMode={devMode} />
          </aside>
          <section className="flex-1">
            {/* KPI Grid - only on overview */}
            {activeTab === 'overview' && <MobileKPIGrid realTimeStats={realTimeStats} />}
            <main className="py-6">
              {children}
            </main>
          </section>
        </div>
      </div>
      
      {/* Back to Top - Desktop */}
      <BackToTopButton 
        showAfter={400} 
        className="bottom-6 right-6 z-50"
      />
    </div>
  );
};

export const ResponsiveAdminLayout: React.FC<ResponsiveAdminLayoutProps> = (props) => {
  return (
    <AdminPermissionProvider>
      <ResponsiveAdminLayoutInner {...props} />
    </AdminPermissionProvider>
  );
};