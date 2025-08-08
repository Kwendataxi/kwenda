import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePartnerHeader } from './MobilePartnerHeader';
import { MobilePartnerTabs } from './MobilePartnerTabs';
import { PartnerKPIGrid } from './PartnerKPIGrid';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import PartnerHeader from './PartnerHeader';

interface ResponsivePartnerLayoutProps {
  children: React.ReactNode;
  stats: any;
  currentView: string;
  onViewChange: (view: string) => void;
  title?: string;
  subtitle?: string;
}

export const ResponsivePartnerLayout: React.FC<ResponsivePartnerLayoutProps> = ({
  children,
  stats,
  currentView,
  onViewChange,
  title = "Tableau de bord",
  subtitle = "Kwenda Taxi Partner"
}) => {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MobilePartnerHeader 
          title={title}
          subtitle={subtitle}
          onMenuToggle={() => setMobileMenuOpen(true)} 
        />
        
        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-80">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Navigation</h2>
              <MobilePartnerTabs 
                currentView={currentView} 
                onViewChange={(view) => {
                  onViewChange(view);
                  setMobileMenuOpen(false);
                }} 
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* KPI Grid for mobile */}
        {currentView === 'dashboard' && (
          <PartnerKPIGrid stats={stats} />
        )}
        
        {/* Content */}
        <main className="px-4 pb-20">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobilePartnerTabs 
          currentView={currentView} 
          onViewChange={onViewChange}
          variant="bottom"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PartnerHeader title={title} subtitle={subtitle} />
      
      {/* Desktop KPI Grid */}
      {currentView === 'dashboard' && (
        <div className="container">
          <PartnerKPIGrid stats={stats} />
        </div>
      )}
      
      {/* Desktop Tabs */}
      <div className="border-b">
        <div className="container">
          <MobilePartnerTabs 
            currentView={currentView} 
            onViewChange={onViewChange}
            variant="horizontal"
          />
        </div>
      </div>
      
      {/* Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
};