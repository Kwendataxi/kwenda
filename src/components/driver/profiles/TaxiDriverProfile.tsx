/**
 * 🚗 Profil Chauffeur Taxi - Structuré et complet avec vraies données
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ProfileHeader } from './shared/ProfileHeader';
import { VehicleCard } from './shared/VehicleCard';
import { PerformanceStats } from './shared/PerformanceStats';
import { DocumentsSection } from './shared/DocumentsSection';
import { SubscriptionCard } from './shared/SubscriptionCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Wallet, Users, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReferralDashboard } from '../referral/ReferralDashboard';
import { SupportModal } from '../support/SupportModal';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ServiceZonesDisplay } from '../zones/ServiceZonesDisplay';
import { ServiceZoneSelector } from '../zones/ServiceZoneSelector';
import { CityManagementPanel } from '../CityManagementPanel';
import { DriverCodeManager } from '../DriverCodeManager';
import { useDriverPerformanceStats } from '@/hooks/useDriverPerformanceStats';

export const TaxiDriverProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showZonesModal, setShowZonesModal] = useState(false);

  // Charger le profil chauffeur avec les vraies données
  const { data: profile, isLoading } = useQuery({
    queryKey: ['taxi-driver-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data: chauffeur, error } = await supabase
        .from('chauffeurs')
        .select(`
          *,
          driver_subscriptions(
            *,
            subscription_plans(*)
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading chauffeur profile:', error);
        return null;
      }

      return chauffeur;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  // Stats de performance réelles
  const { stats: performanceStats, loading: statsLoading } = useDriverPerformanceStats('taxi');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24 space-y-6">
      {/* Header */}
      <ProfileHeader
        name={profile?.display_name || user?.email?.split('@')[0] || 'Chauffeur'}
        photo={profile?.profile_photo_url}
        rating={profile?.rating_average || 0}
        badge="Chauffeur Taxi Vérifié"
        badgeIcon="🚗"
        serviceType="taxi"
      />

      {/* Ville de service */}
      <CityManagementPanel />

      {/* Véhicule actif */}
      <VehicleCard
        make={profile?.vehicle_make || undefined}
        model={profile?.vehicle_model || undefined}
        plate={profile?.vehicle_plate || undefined}
        color={profile?.vehicle_color || undefined}
        photo={profile?.vehicle_photo_url}
        serviceType="taxi"
      />

      {/* Stats de performance réelles */}
      <PerformanceStats
        stats={performanceStats}
        serviceType="taxi"
        loading={statsLoading}
      />

      {/* Documents */}
      <DocumentsSection serviceType="taxi" />

      {/* Zones de service */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Zones de service</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowZonesModal(true)}
          >
            Gérer mes zones
          </Button>
        </div>
        <ServiceZonesDisplay />
      </Card>

      {/* Abonnement - maintenant connecté aux vraies données */}
      <SubscriptionCard serviceType="taxi" />

      {/* Code Partenaire */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Code Partenaire</h3>
        <DriverCodeManager />
      </Card>

      {/* Actions rapides */}
      <div className="space-y-3">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3"
          onClick={() => navigate('/app/chauffeur?tab=earnings')}
        >
          <Wallet className="w-5 h-5" />
          Mon Wallet KwendaPay
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start gap-3"
          onClick={() => setShowReferralDialog(true)}
        >
          <Users className="w-5 h-5" />
          Codes de parrainage
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start gap-3"
          onClick={() => setShowSupportModal(true)}
        >
          <Shield className="w-5 h-5" />
          Support & Assistance
        </Button>

        <Button 
          variant="destructive" 
          className="w-full justify-start gap-3"
          onClick={async () => {
            await signOut();
          }}
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </Button>
      </div>

      {/* Dialogs */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ReferralDashboard />
        </DialogContent>
      </Dialog>

      <SupportModal
        open={showSupportModal}
        onOpenChange={setShowSupportModal}
      />

      {/* Dialog Zones */}
      <Dialog open={showZonesModal} onOpenChange={setShowZonesModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ServiceZoneSelector />
        </DialogContent>
      </Dialog>
    </div>
  );
};
