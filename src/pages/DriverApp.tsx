
import React, { useEffect, useState } from 'react';
import { DriverDeliveryDashboard } from '@/components/driver/DriverDeliveryDashboard';
import MobileDriverInterface from '@/components/mobile/MobileDriverInterface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';
import { toast } from 'sonner';
import { DriverChallenges } from '@/components/driver/DriverChallenges';
import { DriverCodeManager } from '@/components/driver/DriverCodeManager';
import DriverReferrals from '@/components/driver/DriverReferrals';
import DriverCreditManager from '@/components/driver/DriverCreditManager';
import { DriverWalletPanel } from '@/components/driver/DriverWalletPanel';

const DriverApp = () => {
  const { loading: loadingProfile, serviceType } = useDriverServiceType();
  const [tab, setTab] = useState<'rides' | 'deliveries' | 'wallet' | 'credits' | 'challenges' | 'partner' | 'referrals'>('deliveries');

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
      <div className="container mx-auto p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="flex flex-wrap gap-2 w-full mb-4">
            <TabsTrigger value="rides">Courses</TabsTrigger>
            <TabsTrigger value="deliveries">Livraisons</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="credits">Crédits</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="partner">Code Partenaire</TabsTrigger>
            <TabsTrigger value="referrals">Parrainage</TabsTrigger>
          </TabsList>

          <TabsContent value="rides" className="mt-0">
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
          </TabsContent>

          <TabsContent value="deliveries" className="mt-0">
            <DriverDeliveryDashboard />
          </TabsContent>

          <TabsContent value="wallet" className="mt-0">
            <DriverWalletPanel />
          </TabsContent>

          <TabsContent value="credits" className="mt-0">
            <DriverCreditManager />
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            <DriverChallenges />
          </TabsContent>

          <TabsContent value="partner" className="mt-0">
            <DriverCodeManager />
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <DriverReferrals />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DriverApp;
