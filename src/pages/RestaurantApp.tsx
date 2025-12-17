import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Composants
import { RestaurantMobileTabs } from '@/components/restaurant/RestaurantMobileTabs';
import { RestaurantSidebar } from '@/components/restaurant/RestaurantSidebar';
import { UniversalAppHeader } from '@/components/navigation/UniversalAppHeader';
import RestaurantDashboard from '@/pages/restaurant/RestaurantDashboard';
import RestaurantOrders from '@/pages/restaurant/RestaurantOrders';
import RestaurantMenuManager from '@/pages/restaurant/RestaurantMenuManager';
import { RestaurantAnalytics } from '@/components/restaurant/RestaurantAnalytics';
import RestaurantWalletPage from '@/pages/restaurant/RestaurantWalletPage';
import { RestaurantProfilePage } from '@/components/restaurant/RestaurantProfilePage';
import RestaurantSubscriptionPage from '@/pages/restaurant/RestaurantSubscriptionPage';

type RestaurantTab = 'dashboard' | 'orders' | 'menu' | 'analytics' | 'wallet' | 'profile' | 'subscription';

export default function RestaurantApp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState<RestaurantTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'orders', 'menu', 'analytics', 'wallet', 'profile', 'subscription'].includes(tab)) {
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
        .select('id, verification_status, is_active, restaurant_name')
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
      setRestaurantName(profile.restaurant_name || '');

      // Charger les commandes en attente
      const { data: orders } = await supabase
        .from('food_orders')
        .select('id')
        .eq('restaurant_id', profile.id)
        .in('status', ['pending', 'confirmed']);

      setPendingOrders(orders?.length || 0);
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
      case 'wallet':
        return <RestaurantWalletPage />;
      case 'profile':
        return <RestaurantProfilePage />;
      case 'subscription':
        return <RestaurantSubscriptionPage />;
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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixe en haut (mobile uniquement) */}
      <header className="flex-shrink-0 border-b md:hidden">
        <UniversalAppHeader title="Kwenda Food" />
      </header>
      
      {/* Container principal avec sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop */}
        <RestaurantSidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          restaurantName={restaurantName}
          pendingOrders={pendingOrders}
        />

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto smooth-scroll pb-20 md:pb-0">
          <div className="container mx-auto p-4 md:p-6 max-w-7xl">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Footer - Tabs Mobile uniquement */}
      <footer className="flex-shrink-0 md:hidden">
        <RestaurantMobileTabs currentTab={currentTab} onTabChange={handleTabChange} />
      </footer>
    </div>
  );
}
