import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ModernZoneManagementDashboard } from '@/components/admin/zones/ModernZoneManagementDashboard';
import NextGenDispatchMonitor from '@/components/admin/NextGenDispatchMonitor';
import { DriverFinancialManager } from '@/components/admin/DriverFinancialManager';
import { AdvancedSupportCenter } from '@/components/admin/AdvancedSupportCenter';
import { ResponsiveAdminLayout } from '@/components/admin/ResponsiveAdminLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserRoles } from '@/hooks/useUserRoles';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { DriverCreditsManager } from '@/components/admin/DriverCreditsManager';
import { CommissionManager } from '@/components/admin/CommissionManager';
import { FinancialDashboard } from '@/components/admin/FinancialDashboard';
import { ADMIN_NAVIGATION, ADMIN_ROLE_LABELS } from '@/types/roles';
import { AdminPricingManager } from '@/components/admin/AdminPricingManager';
import { AdminFiltersBar } from '@/components/admin/AdminFiltersBar';
import { AdvancedUserManagement } from '@/components/admin/users/AdvancedUserManagement';
import UnifiedDispatchMonitor from '@/components/admin/UnifiedDispatchMonitor';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { AdminMarketplaceManager } from '@/components/marketplace/AdminMarketplaceManager';
import { AdminNotificationCenter } from '@/components/admin/AdminNotificationCenter';
import { RealTimeActivityFeed } from '@/components/admin/RealTimeActivityFeed';
import { OnlineDriversList } from '@/components/admin/OnlineDriversList';
import { 
  LayoutDashboard,
  Users,
  Car, 
  DollarSign, 
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Filter,
  Search,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Building2,
  ShoppingBag,
  Flag,
  MessageSquare,
  Ban,
  UserCheck,
  Percent,
  Star,
  Calendar as CalendarIcon,
  Send,
  Bell,
  Shield,
  Activity,
  PieChart,
  BarChart3,
  Archive,
  Trash2,
  Plus,
  ArrowLeft,
  HeadphonesIcon,
  HelpCircle,
  RefreshCw,
  CreditCard,
  Globe,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const AdminApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
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
  const isMobile = useIsMobile();
  const { adminRole, hasPermission, hasAnyPermission, loading: rolesLoading } = useUserRoles();
  const { loading: analyticsLoading, dashboardData, fetchDashboardAnalytics } = useAdminAnalytics();
  const { stats: realTimeStatsData, loading: realTimeLoading } = useRealTimeStats();
  
  useEffect(() => {
    fetchDashboardAnalytics(analyticsDateRange)
  }, [analyticsDateRange])
  
  const realTimeStats = useMemo(() => {
    const overview = (dashboardData as any)?.overview || {}
    return {
      totalUsers: realTimeStatsData.totalUsers || overview.total_users || 0,
      totalDrivers: realTimeStatsData.totalDrivers || overview.total_drivers || 0,
      totalRevenue: realTimeStatsData.totalRevenue || overview.total_revenue || 0,
      activeRides: realTimeStatsData.activeRides || 0,
      onlineDrivers: realTimeStatsData.onlineDrivers || 0,
      pendingModeration: 0,
      supportTickets: overview.pending_support_tickets || 0
    }
  }, [dashboardData, realTimeStatsData])

  // Filtrer la navigation selon les permissions
  const allowedNavItems = ADMIN_NAVIGATION.filter(item => 
    hasAnyPermission(item.requiredPermissions)
  );

  if (rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
{/* Navigation déplacée dans AdminVerticalNav (ResponsiveAdminLayout) */}

      <TabsContent value="credits" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Crédits Chauffeurs</h1>
            <p className="text-muted-foreground">Gérez les crédits, recharges et transactions des chauffeurs</p>
          </div>
        </div>
        
        <PermissionGuard requiredPermissions={['finance_write']}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Crédits et Transactions</h2>
            <DriverCreditsManager />
          </div>
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="commissions" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Commissions</h1>
            <p className="text-muted-foreground">Configurez les taux de commission et suivez les revenus</p>
          </div>
        </div>
        
        <PermissionGuard requiredPermissions={['finance_admin']}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Configuration des Commissions</h2>
            <CommissionManager />
          </div>
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="financial" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Financier</h1>
            <p className="text-muted-foreground">Analysez les performances financières et les métriques</p>
          </div>
        </div>
        
        <PermissionGuard requiredPermissions={['finance_read']}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Analyse Financière</h2>
            <FinancialDashboard />
          </div>
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="tarifs" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Tarifs</h1>
            <p className="text-muted-foreground">Configurez les tarifs par zone et type de service</p>
          </div>
        </div>
        
        <PermissionGuard requiredPermissions={['transport_admin']}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Configuration Tarifaire</h2>
            <AdminPricingManager />
          </div>
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="dispatch" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monitoring des Opérations</h1>
            <p className="text-muted-foreground">Surveillez en temps réel toutes les commandes et chauffeurs</p>
          </div>
        </div>
        
        <PermissionGuard requiredPermissions={['transport_admin']}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Centre de Contrôle Unifié</h2>
            <UnifiedDispatchMonitor />
          </div>
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="marketplace" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modération Marketplace</h1>
            <p className="text-muted-foreground">Gérez et modérez les produits de la marketplace</p>
          </div>
        </div>
        
        <PermissionGuard requiredPermissions={['marketplace_moderate']}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Gestion des Produits</h2>
            <AdminMarketplaceManager onBack={() => {}} />
          </div>
        </PermissionGuard>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Centre de Notifications</h1>
            <p className="text-muted-foreground">Envoyez des notifications aux utilisateurs</p>
          </div>
        </div>
        
        <PermissionGuard requiredPermissions={['notifications_write']}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Gestion des Notifications</h2>
            <AdminNotificationCenter />
          </div>
        </PermissionGuard>
      </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <PermissionGuard requiredPermissions={['analytics_read']}>
              {/* Header avec rôle utilisateur */}
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

              {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-floating border-0 animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-elegant">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Utilisateurs</p>
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.totalUsers.toLocaleString()}</p>
                    </div>
                   </div>
                   {realTimeStats.totalUsers > 0 ? (
                     <div className="mt-4">
                       <span className="text-body-sm text-muted-foreground">Total enregistré</span>
                     </div>
                   ) : (
                     <div className="mt-4">
                       <span className="text-body-sm text-muted-foreground">Aucun utilisateur</span>
                     </div>
                   )}
                </CardContent>
              </Card>

              <Card className="card-floating border-0 animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center shadow-elegant">
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Chauffeurs</p>
                       <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.totalDrivers.toLocaleString()}</p>
                     </div>
                    </div>
                    {realTimeStats.totalDrivers > 0 ? (
                     <div className="mt-4">
                       <span className="text-body-sm text-muted-foreground">Chauffeurs inscrits</span>
                     </div>
                   ) : (
                     <div className="mt-4">
                       <span className="text-body-sm text-muted-foreground">Aucun chauffeur</span>
                     </div>
                   )}
                </CardContent>
              </Card>

              <Card className="card-floating border-0 animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-elegant">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Revenus (période)</p>
                       <p className="text-heading-lg font-bold text-card-foreground">{realTimeStats.totalRevenue.toLocaleString()} CDF</p>
                     </div>
                    </div>
                    {realTimeStats.totalRevenue > 0 ? (
                     <div className="mt-4">
                       <span className="text-body-sm text-muted-foreground">Revenus période sélectionnée</span>
                     </div>
                   ) : (
                     <div className="mt-4">
                       <span className="text-body-sm text-muted-foreground">Aucun revenu</span>
                     </div>
                   )}
                </CardContent>
              </Card>

              <Card className="card-floating border-0 animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-elegant">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Tickets support</p>
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.supportTickets}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-body-sm text-red-500 font-medium bg-red-50 px-2 py-1 rounded-md">En attente</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="card-floating border-0">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-elegant">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Annonces marketplace</p>
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.pendingModeration}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-body-sm text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-md">En attente de modération</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-elegant">
                      <HeadphonesIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Tickets support</p>
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.supportTickets}</p>
                    </div>
                  </div>
                   {realTimeStats.supportTickets > 0 ? (
                     <div className="mt-4">
                       <span className="text-body-sm text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-md">En attente</span>
                     </div>
                   ) : (
                     <div className="mt-4">
                       <span className="text-body-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">Aucun ticket</span>
                     </div>
                   )}
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-elegant">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-body-sm font-medium text-muted-foreground">Chauffeurs en ligne</p>
                      <p className="text-display-sm font-bold text-card-foreground">{realTimeStats.onlineDrivers}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-body-sm text-green-600 ml-1 font-medium">Temps réel</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Activity and Drivers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealTimeActivityFeed 
                activities={realTimeStatsData.recentActivities}
                loading={realTimeLoading}
              />
              <OnlineDriversList 
                drivers={realTimeStatsData.onlineDriversList}
                loading={realTimeLoading}
              />
            </div>
            </PermissionGuard>
          </TabsContent>

          
        <TabsContent value="zones" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion des Zones</h1>
              <p className="text-muted-foreground">Configurez les zones de service et leurs paramètres</p>
            </div>
          </div>
          
          <PermissionGuard requiredPermissions={['transport_admin']} showError>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Configuration des Zones</h2>
              <ModernZoneManagementDashboard />
            </div>
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="dispatch" className="space-y-6">
          <NextGenDispatchMonitor />
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion des Chauffeurs</h1>
              <p className="text-muted-foreground">Gérez les chauffeurs, leurs finances et performances</p>
            </div>
          </div>
          
          <PermissionGuard requiredPermissions={['drivers_read']} showError>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Finances des Chauffeurs</h2>
              <DriverFinancialManager />
            </div>
          </PermissionGuard>
        </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <PermissionGuard requiredPermissions={['users_read', 'users_write']}>
              <AdvancedUserManagement />
            </PermissionGuard>

          </TabsContent>

          {/* Marketplace tab content moved to line 215 after dispatch tab */}

          {/* Finance content moved to financial tab */}


        <TabsContent value="support" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Centre de Support</h1>
              <p className="text-muted-foreground">Gérez les tickets de support et l'assistance utilisateurs</p>
            </div>
          </div>
          
          <PermissionGuard requiredPermissions={['support_read']} showError>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tickets et Assistance</h2>
              <AdvancedSupportCenter />
            </div>
          </PermissionGuard>
        </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres Système</h1>
                <p className="text-muted-foreground">Configurez les paramètres généraux et la modération</p>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold">Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-md">Paramètres généraux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Mode maintenance</p>
                      <p className="text-body-sm text-muted-foreground">Désactiver temporairement l'application</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Nouvelles inscriptions</p>
                      <p className="text-body-sm text-muted-foreground">Autoriser les nouveaux utilisateurs</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Notifications push</p>
                      <p className="text-body-sm text-muted-foreground">Envoyer des notifications automatiques</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-floating border-0">
                <CardHeader>
                  <CardTitle className="text-heading-md">Modération automatique</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Auto-approbation annonces</p>
                      <p className="text-body-sm text-muted-foreground">Approuver automatiquement les annonces</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Filtres de contenu</p>
                      <p className="text-body-sm text-muted-foreground">Détecter le contenu inapproprié</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-md font-medium text-card-foreground">Validation des chauffeurs</p>
                      <p className="text-body-sm text-muted-foreground">Vérification manuelle obligatoire</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
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