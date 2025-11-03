import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernHeader } from './ModernHeader';
import { ServiceGrid } from './ServiceGrid';
import { PromoSlider } from './PromoSlider';
import { ModernBottomNavigation } from './ModernBottomNavigation';
import { HomeTrendsSheet } from './HomeTrendsSheet';
import { HomeRecentPlacesSheet } from './HomeRecentPlacesSheet';
import { MoreServicesSheet } from './MoreServicesSheet';
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
  const [moreServicesOpen, setMoreServicesOpen] = useState(false);
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
    <div className="h-full flex flex-col bg-background" style={{ scrollBehavior: 'smooth' }}>
      {/* Header */}
      <ModernHeader />
      
      {/* Contenu scrollable */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{ 
          touchAction: 'pan-y', 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        } as React.CSSProperties}
      >
        {/* Espace pour header fixe + marge visuelle */}
        <div className="pt-20">
          {/* Subtle Background Elements with parallax */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-16 h-16 bg-primary/3 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-10 w-20 h-20 bg-secondary/2 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative space-y-6 pb-6">
            {/* Slider publicitaire moderne */}
            <div className="px-4">
              <PromoSlider onServiceSelect={onServiceSelect} />
            </div>
            
            {/* Services compacts */}
            <div className="px-4">
              <ServiceGrid 
                onServiceSelect={(service) => {
                  if (service === 'more') {
                    setMoreServicesOpen(true);
                  } else {
                    onServiceSelect(service);
                  }
                }} 
                serviceNotifications={serviceNotifications}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Popup Plus de Services */}
      <MoreServicesSheet
        isOpen={moreServicesOpen}
        onClose={() => setMoreServicesOpen(false)}
        onServiceSelect={onServiceSelect}
      />
    </div>
  );
};