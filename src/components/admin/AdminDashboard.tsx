import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AdminPartnerManager from './AdminPartnerManager';
import { AdminRentalModeration } from './AdminRentalModeration';
import { AdminMarketplaceManager } from './AdminMarketplaceManager';
import { AdminLocationManager } from './AdminLocationManager';
import { AdminServiceManager } from './AdminServiceManager';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { Building2, Car, Users, Activity, MapPin, Package, Settings, BarChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  // Fetch real-time dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const [usersRes, driversRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('id, user_type, created_at'),
        supabase.from('chauffeurs').select('id, is_active'),
        supabase.from('transport_bookings').select('id, status, actual_price')
      ]);

      const users = usersRes.data || [];
      const drivers = driversRes.data || [];
      const bookings = bookingsRes.data || [];

      return {
        totalUsers: users.length,
        activeDrivers: drivers.filter(d => d.is_active).length,
        totalBookings: bookings.length,
        totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.actual_price || 0), 0)
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="partners">Partenaires</TabsTrigger>
          <TabsTrigger value="moderation">Modération</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="mt-6">
          <AdminPartnerManager />
        </TabsContent>

        <TabsContent value="moderation" className="mt-6">
          <AdminRentalModeration />
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <AdminMarketplaceManager />
        </TabsContent>

        <TabsContent value="location" className="mt-6">
          <AdminLocationManager />
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          <AdminServiceManager />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AdminAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;