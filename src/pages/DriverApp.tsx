import React, { useEffect, useState } from 'react';
import { DriverDeliveryDashboard } from '@/components/driver/DriverDeliveryDashboard';
import MobileDriverInterface from '@/components/mobile/MobileDriverInterface';

import { Card, CardContent } from '@/components/ui/card';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';
import { toast } from 'sonner';
import { DriverChallenges } from '@/components/driver/DriverChallenges';
import { DriverCodeManager } from '@/components/driver/DriverCodeManager';
import { DriverReferrals } from '@/components/driver/DriverReferrals';
import { DriverCreditManager } from '@/components/driver/DriverCreditManager';
import { DriverWalletPanel } from '@/components/driver/DriverWalletPanel';
import { DriverHeader } from '@/components/driver/DriverHeader';
import { DriverBottomNavigation } from '@/components/driver/DriverBottomNavigation';
import { DriverMoreSheet } from '@/components/driver/DriverMoreSheet';
const DriverApp = () => {
  const { loading: loadingProfile, serviceType } = useDriverServiceType();
  const [tab, setTab] = useState<'rides' | 'deliveries' | 'wallet' | 'credits' | 'challenges' | 'partner' | 'referrals'>('deliveries');
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!loadingProfile) {
      // Default tab based on profile
      setTab(serviceType === 'taxi' ? 'rides' : 'deliveries');
    }
  }, [loadingProfile, serviceType]);

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 pb-28">
          <DriverHeader serviceType={serviceType} />

          {tab === 'rides' && (
            <MobileDriverInterface
              onNavigateToEarnings={() => {
                toast.info('Ouverture des gains du chauffeur');
                console.log('[Driver] Navigate to earnings');
              }}
              onNavigateToCredits={() => {
                toast.info('Ouverture des crédits chauffeur');
                console.log('[Driver] Navigate to credits');
              }}
              onNavigateToNavigation={() => {
                toast.info('Navigation ouverte');
                console.log('[Driver] Open navigation');
              }}
            />
          )}

          {tab === 'deliveries' && (
            <DriverDeliveryDashboard />
          )}

          {tab === 'wallet' && (
            <DriverWalletPanel />
          )}

          {tab === 'credits' && (
            <DriverCreditManager />
          )}

          {tab === 'challenges' && (
            <DriverChallenges />
          )}

          {tab === 'partner' && (
            <DriverCodeManager />
          )}

          {tab === 'referrals' && (
            <DriverReferrals />
          )}
        <DriverBottomNavigation
          activeTab={tab === 'deliveries' ? 'deliveries' : 'rides'}
          onTabChange={(t) => setTab(t)}
          onOpenMore={() => setMoreOpen(true)}
        />
        <DriverMoreSheet
          open={moreOpen}
          onOpenChange={setMoreOpen}
          onSelect={(t) => setTab(t)}
        />
      </div>
    </div>
  );
};

export default DriverApp;
