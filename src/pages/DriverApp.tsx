import React, { useEffect, useState } from 'react';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';
import DriverHeader from '@/components/driver/DriverHeader';
import DriverBottomNavigation from '@/components/driver/DriverBottomNavigation';
import DriverMoreSheet from '@/components/driver/DriverMoreSheet';
import MobileDriverInterface from '@/components/mobile/MobileDriverInterface';
import { DriverDeliveryDashboard } from '@/components/driver/DriverDeliveryDashboard';
import { DriverWalletPanel } from '@/components/driver/DriverWalletPanel';
import { DriverCreditManager } from '@/components/driver/DriverCreditManager';
import { DriverChallenges } from '@/components/driver/DriverChallenges';
import { DriverCodeManager } from '@/components/driver/DriverCodeManager';
import { DriverReferrals } from '@/components/driver/DriverReferrals';
import ProductionDriverInterface from '@/components/driver/ProductionDriverInterface';
import { VehicleManagementPanel } from '@/components/driver/management/VehicleManagementPanel';
import { ServiceChangeRequestPanel } from '@/components/driver/management/ServiceChangeRequestPanel';
import { useAuth } from '@/hooks/useAuth';

const DriverApp = () => {
  const { loading } = useDriverServiceType();
  const [tab, setTab] = useState('deliveries');
  const [moreOpen, setMoreOpen] = useState(false);

  const {user} = useAuth();
  useEffect(()=>{
    if(user && user.user_metadata){
      if(user.user_metadata.role !== "chauffeur"){
        window.location.href = "/";
      }
      console.log(user);
    }
  },[user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background content-with-bottom-nav">
      <DriverHeader serviceType="delivery" />
      
      <main className="container mx-auto px-4 content-with-bottom-nav-scrollable pt-4">
        {tab === 'rides' && <MobileDriverInterface onNavigateToEarnings={() => setTab('wallet')} onNavigateToCredits={() => setTab('credits')} onNavigateToNavigation={() => {}} />}
        {tab === 'deliveries' && (
          <ProductionDriverInterface />
        )}
        {tab === 'wallet' && <DriverWalletPanel />}
        {tab === 'credits' && <DriverCreditManager />}
        {tab === 'challenges' && <DriverChallenges />}
        {tab === 'partner' && <DriverCodeManager />}
        {tab === 'referrals' && <DriverReferrals />}
        {tab === 'vehicles' && (
          <div className="space-y-6">
            <VehicleManagementPanel />
            <ServiceChangeRequestPanel />
          </div>
        )}
      </main>

      <DriverBottomNavigation 
        activeTab={tab as any} 
        onTabChange={setTab as any}
        onOpenMore={() => setMoreOpen(true)}
      />
      
      <DriverMoreSheet 
        open={moreOpen} 
        onOpenChange={setMoreOpen}
        onSelect={(selectedTab) => {
          setTab(selectedTab);
          setMoreOpen(false);
        }}
      />
    </div>
  );
};

export default DriverApp;