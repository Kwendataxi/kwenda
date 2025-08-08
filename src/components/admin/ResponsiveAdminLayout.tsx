import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAdminHeader } from './MobileAdminHeader';
import { MobileKPIGrid } from './MobileKPIGrid';
import { AdminVerticalNav } from './AdminVerticalNav';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode;
  realTimeStats: any;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const ResponsiveAdminLayout: React.FC<ResponsiveAdminLayoutProps> = ({
  children,
  realTimeStats,
  activeTab,
  onTabChange
}) => {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobileAdminHeader onMenuToggle={() => setMobileMenuOpen(true)} />
        
        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-80">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Navigation</h2>
              <AdminVerticalNav activeTab={activeTab} onTabChange={(value) => {
                onTabChange(value);
                setMobileMenuOpen(false);
              }} />
            </div>
          </SheetContent>
        </Sheet>

        {/* KPI Grid */}
        <MobileKPIGrid realTimeStats={realTimeStats} />
        
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
            <AdminVerticalNav activeTab={activeTab} onTabChange={onTabChange} />
          </aside>
          <section className="flex-1">
            <MobileKPIGrid realTimeStats={realTimeStats} />
            <main className="py-6">
              {children}
            </main>
          </section>
        </div>
      </div>
    </div>
  );
};