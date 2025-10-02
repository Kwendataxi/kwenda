import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveAdminLayout } from '@/components/admin/ResponsiveAdminLayout';
import { useUserRoles } from '@/hooks/useUserRoles';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { FlexiblePermissionGuard } from '@/components/auth/FlexiblePermissionGuard';
import { CommissionManager } from '@/components/admin/CommissionManager';
import { FinancialDashboard } from '@/components/admin/FinancialDashboard';
import { ADMIN_ROLE_LABELS } from '@/types/roles';
import { AdminPricingManager } from '@/components/admin/AdminPricingManager';
import { AdminFiltersBar } from '@/components/admin/AdminFiltersBar';
import { AdvancedUserManagement } from '@/components/admin/users/AdvancedUserManagement';
import { DriverManagement } from '@/components/admin/drivers/DriverManagement';
import UnifiedDispatchMonitor from '@/components/admin/UnifiedDispatchMonitor';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { EnhancedDashboard } from '@/components/admin/EnhancedDashboard';
import { TestDataManager } from '@/components/admin/TestDataManager';
import { AdminMarketplaceManager } from '@/components/marketplace/AdminMarketplaceManager';
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
import { AdminPromoCodeManager } from '@/components/admin/AdminPromoCodeManager';
import AdminPartnerManager from '@/components/admin/AdminPartnerManager';
import { GoogleMigrationPanel } from '@/components/admin/GoogleMigrationPanel';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { EnhancedRoleManagement } from '@/components/admin/roles/EnhancedRoleManagement';
import { EnhancedSupportCenter } from '@/components/admin/support/EnhancedSupportCenter';
import { EnhancedUserManagement } from '@/components/admin/users/EnhancedUserManagement';
import { EnhancedTeamManager } from '@/components/admin/teams/EnhancedTeamManager';
import { EnhancedMarketplaceManagerFixed } from '@/components/marketplace/EnhancedMarketplaceManagerFixed';
import { EnhancedGoogleMigrationPanel } from '@/components/admin/migration/EnhancedGoogleMigrationPanel';
import { CentralizedNotificationCenterFixed as CentralizedNotificationCenter } from '@/components/admin/notifications/CentralizedNotificationCenterFixed';
import { MissionControlCenter } from '@/components/admin/monitoring/MissionControlCenter';
import { VehicleTypeManager } from '@/components/admin/VehicleTypeManager';

const AdminApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsDateRange, setAnalyticsDateRange] = useState<{ start: string; end: string }>(() => {
    try {
      const saved = localStorage.getItem('admin.analytics.dateRange')
      if (saved) return JSON.parse(saved)
    } catch {}
    const now = new Date()
    return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), end: now.toISOString() }
  })
  
  useEffect(() => {
    try { localStorage.setItem('admin.analytics.dateRange', JSON.stringify(analyticsDateRange)) } catch {}
  }, [analyticsDateRange])
  
  const { adminRole, loading: rolesLoading } = useUserRoles();
  const { fetchDashboardAnalytics } = useAdminAnalytics();
  const { stats: realTimeStatsData, loading: realTimeLoading } = useRealTimeStats();
  
  useEffect(() => {
    fetchDashboardAnalytics(analyticsDateRange)
  }, [analyticsDateRange])
  
  const realTimeStats = useMemo(() => ({
    totalUsers: realTimeStatsData.totalUsers || 0,
    totalDrivers: realTimeStatsData.totalDrivers || 0,
    totalRevenue: realTimeStatsData.totalRevenue || 0,
    activeRides: realTimeStatsData.activeRides || 0,
    onlineDrivers: realTimeStatsData.onlineDrivers || 0,
    pendingModeration: 0,
    supportTickets: 0
  }), [realTimeStatsData])

  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
        <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Dashboard Admin</h2>
                  <p className="text-muted-foreground">
                    Connecté en tant que: {adminRole ? ADMIN_ROLE_LABELS[adminRole] : 'Administrateur'}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {adminRole ? ADMIN_ROLE_LABELS[adminRole] : 'Admin'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <AdminFiltersBar
            dateRange={analyticsDateRange}
            onChange={setAnalyticsDateRange}
          />

          <EnhancedDashboard />
        </FlexiblePermissionGuard>
        </div>
        );

      case 'test-data':
        return (
          <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Données de Test</h1>
            <p className="text-muted-foreground">Générez des données réalistes pour tester le dashboard</p>
          </div>
        </div>
        
        <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
          <TestDataManager />
        </FlexiblePermissionGuard>
        </div>
        );

      case 'credits':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">⚠️ Système de Crédits Obsolète</h2>
                <p className="text-muted-foreground">
                  Le système de crédits a été remplacé par le système d'abonnements par courses.
                  Veuillez utiliser l'onglet "Abonnements" pour gérer les souscriptions des chauffeurs.
                </p>
                <Button onClick={() => setActiveTab('subscriptions')} className="mt-4">
                  Accéder aux Abonnements
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'commissions':
        return (
          <div className="space-y-6">
        <FlexiblePermissionGuard requiredPermissions={['finance_admin']}>
          <CommissionManager />
        </FlexiblePermissionGuard>
        </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
        <FlexiblePermissionGuard requiredPermissions={['finance_read']}>
          <FinancialDashboard />
        </FlexiblePermissionGuard>
        </div>
        );

      case 'tarifs':
        return (
          <div className="space-y-6">
        <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
          <AdminPricingManager />
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

      case 'vehicle-types':
        return (
          <div className="space-y-6">
        <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
          <VehicleTypeManager />
        </FlexiblePermissionGuard>
        </div>
        );

      case 'dispatch':
        return (
          <div className="space-y-6">
        <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
          <UnifiedDispatchMonitor />
        </FlexiblePermissionGuard>
        </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
          <FlexiblePermissionGuard requiredPermissions={['users_read']}>
            <EnhancedUserManagement />
          </FlexiblePermissionGuard>
        </div>
        );

      case 'drivers':
        return (
          <div className="space-y-6">
        <FlexiblePermissionGuard requiredPermissions={['users_read']}>
          <DriverManagement />
        </FlexiblePermissionGuard>
        </div>
        );

      case 'partners':
        return (
          <div className="space-y-6">
        <FlexiblePermissionGuard requiredPermissions={['users_read']}>
          <AdminPartnerManager />
        </FlexiblePermissionGuard>
        </div>
        );

      case 'teams':
        return (
          <div className="space-y-6">
        <FlexiblePermissionGuard requiredPermissions={['users_write']}>
          <EnhancedTeamManager onBack={() => setActiveTab('overview')} />
        </FlexiblePermissionGuard>
        </div>
        );

      case 'marketplace':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['marketplace_moderate']}>
              <EnhancedMarketplaceManagerFixed onBack={() => setActiveTab('overview')} />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['notifications_write']}>
              <CentralizedNotificationCenter onBack={() => setActiveTab('overview')} />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'ads':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['notifications_write']}>
              <PromotionalAdsManager />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <ServiceManagementPanel />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'subscriptions':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <UnifiedSubscriptionManager />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'support':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['support_admin']}>
              <EnhancedSupportCenter />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['transport_admin']}>
              <AdminRentalManager />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'lottery':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['analytics_read']}>
              <AdminLotteryDashboard />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'promocodes':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['marketplace_moderate']}>
              <AdminPromoCodeManager />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'roles':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <EnhancedRoleManagement />
            </FlexiblePermissionGuard>
          </div>
        );

      case 'migration':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <EnhancedGoogleMigrationPanel onBack={() => setActiveTab('overview')} />
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

      case 'mission-control':
        return (
          <div className="space-y-6">
            <FlexiblePermissionGuard requiredPermissions={['system_admin']}>
              <MissionControlCenter onBack={() => setActiveTab('overview')} />
            </FlexiblePermissionGuard>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Section non trouvée</p>
          </div>
        );
    }
  };

  return (
    <ResponsiveAdminLayout
      realTimeStats={realTimeStats}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </ResponsiveAdminLayout>
  );
};

export default AdminApp;