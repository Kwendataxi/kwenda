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
  // Mock recent places data
  const recentPlaces = [
    {
      id: '1',
      name: 'Maison',
      address: 'Avenue Kasavubu, Kalamu',
      type: 'home' as const,
      estimatedTime: '12 min'
    },
    {
      id: '2',
      name: 'Bureau',
      address: 'Boulevard du 30 Juin, Gombe',
      type: 'work' as const,
      estimatedTime: '25 min'
    },
    {
      id: '3',
      name: 'Marché Central',
      address: 'Avenue Kalemie, Kinshasa',
      type: 'recent' as const,
      estimatedTime: '18 min',
      rating: 4.2
    }
  ];

  const handlePlaceSelect = (place: any) => {
    // Navigate to transport with pre-filled destination
    onServiceSelect('transport');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader 
        hasNotifications={true}
        userLocation="Kinshasa, RD Congo"
      />
      
      <div className="space-y-6 pb-20">
        <ServiceGrid onServiceSelect={onServiceSelect} />
        
        <UniversalSearchBar 
          onSearch={onSearch}
          onTransportSelect={() => onServiceSelect('transport')}
        />
        
        <RecentPlaces 
          places={recentPlaces}
          onPlaceSelect={handlePlaceSelect}
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