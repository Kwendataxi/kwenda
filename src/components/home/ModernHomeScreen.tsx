import { useState } from 'react';
import { ModernHeader } from './ModernHeader';
import { ServiceGrid } from './ServiceGrid';
import { UniversalSearchBar } from './UniversalSearchBar';
import { RecentPlaces } from './RecentPlaces';
import { MarketplacePreview } from './MarketplacePreview';

interface ModernHomeScreenProps {
  onServiceSelect: (service: string) => void;
  onSearch: (query: string) => void;
  featuredProducts: any[];
  onProductSelect: (product: any) => void;
  onMarketplaceViewAll: () => void;
}

export const ModernHomeScreen = ({
  onServiceSelect,
  onSearch,
  featuredProducts,
  onProductSelect,
  onMarketplaceViewAll
}: ModernHomeScreenProps) => {

  return (
    <div className="min-h-screen bg-gray-50">
        <ModernHeader 
          hasNotifications={true}
        />
      
      <div className="space-y-6 pb-20">
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
      </div>
    </div>
  );
};