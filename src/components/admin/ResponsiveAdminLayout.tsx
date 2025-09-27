import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAdminHeader } from './MobileAdminHeader';
import { MobileKPIGrid } from './MobileKPIGrid';
import { AdminVerticalNav } from './AdminVerticalNav';
import { AdminPermissionSettings, AdminPermissionProvider, useAdminPermissions } from './AdminPermissionContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';

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
            className="p-0 w-[90vw] max-w-sm sm:max-w-md flex flex-col h-full"
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border/60 bg-card/50">
                <h2 className="text-lg font-semibold mb-3">Navigation Admin</h2>
                <AdminPermissionSettings />
              </div>
              
              <div className="flex-1 overflow-hidden">
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
        <main className="p-4">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileAdminHeader />
      <div className="container py-4">
        <div className="flex gap-6">
          <aside className="w-64 shrink-0">
            <AdminPermissionSettings />
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