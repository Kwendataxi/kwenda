import { useState, useEffect, Suspense } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AdvancedUserManagement } from '@/components/admin/users/AdvancedUserManagement';
import { ResponsiveAdminLayout } from '@/components/admin/ResponsiveAdminLayout';
import { useUserRoles } from '@/hooks/useUserRoles';
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Loader2 } from 'lucide-react';
import AdminDashboard from '@/components/admin/AdminDashboard';
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

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Chargement...</span>
  </div>
);

const AdminApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { adminRole, loading: rolesLoading } = useUserRoles();
  const { fetchDashboardAnalytics } = useAdminAnalytics();

  useEffect(() => {
    fetchDashboardAnalytics();
  }, [fetchDashboardAnalytics]);

  if (rolesLoading) {
    return <LoadingFallback />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </Suspense>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'transports':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'deliveries':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'drivers':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'driver-analytics':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['users_read']}>
              <AdvancedUserManagement />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'marketplace':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['users_read']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['users_read']}>
              <AdminUserVerificationManager />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'roles':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['users_write']}>
              <EnhancedRoleManagement />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'moderate-products':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['marketplace_moderate']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['notifications_write']}>
              <AdminNotificationCenter />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'notification-monitoring':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['notifications_write']}>
              <AdminDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'zones':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <ModernZoneManagementDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'service-toggle':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <ServiceManagementPanel />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'subscriptions':
        return (
          <div className="space-y-6">
            <Suspense fallback={<LoadingFallback />}>
              <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
                <UnifiedSubscriptionManager />
              </FlexiblePermissionGuard>
            </Suspense>
          </div>
        );

      case 'subscription-config':
        return (
          <div className="space-y-6">
            <Suspense fallback={<LoadingFallback />}>
              <FlexiblePermissionGuard requiredPermissions={['finance_admin']}>
                <SubscriptionPlansConfig />
              </FlexiblePermissionGuard>
            </Suspense>
          </div>
        );

      case 'subscription-analytics':
        return (
          <div className="space-y-6">
            <Suspense fallback={<LoadingFallback />}>
              <FlexiblePermissionGuard requiredPermissions={['finance_read']}>
                <FinancialSubscriptionDashboard />
              </FlexiblePermissionGuard>
            </Suspense>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6">
            <Suspense fallback={<LoadingFallback />}>
              <FlexiblePermissionGuard requiredPermissions={['support_admin']}>
                <AdvancedSupportCenter />
              </FlexiblePermissionGuard>
            </Suspense>
          </div>
        );

      case 'rental':
        return (
          <div className="space-y-6">
            <Suspense fallback={<LoadingFallback />}>
              <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
                <AdminRentalManager />
              </FlexiblePermissionGuard>
            </Suspense>
          </div>
        );

      case 'promo-codes':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
              <AdminPromoCodeManager />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'ads':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['marketplace_moderate']}>
              <PromotionalAdsManager />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'lottery':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <AdminLotteryDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'partners':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <AdminPartnerManager />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <AdminTeamManager />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'google-migration':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <GoogleMigrationPanel />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <AdminSettings />
            </FlexiblePermissionGuard>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <AdminDashboard />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value={activeTab} className="mt-0">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminApp;