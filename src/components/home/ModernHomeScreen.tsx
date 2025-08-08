import { useState } from 'react';
import { ModernHeader } from './ModernHeader';
import { ServiceGrid } from './ServiceGrid';
import { UniversalSearchBar } from './UniversalSearchBar';
import { RecentPlaces } from './RecentPlaces';
import { MarketplacePreview } from './MarketplacePreview';
import { ModernBottomNavigation } from './ModernBottomNavigation';
import { HomeTrendsSheet } from './HomeTrendsSheet';
import { HomeRecentPlacesSheet } from './HomeRecentPlacesSheet';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface ModernHomeScreenProps {
  onServiceSelect: (service: string) => void;
  onSearch: (query: string) => void;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-grey-50 to-white">
      <ModernHeader 
        hasNotifications={true}
      />
      
      <div className="space-y-4 pb-24">
        <ServiceGrid onServiceSelect={onServiceSelect} />
        
        <UniversalSearchBar 
          onSearch={onSearch}
          onTransportSelect={() => onServiceSelect('transport')}
        />
        
        <RecentPlaces 
          onPlaceSelect={(placeName, coordinates) => {
            onSearch(placeName);
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