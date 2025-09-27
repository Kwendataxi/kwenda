import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveAdminLayout } from '@/components/admin/ResponsiveAdminLayout';
import { useUserRoles } from '@/hooks/useUserRoles';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { DriverCreditsManager } from '@/components/admin/DriverCreditsManager';
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

  const renderContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsContent value="overview" className="space-y-6">
        <PermissionGuard requiredPermissions={['analytics_read']}>
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
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="test-data" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Données de Test</h1>
            <p className="text-muted-foreground">Générez des données réalistes pour tester le dashboard</p>
          </div>
        </div>
        
        <PermissionGuard requiredPermissions={['analytics_read']}>
          <TestDataManager />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="credits" className="space-y-6">
        <PermissionGuard requiredPermissions={['finance_write']}>
          <DriverCreditsManager />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="commissions" className="space-y-6">
        <PermissionGuard requiredPermissions={['finance_admin']}>
          <CommissionManager />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="financial" className="space-y-6">
        <PermissionGuard requiredPermissions={['finance_read']}>
          <FinancialDashboard />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="tarifs" className="space-y-6">
        <PermissionGuard requiredPermissions={['transport_admin']}>
          <AdminPricingManager />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="zones" className="space-y-6">
        <PermissionGuard requiredPermissions={['transport_admin']}>
          <ModernZoneManagementDashboard />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="dispatch" className="space-y-6">
        <PermissionGuard requiredPermissions={['transport_admin']}>
          <UnifiedDispatchMonitor />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="users" className="space-y-6">
        <PermissionGuard requiredPermissions={['users_read']}>
          <AdvancedUserManagement />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="drivers" className="space-y-6">
        <PermissionGuard requiredPermissions={['users_read']}>
          <DriverManagement />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="partners" className="space-y-6">
        <PermissionGuard requiredPermissions={['users_read']}>
          <AdminPartnerManager />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="teams" className="space-y-6">
        <PermissionGuard requiredPermissions={['users_write']}>
          <AdminTeamManager />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="marketplace" className="space-y-6">
        <PermissionGuard requiredPermissions={['marketplace_moderate']}>
          <AdminMarketplaceManager onBack={() => {}} />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <PermissionGuard requiredPermissions={['notifications_write']}>
          <AdminNotificationCenter />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="ads" className="space-y-6">
        <PermissionGuard requiredPermissions={['notifications_write']}>
          <PromotionalAdsManager />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="services" className="space-y-6">
        <PermissionGuard requiredPermissions={['transport_admin']}>
          <ServiceManagementPanel />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="subscriptions" className="space-y-6">
        <PermissionGuard requiredPermissions={['system_admin']}>
          <UnifiedSubscriptionManager />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="support" className="space-y-6">
        <PermissionGuard requiredPermissions={['support_admin']}>
          <AdvancedSupportCenter />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="location" className="space-y-6">
        <PermissionGuard requiredPermissions={['transport_admin']}>
          <AdminRentalManager />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="lottery" className="space-y-6">
        <PermissionGuard requiredPermissions={['analytics_read']}>
          <AdminLotteryDashboard />
        </PermissionGuard>
       </TabsContent>

       <TabsContent value="promocodes" className="space-y-6">
         <PermissionGuard requiredPermissions={['marketplace_moderate']}>
           <AdminPromoCodeManager />
         </PermissionGuard>
       </TabsContent>

       <TabsContent value="roles" className="space-y-6">
         <PermissionGuard requiredPermissions={['system_admin']}>
           <RoleManagement />
         </PermissionGuard>
       </TabsContent>

      <TabsContent value="migration" className="space-y-6">
        <PermissionGuard requiredPermissions={['system_admin']}>
          <GoogleMigrationPanel />
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <PermissionGuard requiredPermissions={['system_admin']}>
          <AdminSettings />
        </PermissionGuard>
      </TabsContent>
     </Tabs>
   );

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