import { useState } from 'react';
import { ModernHeader } from './ModernHeader';
import { ServiceGrid } from './ServiceGrid';
import { UniversalSearchBar } from './UniversalSearchBar';
import { RecentPlaces } from './RecentPlaces';
import { MarketplacePreview } from './MarketplacePreview';
import { ModernBottomNavigation } from './ModernBottomNavigation';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';

interface ModernHomeScreenProps {
  onServiceSelect: (service: string) => void;
  onSearch: (query: string) => void;
  featuredProducts: any[];
  onProductSelect: (product: any) => void;
  onMarketplaceViewAll: () => void;
  onNavigateToTestData?: () => void;
}

export const ModernHomeScreen = ({
  onServiceSelect,
  onSearch,
  featuredProducts,
  onProductSelect,
  onMarketplaceViewAll,
  onNavigateToTestData
}: ModernHomeScreenProps) => {
  const [activeTab, setActiveTab] = useState('home');

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
        // Navigate to activity/history
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
        />
        
        <MarketplacePreview
          featuredProducts={featuredProducts}
          onProductSelect={onProductSelect}
          onViewAll={onMarketplaceViewAll}
        />
        
        {/* Test Data Generator Button */}
        {onNavigateToTestData && (
          <div className="px-4">
            <Button 
              onClick={onNavigateToTestData}
              variant="outline"
              className="w-full"
            >
              <Database className="w-4 h-4 mr-2" />
              Générer des données de test
            </Button>
          </div>
        )}
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