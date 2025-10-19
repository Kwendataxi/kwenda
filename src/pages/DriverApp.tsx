import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { UniversalBottomNavigation } from '@/components/navigation/UniversalBottomNavigation';
import { VTCDriverInterface } from '@/components/driver/VTCDriverInterface';
import { DeliveryDriverInterface } from '@/components/driver/DeliveryDriverInterface';
import { DriverWalletPanel } from '@/components/driver/DriverWalletPanel';
import { DriverChallenges } from '@/components/driver/DriverChallenges';
import { SubscriptionPlans } from '@/components/driver/SubscriptionPlans';
import { DriverProfilePage } from '@/components/driver/DriverProfilePage';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';

import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';

const DriverApp = () => {
  const { loading, serviceType } = useDriverServiceType();
  const [tab, setTab] = useState<'orders' | 'earnings' | 'challenges' | 'subscription' | 'profile'>('orders');

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

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ✅ PHASE 2: Rendu conditionnel selon le type de service
  const renderServiceInterface = () => {
    if (serviceType === 'taxi') {
      return <VTCDriverInterface />;
    } else if (serviceType === 'delivery') {
      return <DeliveryDriverInterface />;
    }
    // Fallback : afficher VTC par défaut
    return <VTCDriverInterface />;
  };



  return (
    <>
      <UniversalAppHeader title="Espace Chauffeur" />

      <div className="min-h-screen bg-background mobile-safe-layout pt-[60px]">
        <main className="flex-1 overflow-y-auto content-scrollable">
          {/* ✅ PHASE 2: Interface séparée par type de service */}
          {tab === 'orders' && renderServiceInterface()}
          
          {/* Autres onglets communs */}
          {tab === 'earnings' && <div className="responsive-padding"><DriverWalletPanel /></div>}
          {tab === 'subscription' && <div className="responsive-padding"><SubscriptionPlans /></div>}
          {tab === 'challenges' && <div className="responsive-padding"><DriverChallenges /></div>}
          {tab === 'profile' && <div className="responsive-padding"><DriverProfilePage /></div>}
        </main>

        <UniversalBottomNavigation 
          userType="driver"
          activeTab={tab} 
          onTabChange={(newTab) => {
            if (newTab === 'orders' || newTab === 'earnings' || newTab === 'challenges' || newTab === 'subscription' || newTab === 'profile') {
              setTab(newTab);
            }
          }}
        />
      </div>
    </>
  );
};

export default DriverApp;