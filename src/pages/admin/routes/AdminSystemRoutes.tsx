import { Suspense } from 'react';
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { GoogleMigrationPanel } from '@/components/admin/GoogleMigrationPanel';
import { AdminTeamManager } from '@/components/admin/teams/AdminTeamManager';
import { AdminLotteryDashboard } from '@/components/admin/AdminLotteryDashboard';
import AdminPartnerManager from '@/components/admin/AdminPartnerManager';
import AdminTransportManagement from '@/pages/admin/AdminTransportManagement';
import AdminDeliveryManagement from '@/pages/admin/AdminDeliveryManagement';
import AdminRentalAnalytics from '@/pages/admin/AdminRentalAnalytics';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

export const AdminSystemRoutes = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'settings':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <AdminSettings />
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
      
    case 'teams':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <AdminTeamManager />
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
      
    case 'partners':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <AdminPartnerManager />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'transport-management':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <AdminTransportManagement />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'delivery-management':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <AdminDeliveryManagement />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    case 'rental-analytics':
      return (
        <Suspense fallback={<LoadingFallback />}>
          <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
            <AdminRentalAnalytics />
          </FlexiblePermissionGuard>
        </Suspense>
      );
      
    default:
      return null;
  }
};
