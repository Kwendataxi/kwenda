import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AdminPartnerManager from './AdminPartnerManager';
import { AdminRentalManager } from './AdminRentalManager';
import { AdminSubscriptionManager } from './AdminSubscriptionManager';
import { AdminRentalModeration } from './AdminRentalModeration';
import { VehicleCategoryManager } from './VehicleCategoryManager';
import { AdminMarketplaceManager } from './AdminMarketplaceManager';
import { AdminLocationManager } from './AdminLocationManager';
import { AdminServiceManager } from './AdminServiceManager';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { AdminSecurityManager } from './AdminSecurityManager';
import { AdminNotificationManager } from './AdminNotificationManager';
import { AdminUserVerificationManager } from './AdminUserVerificationManager';
import { ClientVerificationPanel } from './users/ClientVerificationPanel';
import { ProductModerationPanel } from '../marketplace/ProductModerationPanel';
import { ProductReportsManager } from '../marketplace/ProductReportsManager';
import { MarketplaceCommissionSettings } from './marketplace/MarketplaceCommissionSettings';
import { Building2, Car, Users, Activity, MapPin, Package, Settings, BarChart, Shield, Bell, CheckCircle, Percent } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  // Fetch real-time dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const [usersRes, driversRes, bookingsRes, verificationsRes, pendingProductsRes, pendingReportsRes] = await Promise.all([
        supabase.from('profiles').select('id, user_type, created_at'),
        supabase.from('chauffeurs').select('id, is_active'),
        supabase.from('transport_bookings').select('id, status, actual_price'),
        supabase.from('user_verification').select('verification_status'),
        supabase.from('marketplace_products').select('id', { count: 'exact' }).eq('moderation_status', 'pending'),
        supabase.from('product_reports').select('id', { count: 'exact' }).eq('status', 'pending')
      ]);

      const users = usersRes.data || [];
      const drivers = driversRes.data || [];
      const bookings = bookingsRes.data || [];
      const verifications = verificationsRes.data || [];

      return {
        totalUsers: users.length,
        activeDrivers: drivers.filter(d => d.is_active).length,
        totalBookings: bookings.length,
        totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.actual_price || 0), 0),
        pendingVerifications: verifications.filter(v => v.verification_status === 'pending_review').length,
        pendingProducts: pendingProductsRes.count || 0,
        pendingReports: pendingReportsRes.count || 0
      };
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration Kwenda</h1>
        <p className="text-muted-foreground">
          Tableau de bord complet de gestion de la plateforme
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{dashboardData?.totalUsers || 0}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Car className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{dashboardData?.activeDrivers || 0}</p>
                <p className="text-sm text-muted-foreground">Chauffeurs actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{dashboardData?.totalBookings || 0}</p>
                <p className="text-sm text-muted-foreground">Commandes total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{(dashboardData?.totalRevenue || 0).toLocaleString()} CDF</p>
                <p className="text-sm text-muted-foreground">Revenus total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Tabs */}
      <Tabs defaultValue="partners" className="w-full">
        <TabsList className="grid w-full grid-cols-12">
          <TabsTrigger value="partners">Partenaires</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
          <TabsTrigger value="rental">Location</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          <TabsTrigger value="marketplace">Vendeurs</TabsTrigger>
          <TabsTrigger value="product-moderation" className="relative">
            Modération Produits
            {(dashboardData?.pendingProducts ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {dashboardData?.pendingProducts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="product-reports" className="relative">
            Signalements
            {(dashboardData?.pendingReports ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {dashboardData?.pendingReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="commissions" className="flex items-center gap-1">
            <Percent className="w-4 h-4" />
            Commissions
          </TabsTrigger>
          <TabsTrigger value="client-verifications" className="relative">
            Vendeurs
            {(dashboardData?.pendingVerifications ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {dashboardData?.pendingVerifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="verifications" className="relative">
            Vérifications
            {(dashboardData?.pendingVerifications ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {dashboardData?.pendingVerifications}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="mt-6">
          <AdminPartnerManager />
        </TabsContent>

          <TabsContent value="moderation" className="mt-6">
            <AdminRentalModeration />
          </TabsContent>
          
          <TabsContent value="categories" className="mt-6">
            <VehicleCategoryManager />
          </TabsContent>

        <TabsContent value="rental" className="mt-6">
          <AdminRentalManager />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <AdminSubscriptionManager />
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <AdminMarketplaceManager />
        </TabsContent>

        <TabsContent value="product-moderation" className="mt-6">
          <ProductModerationPanel />
        </TabsContent>

        <TabsContent value="product-reports" className="mt-6">
          <ProductReportsManager />
        </TabsContent>

        <TabsContent value="commissions" className="mt-6">
          <MarketplaceCommissionSettings />
        </TabsContent>

        <TabsContent value="client-verifications" className="mt-6">
          <ClientVerificationPanel />
        </TabsContent>

        <TabsContent value="verifications" className="mt-6">
          <AdminUserVerificationManager />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AdminAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <AdminSecurityManager />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <AdminNotificationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;