import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePartnerHeader } from './MobilePartnerHeader';
import { MobilePartnerTabs } from './MobilePartnerTabs';
import { PartnerKPIGrid } from './PartnerKPIGrid';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import PartnerHeader from './PartnerHeader';
import type { PartnerStats } from '@/hooks/usePartnerStats';

interface ResponsivePartnerLayoutProps {
  children: React.ReactNode;
  stats: PartnerStats;
  currentView: 'dashboard' | 'vehicles' | 'drivers' | 'deliveries' | 'subscription-earnings' | 'subscriptions' | 'analytics' | 'notifications' | 'profile';
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
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Menu</h2>
                <p className="text-sm text-muted-foreground mt-1">Navigation partenaire</p>
              </div>
              
              {/* Navigation */}
              <div className="flex-1 p-4">
                <MobilePartnerTabs 
                  currentView={currentView} 
                  onViewChange={(view) => {
                    onViewChange(view);
                    setMobileMenuOpen(false);
                  }}
                  variant="vertical"
                />
              </div>
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
            onViewChange={(view: string) => onViewChange(view)}
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
          onViewChange={(view: string) => onViewChange(view)}
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