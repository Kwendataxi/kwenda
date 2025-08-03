import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileAdminHeader } from './MobileAdminHeader';
import { MobileKPIGrid } from './MobileKPIGrid';
import { MobileAdminTabs } from './MobileAdminTabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

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
              <MobileAdminTabs activeTab={activeTab} onTabChange={(value) => {
                onTabChange(value);
                setMobileMenuOpen(false);
              }} />
            </div>
          </SheetContent>
        </Sheet>

        {/* KPI Grid */}
        <MobileKPIGrid realTimeStats={realTimeStats} />
        
        {/* Mobile Tabs */}
        <MobileAdminTabs activeTab={activeTab} onTabChange={onTabChange} />
        
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
      
      {/* Desktop KPI Grid */}
      <MobileKPIGrid realTimeStats={realTimeStats} />
      
      {/* Desktop Tabs */}
      <div className="border-b">
        <div className="container">
          <MobileAdminTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </div>
      
      {/* Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
};