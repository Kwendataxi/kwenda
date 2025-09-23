import { useEffect, useState } from 'react';
import { ModernHeader } from './ModernHeader';
import { ServiceGrid } from './ServiceGrid';
// Removed obsolete components
import { MarketplacePreview } from './MarketplacePreview';
import { UniversalBottomNavigation, UniversalTabType } from '@/components/navigation/UniversalBottomNavigation';
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
  const [activeTab, setActiveTab] = useState<UniversalTabType>('home');
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);
  const { unreadCount } = useRealtimeNotifications();
  const serviceNotifications = useServiceNotifications();

  const handleTabChange = (tab: UniversalTabType) => {
    setActiveTab(tab);
    // Navigation logic based on selected tab
    switch (tab) {
      case 'services':
        onServiceSelect('marketplace');
        break;
      case 'orders':
        onServiceSelect('history');
        break;
      case 'wallet':
        // Navigate to wallet
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30 relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-congo-red/5 via-transparent to-congo-yellow/5 animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-congo-blue/5 via-transparent to-congo-green/5 animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10">
        <ModernHeader />
        
        <div className="space-y-6 pb-32">
          <ServiceGrid 
            onServiceSelect={onServiceSelect} 
            serviceNotifications={serviceNotifications}
          />
          
          {/* Simplified home interface - search removed temporarily */}
          
          <MarketplacePreview
            featuredProducts={featuredProducts}
            onProductSelect={onProductSelect}
            onViewAll={() => setTrendsOpen(true)}
          />
        </div>

        <UniversalBottomNavigation
          userType="client"
          activeTab={activeTab}
          onTabChange={handleTabChange}
          badges={{
            orders: 3,
            favorites: 5
          }}
        />
      </div>
    </div>
  );
};