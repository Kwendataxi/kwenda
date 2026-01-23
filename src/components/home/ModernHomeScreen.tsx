import { lazy, Suspense, useEffect, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernHeader } from './ModernHeader';

import { HomeTrendsSheet } from './HomeTrendsSheet';
import { HomeRecentPlacesSheet } from './HomeRecentPlacesSheet';
import { MoreServicesSheet } from './MoreServicesSheet';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useServiceNotifications } from '@/hooks/useServiceNotifications';
import { useServiceTransition } from '@/hooks/useServiceTransition';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationToastContainer } from '@/components/notifications/NotificationToastContainer';
import { useClientActiveDeliveryOrders } from '@/hooks/useClientActiveDeliveryOrders';
import { ActiveDeliveryBanner } from '@/components/delivery/ActiveDeliveryBanner';

// ✅ PHASE 4: Lazy loading des composants lourds
const PromoSlider = lazy(() => import('./PromoSliderOptimized').then(m => ({ default: m.PromoSlider })));
const ServiceGrid = lazy(() => import('./ServiceGrid').then(m => ({ default: m.ServiceGrid })));

interface ModernHomeScreenProps {
  onServiceSelect: (service: string) => void;
  onSearch: (query: string, coordinates?: { lat: number; lng: number }) => void;
  onNavigateToTestData?: () => void;
  onDeliveryTrackingOpen?: (orderId: string) => void;
}

// ✅ PHASE 4: Component optimisé avec React.memo
export const ModernHomeScreen = memo(({
  onServiceSelect,
  onSearch,
  onNavigateToTestData,
  onDeliveryTrackingOpen
}: ModernHomeScreenProps) => {
  const [activeTab, setActiveTab] = useState('home');
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [moreServicesOpen, setMoreServicesOpen] = useState(false);
  const { unreadCount, toasts } = useRealtimeNotifications();
  const serviceNotifications = useServiceNotifications();
  const { transitionToService } = useServiceTransition();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { primaryRole, loading: roleLoading } = useUserRoles();
  
  // ✅ Hook pour les livraisons actives
  const { activeOrders, hasActiveOrders } = useClientActiveDeliveryOrders();

  const handleToastAction = (id: string, url?: string) => {
    if (url) {
      navigate(url);
    }
  };

  const handleToastClose = (id: string) => {
    // Le toast sera automatiquement retiré par le hook
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'activity':
        onServiceSelect('history');
        break;
      case 'profil':
        onServiceSelect('profil');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    // Si l'utilisateur a un rôle différent de client, le rediriger vers son dashboard
    if (!roleLoading && primaryRole && primaryRole !== 'client') {
      const dashboardPaths: Record<string, string> = {
        driver: '/app/chauffeur',
        partner: '/app/partenaire',
        admin: '/operatorx/admin',
        restaurant: '/app/restaurant'
      };
      const targetPath = dashboardPaths[primaryRole] || '/app/client';
      // ✅ Ne pas utiliser replace pour préserver l'historique de navigation
      navigate(targetPath);
    }
  }, [primaryRole, roleLoading, navigate]);

  return (
    <div className="flex flex-col" data-page="home">
      {/* Container de toasts modernes au-dessus de tout */}
      <NotificationToastContainer
        toasts={toasts}
        onClose={handleToastClose}
        onAction={handleToastAction}
        maxVisible={3}
      />
      
      {/* Header fixe - géré par ModernHeader avec position: fixed */}
      <ModernHeader />
      
      {/* Contenu principal - padding-top explicite pour le header fixe */}
      <div className="space-y-6 py-4" style={{ paddingTop: '80px' }}>
        {/* ✅ Bannière livraisons actives */}
        {hasActiveOrders && (
          <ActiveDeliveryBanner 
            orders={activeOrders} 
            onOrderClick={(orderId) => onDeliveryTrackingOpen?.(orderId)}
          />
        )}
        
        {/* Slider */}
        <div className="px-4 relative z-10">
          <Suspense fallback={
            <div className="w-full aspect-[16/9] bg-muted/50 rounded-2xl animate-pulse" />
          }>
            <PromoSlider onServiceSelect={onServiceSelect} />
          </Suspense>
        </div>
        
        {/* ServiceGrid */}
        <div className="px-4 relative z-10">
          <Suspense fallback={
            <div className="grid grid-cols-3 gap-x-6 gap-y-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex flex-col items-center gap-3 animate-fade-in">
                  <Skeleton className="w-24 h-24 rounded-[32px]" />
                  <Skeleton className="h-[15px] w-16 rounded" />
                </div>
              ))}
            </div>
          }>
            <ServiceGrid 
              onServiceSelect={(service) => {
                if (service === 'more') {
                  setMoreServicesOpen(true);
                } else {
                  transitionToService(service);
                }
              }} 
              serviceNotifications={serviceNotifications}
            />
          </Suspense>
        </div>
      </div>

      <MoreServicesSheet
        isOpen={moreServicesOpen}
        onClose={() => setMoreServicesOpen(false)}
        onServiceSelect={onServiceSelect}
      />
    </div>
  );
});

ModernHomeScreen.displayName = 'ModernHomeScreen';