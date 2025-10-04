import { useEffect, useState } from 'react';
import { ModernHeader } from './ModernHeader';
import { ServiceGrid } from './ServiceGrid';
import { PromoSlider } from './PromoSlider';
import { MarketplacePreview } from './MarketplacePreview';
import { ModernBottomNavigation } from './ModernBottomNavigation';
import { HomeTrendsSheet } from './HomeTrendsSheet';
import { HomeRecentPlacesSheet } from './HomeRecentPlacesSheet';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAuth } from '@/hooks/useAuth';
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
        // Navigate to profile
        break;
      default:
        // Stay on home
        break;
    }
  };

  const {user} = useAuth();
    useEffect(()=>{
      if(user && user.user_metadata){
        if(user.user_metadata.role !== "simple_user_client"){
          window.location.href = "/";
        }
      }
      console.log(user);
  },[user])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-16 h-16 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-20 h-20 bg-secondary/2 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10">
        <ModernHeader />
        
        <div className="space-y-1 pb-20">
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

        <ModernBottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          notificationCount={3}
          favoritesCount={5}
        />
      </div>
    </div>
  );
};