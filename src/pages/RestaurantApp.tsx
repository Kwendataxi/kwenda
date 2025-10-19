import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Composants
import { RestaurantMobileTabs } from '@/components/restaurant/RestaurantMobileTabs';
import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';
import RestaurantDashboard from '@/pages/restaurant/RestaurantDashboard';
import RestaurantOrders from '@/pages/restaurant/RestaurantOrders';
import RestaurantMenuManager from '@/pages/restaurant/RestaurantMenuManager';
import { RestaurantAnalytics } from '@/components/restaurant/RestaurantAnalytics';
import RestaurantPOS from '@/pages/restaurant/RestaurantPOS';
import { RestaurantProfilePage } from '@/components/restaurant/RestaurantProfilePage';

type RestaurantTab = 'dashboard' | 'orders' | 'menu' | 'analytics' | 'pos' | 'profile';

export default function RestaurantApp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState<RestaurantTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'orders', 'menu', 'analytics', 'pos', 'profile'].includes(tab)) {
      setCurrentTab(tab as RestaurantTab);
    }
  }, [searchParams]);

  useEffect(() => {
    checkRestaurantProfile();
  }, []);

  const checkRestaurantProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/restaurant/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('restaurant_profiles')
        .select('id, verification_status, is_active')
        .eq('user_id', user.id)
        .single();

      if (error || !profile) {
        toast({
          title: 'Profil manquant',
          description: 'Veuillez créer votre profil restaurant',
          variant: 'destructive',
        });
        navigate('/restaurant/auth');
        return;
      }

      setRestaurantId(profile.id);
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: RestaurantTab) => {
    setCurrentTab(tab);
    setSearchParams({ tab });
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <RestaurantDashboard />;
      case 'orders':
        return <RestaurantOrders />;
      case 'menu':
        return <RestaurantMenuManager />;
      case 'analytics':
        return <RestaurantAnalytics restaurantId={restaurantId!} />;
      case 'pos':
        return <RestaurantPOS />;
      case 'profile':
        return <RestaurantProfilePage />;
      default:
        return <RestaurantDashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UniversalAppHeader title="Restaurant Kwenda" />
      
      <div className="pb-20 md:pb-6">
        {renderContent()}
      </div>

      <RestaurantMobileTabs currentTab={currentTab} onTabChange={handleTabChange} />
    </div>
  );
}
