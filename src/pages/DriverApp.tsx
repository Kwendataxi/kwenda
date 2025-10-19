import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import DriverHeader from '@/components/driver/DriverHeader';
import { UniversalBottomNavigation } from '@/components/navigation/UniversalBottomNavigation';
import DriverMoreSheet from '@/components/driver/DriverMoreSheet';
import UnifiedDriverInterface from '@/components/driver/UnifiedDriverInterface';
import { DriverWalletPanel } from '@/components/driver/DriverWalletPanel';
import { DriverChallenges } from '@/components/driver/DriverChallenges';
import { SubscriptionPlans } from '@/components/driver/SubscriptionPlans';
import { DriverCodeManager } from '@/components/driver/DriverCodeManager';
import { DriverReferrals } from '@/components/driver/DriverReferrals';
import { VehicleManagementPanel } from '@/components/driver/management/VehicleManagementPanel';
import { ServiceChangeRequestPanel } from '@/components/driver/management/ServiceChangeRequestPanel';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UserAvatarButton } from '@/components/navigation/UserAvatarButton';
import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';

const DriverApp = () => {
  const { loading } = useDriverServiceType();
  const [tab, setTab] = useState('orders');
  const [moreOpen, setMoreOpen] = useState(false);

  // 🔔 Activer les notifications système temps réel
  useSystemNotifications();

  // Sécurité : Vérifier que l'utilisateur est un chauffeur
  const { user } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && user && primaryRole !== 'driver') {
      navigate('/');
    }
  }, [user, primaryRole, roleLoading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }



  return (
    <>
      <UserAvatarButton 
        position="top-right" 
      />

      <UniversalAppHeader title="Espace Chauffeur" />

      <div className="min-h-screen bg-background mobile-safe-layout pt-[60px]">
        <DriverHeader serviceType="delivery" />
      
      <main className="flex-1 overflow-y-auto content-scrollable responsive-padding">
        <div className="container-fluid space-y-6">
          {/* ✅ Interface unifiée pour TOUTES les commandes */}
          {tab === 'orders' && <UnifiedDriverInterface />}
          {tab === 'earnings' && <DriverWalletPanel />}
          {tab === 'subscription' && <SubscriptionPlans />}
          {tab === 'challenges' && <DriverChallenges />}
          {tab === 'partner' && <DriverCodeManager />}
          {tab === 'referrals' && <DriverReferrals />}
          {tab === 'vehicles' && (
            <div className="space-y-6">
              <VehicleManagementPanel />
              <ServiceChangeRequestPanel />
            </div>
          )}
        </div>
      </main>

      <UniversalBottomNavigation 
        userType="driver"
        activeTab={tab as any} 
        onTabChange={setTab as any}
        onMoreAction={() => setMoreOpen(true)}
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
    </>
  );
};

export default DriverApp;