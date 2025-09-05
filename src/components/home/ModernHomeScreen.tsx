import { useEffect, useState } from 'react';
import { ModernHeader } from './ModernHeader';
import { ServiceGrid } from './ServiceGrid';
import { UniversalSearchBar } from './UniversalSearchBar';
import { RecentPlaces } from './RecentPlaces';
import { MarketplacePreview } from './MarketplacePreview';
import { ModernBottomNavigation } from './ModernBottomNavigation';
import { HomeTrendsSheet } from './HomeTrendsSheet';
import { HomeRecentPlacesSheet } from './HomeRecentPlacesSheet';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useServiceNotifications } from '@/hooks/useServiceNotifications';

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
      case 'search':
        onServiceSelect('marketplace');
        break;
      case 'favorites':
        // Navigate to favorites
        break;
      case 'activity':
        onServiceSelect('history');
        break;
      case 'profile':
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
    <div className="min-h-screen bg-gradient-to-br from-grey-50 to-white">
      <ModernHeader />
      
      <div className="space-y-4 pb-32">
        <ServiceGrid 
          onServiceSelect={onServiceSelect} 
          serviceNotifications={serviceNotifications}
        />
        
        <UniversalSearchBar 
          onSearch={onSearch}
          onTransportSelect={() => onServiceSelect('transport')}
        />
        
        <RecentPlaces 
          onPlaceSelect={(placeName, coordinates) => {
            onSearch(placeName, coordinates);
            onServiceSelect('transport');
          }}
          onViewAll={() => setPlacesOpen(true)}
        />
        
        <MarketplacePreview
          featuredProducts={featuredProducts}
          onProductSelect={onProductSelect}
          onViewAll={() => setTrendsOpen(true)}
        />
        
      </div>

      <ModernBottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        notificationCount={3}
        favoritesCount={5}
      />
    </div>
  );
};