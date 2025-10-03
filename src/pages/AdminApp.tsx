import { useState, useEffect, Suspense } from 'react';
import { ResponsiveAdminLayout } from '@/components/admin/ResponsiveAdminLayout';
import { AdvancedUserManagement } from '@/components/admin/users/AdvancedUserManagement';
import { useUserRoles } from '@/hooks/useUserRoles';
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { useEnhancedRealTimeStats } from '@/hooks/useEnhancedRealTimeStats';
import { Loader2 } from 'lucide-react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { OverviewDashboard } from '@/components/admin/OverviewDashboard';
import { AdminNotificationCenter } from '@/components/admin/AdminNotificationCenter';
import { AdvancedSupportCenter } from '@/components/admin/AdvancedSupportCenter';
import { ModernZoneManagementDashboard } from '@/components/admin/zones/ModernZoneManagementDashboard';
import { PromotionalAdsManager } from '@/components/admin/PromotionalAdsManager';
import { AdminLotteryDashboard } from '@/components/admin/AdminLotteryDashboard';
import { AdminRentalManager } from '@/components/admin/AdminRentalManager';
import { AdminTeamManager } from '@/components/admin/teams/AdminTeamManager';
import { RoleManagement } from '@/components/admin/roles/RoleManagement';
import { ServiceManagementPanel } from '@/components/admin/ServiceManagementPanel';
import { UnifiedSubscriptionManager } from '@/components/admin/subscriptions/UnifiedSubscriptionManager';
import { SubscriptionPlansConfig } from '@/components/admin/subscriptions/SubscriptionPlansConfig';
import { FinancialSubscriptionDashboard } from '@/components/admin/subscriptions/FinancialSubscriptionDashboard';
import { AdminPromoCodeManager } from '@/components/admin/AdminPromoCodeManager';
import AdminPartnerManager from '@/components/admin/AdminPartnerManager';
import { GoogleMigrationPanel } from '@/components/admin/GoogleMigrationPanel';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { EnhancedRoleManagement } from '@/components/admin/roles/EnhancedRoleManagement';
import { EnhancedSupportCenter } from '@/components/admin/support/EnhancedSupportCenter';
import { EnhancedUserManagement } from '@/components/admin/users/EnhancedUserManagement';
import { AdminUserVerificationManager } from '@/components/admin/AdminUserVerificationManager';
import { DriverManagement } from '@/components/admin/drivers/DriverManagement';

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Chargement...</span>
  </div>
);

const AdminApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { adminRole, loading: rolesLoading } = useUserRoles();
  const { fetchDashboardAnalytics } = useAdminAnalytics();
  const { stats, loading: statsLoading } = useEnhancedRealTimeStats();

  useEffect(() => {
    fetchDashboardAnalytics();
  }, [fetchDashboardAnalytics]);

  if (rolesLoading) {
    return <LoadingFallback />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
              <OverviewDashboard />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'financial-stats':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['finance_read']}>
              <FinancialSubscriptionDashboard />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'dispatch':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Dispatch & Répartition</h2>
                <p className="text-muted-foreground">Module de dispatch en développement</p>
              </div>
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'location':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <AdminRentalManager />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'services':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <ServiceManagementPanel />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['users_read']}>
              <AdvancedUserManagement />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'promocodes':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
              <AdminPromoCodeManager />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'marketplace':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['marketplace_moderate']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'roles':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['users_write']}>
              <EnhancedRoleManagement />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'notifications':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['notifications_write']}>
              <AdminNotificationCenter />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'ads':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['marketplace_moderate']}>
              <PromotionalAdsManager />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'lottery':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <AdminLotteryDashboard />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'zones':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <ModernZoneManagementDashboard />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'subscriptions':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <UnifiedSubscriptionManager />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'drivers':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['drivers_read']}>
              <DriverManagement />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'subscription-config':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['finance_admin']}>
              <SubscriptionPlansConfig />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'support':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['support_admin']}>
              <EnhancedSupportCenter />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'partners':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <AdminPartnerManager />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'teams':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <AdminTeamManager />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'migration':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <GoogleMigrationPanel />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'settings':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <AdminSettings />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AdminDashboard />
          </Suspense>
        );
    }
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