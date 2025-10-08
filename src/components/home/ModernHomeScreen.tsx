import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernHeader } from './ModernHeader';
import { ServiceGrid } from './ServiceGrid';
import { PromoSlider } from './PromoSlider';
import { ModernBottomNavigation } from './ModernBottomNavigation';
import { HomeTrendsSheet } from './HomeTrendsSheet';
import { HomeRecentPlacesSheet } from './HomeRecentPlacesSheet';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useServiceNotifications } from '@/hooks/useServiceNotifications';

interface ModernHomeScreenProps {
  onServiceSelect: (service: string) => void;
  onSearch: (query: string, coordinates?: { lat: number; lng: number }) => void;
  onNavigateToTestData?: () => void;
}

export const ModernHomeScreen = ({
  onServiceSelect,
  onSearch,
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
    <div className="h-screen grid grid-rows-[auto_1fr_auto] bg-background">
      {/* Header - Position naturelle dans la grille */}
      <ModernHeader />
      
      {/* Contenu scrollable - Prend tout l'espace restant */}
      <main 
        className="overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{ 
          touchAction: 'pan-y', 
          WebkitOverflowScrolling: 'touch'
        } as React.CSSProperties}
      >
        {/* Espace pour header fixe + marge visuelle */}
        <div className="pt-[190px]">
          {/* Subtle Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-16 h-16 bg-primary/3 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-20 h-20 bg-secondary/2 rounded-full blur-3xl" />
          </div>
          
          <div className="relative space-y-6 pb-6">
            {/* Slider publicitaire moderne */}
            <div className="px-4">
              <PromoSlider onServiceSelect={onServiceSelect} />
            </div>
            
            {/* Services compacts */}
            <div className="px-4">
              <ServiceGrid 
                onServiceSelect={onServiceSelect} 
                serviceNotifications={serviceNotifications}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Navigation - Position naturelle dans la grille (toujours visible en bas) */}
      <ModernBottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        notificationCount={3}
        favoritesCount={5}
      />
    </div>
  );
};