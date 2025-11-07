/**
 * 🚗 Profil Chauffeur Taxi - Structuré et complet
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
import { MapPin, Wallet, Users, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TaxiDriverProfile = () => {
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
    ridesCompleted: profile?.chauffeurs?.total_rides || 0,
    rating: profile?.chauffeurs?.rating || 0,
    acceptanceRate: 95,
    avgResponseTime: '2 min'
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24 space-y-6">
      {/* Header */}
      <ProfileHeader
        name={profile?.full_name || 'Chauffeur'}
        photo={profile?.photo_url}
        rating={stats.rating}
        badge="Chauffeur Taxi Vérifié"
        badgeIcon="🚗"
        serviceType="taxi"
      />

      {/* Véhicule actif */}
      <VehicleCard
        make={profile?.chauffeurs?.vehicle_make || 'Toyota'}
        model={profile?.chauffeurs?.vehicle_model || 'Corolla'}
        plate={profile?.chauffeurs?.license_plate || 'KIN-123-ABC'}
        color={profile?.chauffeurs?.vehicle_color || 'Blanc'}
        photo={profile?.chauffeurs?.vehicle_photo_url}
        serviceType="taxi"
      />

      {/* Stats de performance */}
      <PerformanceStats
        stats={[
          { label: 'Courses complétées', value: stats.ridesCompleted, icon: '🚗' },
          { label: 'Note moyenne', value: `${stats.rating}/5`, icon: '⭐' },
          { label: "Taux d'acceptation", value: `${stats.acceptanceRate}%`, icon: '✅' },
          { label: 'Temps de réponse', value: stats.avgResponseTime, icon: '⚡' }
        ]}
        serviceType="taxi"
      />

      {/* Documents */}
      <DocumentsSection serviceType="taxi" />

      {/* Zones de service */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-foreground">Zones de service</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Kinshasa Centre', 'Gombe', 'Limete', 'Ngaliema', 'Kalamu'].map((zone) => (
            <span 
              key={zone}
              className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium"
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
        serviceType="taxi"
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
          onClick={() => {/* TODO: Parrainage */}}
        >
          <Users className="w-5 h-5" />
          Codes de parrainage
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
