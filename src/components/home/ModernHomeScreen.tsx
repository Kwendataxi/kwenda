import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernHeader } from './ModernHeader';
import { ServiceGrid } from './ServiceGrid';
import { PromoSlider } from './PromoSlider';
import { MarketplacePreview } from './MarketplacePreview';
import { ModernBottomNavigation } from './ModernBottomNavigation';
import { HomeTrendsSheet } from './HomeTrendsSheet';
import { HomeRecentPlacesSheet } from './HomeRecentPlacesSheet';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useServiceNotifications } from '@/hooks/useServiceNotifications';
import ModernRentalPreview from './ModernRentalPreview';

interface ModernHomeScreenProps {
  onServiceSelect: (service: string) => void;
  onSearch: (query: string, coordinates?: { lat: number; lng: number }) => void;
  featuredProducts: any[];
  trendingProducts?: any[];
  onProductSelect: (product: any) => void;
  onMarketplaceViewAll: () => void;
  onNavigateToTestData?: () => void;
}

export const ModernHomeScreen = ({
  onServiceSelect,
  onSearch,
  featuredProducts,
  trendingProducts,
  onProductSelect,
  onMarketplaceViewAll,
  onNavigateToTestData
}: ModernHomeScreenProps) => {
  const [activeTab, setActiveTab] = useState('home');
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);
  const { unreadCount } = useRealtimeNotifications();
  const serviceNotifications = useServiceNotifications();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Navigation logic based on selected tab
    switch (tab) {
      case 'activity':
        onServiceSelect('history');
        break;
      case 'profil':
        onServiceSelect('profil');
        break;
      default:
        // Stay on home
        break;
    }
  };

  // Sécurité : Rediriger les utilisateurs non-clients
  const { user } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roleLoading && primaryRole && primaryRole !== 'client') {
      navigate('/');
    }
  }, [primaryRole, roleLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Fixe en haut */}
      <ModernHeader />
      
      {/* Contenu scrollable avec marges pour header et nav fixes */}
      <div 
        className="overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{ 
          touchAction: 'pan-y', 
          WebkitOverflowScrolling: 'touch',
          paddingTop: '9rem',
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
          minHeight: '100vh'
        } as React.CSSProperties}
      >
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-16 h-16 bg-primary/3 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-20 h-20 bg-secondary/2 rounded-full blur-3xl" />
        </div>
        
        <div className="relative space-y-6 pt-4">
          {/* Slider publicitaire moderne */}
          <PromoSlider onServiceSelect={onServiceSelect} />
          
          {/* Services compacts */}
          <ServiceGrid 
            onServiceSelect={onServiceSelect} 
            serviceNotifications={serviceNotifications}
          />
          
          {/* Marketplace preview */}
          <MarketplacePreview
            featuredProducts={featuredProducts}
            onProductSelect={onProductSelect}
            onViewAll={onMarketplaceViewAll}
          />
        </div>
      </div>

      {/* Navigation - Fixe en bas */}
      <ModernBottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        notificationCount={3}
        favoritesCount={5}
      />
    </div>
  );
};