import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ResponsiveAdminLayout } from '@/components/admin/ResponsiveAdminLayout';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { Loader2 } from 'lucide-react';
import { AdminAnalyticsRoutes } from './admin/routes/AdminAnalyticsRoutes';
import { AdminTransportRoutes } from './admin/routes/AdminTransportRoutes';
import { AdminMarketplaceRoutes } from './admin/routes/AdminMarketplaceRoutes';
import { AdminUserRoutes } from './admin/routes/AdminUserRoutes';
import { AdminConfigRoutes } from './admin/routes/AdminConfigRoutes';
import { AdminCommunicationRoutes } from './admin/routes/AdminCommunicationRoutes';
import { AdminSystemRoutes } from './admin/routes/AdminSystemRoutes';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Chargement...</span>
  </div>
);

const AdminApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const { stats } = useAdminStats();

  if (rolesLoading) {
    return <LoadingFallback />;
  }

  if (!isAdmin) {
    console.error('❌ [AdminApp] Access denied: User is not admin');
    return <Navigate to="/operatorx/admin/auth" replace />;
  }

  const renderContent = () => {
    // Analytics routes (overview, financial-stats, cancellations)
    if (['overview', 'financial-stats', 'cancellations'].includes(activeTab)) {
      return <AdminAnalyticsRoutes activeTab={activeTab} />;
    }
    
    // Transport routes (dispatch, location, vehicle-types, zones)
    if (['dispatch', 'location', 'vehicle-types', 'zones'].includes(activeTab)) {
      return <AdminTransportRoutes activeTab={activeTab} />;
    }
    
    // Marketplace routes (marketplace, marketplace-products, food, food-management, marketplace-management)
    if (['marketplace', 'marketplace-products', 'food', 'food-management', 'marketplace-management'].includes(activeTab)) {
      return <AdminMarketplaceRoutes activeTab={activeTab} />;
    }
    
    // User routes (users, roles, drivers)
    if (['users', 'roles', 'drivers'].includes(activeTab)) {
      return <AdminUserRoutes activeTab={activeTab} />;
    }
    
    // Config routes (services, tarifs, subscriptions, subscription-config, promocodes)
    if (['services', 'tarifs', 'subscriptions', 'subscription-config', 'promocodes'].includes(activeTab)) {
      return <AdminConfigRoutes activeTab={activeTab} />;
    }
    
    // Communication routes (notifications, push-notifications, support)
    if (['notifications', 'push-notifications', 'support'].includes(activeTab)) {
      return <AdminCommunicationRoutes activeTab={activeTab} />;
    }
    
    // System routes (settings, migration, teams, lottery, partners, transport-management, delivery-management, rental-analytics)
    if (['settings', 'migration', 'teams', 'lottery', 'partners', 'transport-management', 'delivery-management', 'rental-analytics'].includes(activeTab)) {
      return <AdminSystemRoutes activeTab={activeTab} />;
    }

    return <Navigate to="/admin?tab=overview" replace />;
  };

  return (
    <ResponsiveAdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      realTimeStats={stats}
    >
      {renderContent()}
    </ResponsiveAdminLayout>
  );
};

export default AdminApp;
