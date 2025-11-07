/**
 * 📦 Profil Livreur - Structuré et complet
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ProfileHeader } from './shared/ProfileHeader';
import { VehicleCard } from './shared/VehicleCard';
import { PerformanceStats } from './shared/PerformanceStats';
import { DocumentsSection } from './shared/DocumentsSection';
import { SubscriptionCard } from './shared/SubscriptionCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Wallet, Percent, LogOut, Shield, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DeliveryDriverProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select(`
          *,
          chauffeurs(*),
          driver_subscriptions(*)
        `)
        .eq('user_id', user.id)
        .single();

      setProfile(driverProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = {
    deliveriesCompleted: profile?.chauffeurs?.total_deliveries || 0,
    successRate: 98,
    avgDeliveryTime: '25 min',
    rating: profile?.chauffeurs?.rating || 0
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24 space-y-6">
      {/* Header */}
      <ProfileHeader
        name={profile?.full_name || 'Livreur'}
        photo={profile?.photo_url}
        rating={stats.rating}
        badge="Livreur Express Vérifié"
        badgeIcon="📦"
        serviceType="delivery"
      />

      {/* Véhicule de livraison */}
      <VehicleCard
        make={profile?.chauffeurs?.vehicle_make || 'Honda'}
        model={profile?.chauffeurs?.vehicle_model || 'CG 125'}
        plate={profile?.chauffeurs?.license_plate || 'KIN-456-DEF'}
        color={profile?.chauffeurs?.vehicle_color || 'Rouge'}
        photo={profile?.chauffeurs?.vehicle_photo_url}
        capacity={profile?.chauffeurs?.delivery_capacity || '50kg'}
        serviceType="delivery"
      />

      {/* Stats de performance */}
      <PerformanceStats
        stats={[
          { label: 'Livraisons complétées', value: stats.deliveriesCompleted, icon: '📦' },
          { label: 'Taux de succès', value: `${stats.successRate}%`, icon: '✅' },
          { label: 'Délai moyen', value: stats.avgDeliveryTime, icon: '⚡' },
          { label: 'Note clients', value: `${stats.rating}/5`, icon: '⭐' }
        ]}
        serviceType="delivery"
      />

      {/* Types de service activés */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Services activés</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-medium text-foreground">Flash</p>
                <p className="text-xs text-muted-foreground">Livraison express</p>
              </div>
            </div>
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Actif</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <div>
                <p className="font-medium text-foreground">Flex</p>
                <p className="text-xs text-muted-foreground">Livraison standard</p>
              </div>
            </div>
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Actif</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚚</span>
              <div>
                <p className="font-medium text-foreground">Maxicharge</p>
                <p className="text-xs text-muted-foreground">Gros colis</p>
              </div>
            </div>
            <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded-full">Inactif</span>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <DocumentsSection
        documents={[
          { type: 'license', label: 'Permis de conduire', verified: true },
          { type: 'transport', label: 'Autorisation transport', verified: true },
          { type: 'insurance', label: 'Assurance marchandises', verified: false }
        ]}
        serviceType="delivery"
      />

      {/* Zones de livraison */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Zones de livraison</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Kinshasa Centre', 'Gombe', 'Ngaliema', 'Bandalungwa', 'Kintambo'].map((zone) => (
            <span 
              key={zone}
              className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm font-medium"
            >
              {zone}
            </span>
          ))}
        </div>
      </Card>

      {/* Abonnement */}
      <SubscriptionCard
        plan={profile?.driver_subscriptions?.[0]?.tier || 'free'}
        expiresAt={profile?.driver_subscriptions?.[0]?.valid_until}
        serviceType="delivery"
      />

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
          onClick={() => {/* TODO: Codes promo */}}
        >
          <Percent className="w-5 h-5" />
          Codes promo livreur
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start gap-3"
          onClick={() => {/* TODO: Support */}}
        >
          <Shield className="w-5 h-5" />
          Support & Assistance
        </Button>

        <Button 
          variant="destructive" 
          className="w-full justify-start gap-3"
          onClick={() => {
            signOut();
            navigate('/');
          }}
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};
