import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverServiceInfo } from '@/hooks/useDriverServiceInfo';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { useTabScrollReset } from '@/hooks/useTabScrollReset';
import { UniversalBottomNavigation } from '@/components/navigation/UniversalBottomNavigation';
import { TaxiDriverDashboard } from '@/components/driver/taxi/TaxiDriverDashboard';
import { DeliveryDriverDashboard } from '@/components/driver/delivery/DeliveryDriverDashboard';
import { ModernDriverWallet } from '@/components/driver/wallet/ModernDriverWallet';
import { TaxiDriverProfile } from '@/components/driver/profiles/TaxiDriverProfile';
import { DeliveryDriverProfile } from '@/components/driver/profiles/DeliveryDriverProfile';
import { TaxiSubscriptionPlans } from '@/components/driver/subscriptions/TaxiSubscriptionPlans';
import { DeliverySubscriptionPlans } from '@/components/driver/subscriptions/DeliverySubscriptionPlans';
import { DriverChallenges } from '@/components/driver/DriverChallenges';
import { ServiceMigrationModal } from '@/components/onboarding/ServiceMigrationModal';
import { ServiceTypeValidator } from '@/components/driver/ServiceTypeValidator';
import { DriverServiceProvider } from '@/contexts/DriverServiceContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const DriverApp = () => {
  const { loading, serviceType, serviceSpecialization } = useDriverServiceInfo();
  const [tab, setTab] = useState<'orders' | 'earnings' | 'challenges' | 'subscription' | 'profile'>('orders');
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  // 🔔 Activer les notifications système temps réel
  useSystemNotifications();

  // ✅ Scroll automatique au changement d'onglet
  useTabScrollReset(tab, { 
    behavior: 'smooth',
    delay: 50 
  });

  // Sécurité : Vérifier que l'utilisateur est un chauffeur
  const { user } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && user && primaryRole !== 'driver') {
      navigate('/');
    }
  }, [user, primaryRole, roleLoading, navigate]);

  // ✅ PHASE 9: Afficher le modal de migration si service_type unknown
  useEffect(() => {
    if (!loading && serviceType === 'unknown' && user) {
      setShowMigrationModal(true);
    }
  }, [loading, serviceType, user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ✅ PHASE 3: Router vers le bon dashboard selon le service_type
  const renderServiceInterface = () => {
    // Si service_type inconnu, afficher un message explicite
    if (serviceType === 'unknown') {
      return (
        <div className="p-4">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Service non configuré
              </h2>
              <p className="text-muted-foreground max-w-md">
                Veuillez choisir votre spécialité (Taxi ou Livraison) pour accéder à votre espace professionnel et recevoir des commandes.
              </p>
              <Button 
                onClick={() => setShowMigrationModal(true)}
                className="mt-2"
                size="lg"
              >
                Choisir ma spécialité
              </Button>
            </div>
          </Card>
        </div>
      );
    }
    
    if (serviceType === 'taxi') {
      return <TaxiDriverDashboard />;
    } else if (serviceType === 'delivery') {
      return <DeliveryDriverDashboard />;
    }
    
    // Fallback : afficher taxi par défaut
    return <TaxiDriverDashboard />;
  };



  return (
    <DriverServiceProvider>
      {/* ✅ PHASE 2: Validateur automatique d'incohérences */}
      <ServiceTypeValidator 
        serviceType={serviceType}
        serviceSpecialization={serviceSpecialization}
      />

      {/* Modal de migration */}
      <ServiceMigrationModal
        open={showMigrationModal}
        onComplete={(newServiceType) => {
          setShowMigrationModal(false);
          window.location.reload(); // Recharger pour appliquer le nouveau service_type
        }}
      />

      <UniversalAppHeader title="Espace Chauffeur" />

      <div className="min-h-screen bg-background mobile-safe-layout pt-[60px]">
        <main className="flex-1 overflow-y-auto content-scrollable">
          {/* ✅ PHASE 3: Interface séparée par type de service */}
          {tab === 'orders' && renderServiceInterface()}
          
          {/* Autres onglets communs */}
          {tab === 'earnings' && (
            <div className="responsive-padding">
              <ModernDriverWallet serviceType={serviceType === 'unknown' ? 'taxi' : serviceType} />
            </div>
          )}
          {tab === 'subscription' && (
            <div className="responsive-padding">
              {serviceType === 'delivery' ? <DeliverySubscriptionPlans /> : <TaxiSubscriptionPlans />}
            </div>
          )}
          {tab === 'challenges' && <div className="responsive-padding"><DriverChallenges /></div>}
          {tab === 'profile' && (
            <div className="responsive-padding">
              {serviceType === 'delivery' ? <DeliveryDriverProfile /> : <TaxiDriverProfile />}
            </div>
          )}
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
    </DriverServiceProvider>
  );
};

export default DriverApp;