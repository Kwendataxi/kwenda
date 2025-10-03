import { Card, CardContent } from '@/components/ui/card';
import { Users, Car, Package, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const OverviewDashboard = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: async () => {
      const [usersRes, driversRes, bookingsRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('chauffeurs').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('transport_bookings').select('id, status, actual_price')
      ]);

      const bookings = bookingsRes.data || [];

      return {
        totalUsers: usersRes.count || 0,
        activeDrivers: driversRes.count || 0,
        totalBookings: bookings.length,
        totalRevenue: bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.actual_price || 0), 0)
      };
    },
    refetchInterval: 30000
  });

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vue d'ensemble</h1>
        <p className="text-muted-foreground">
          Statistiques en temps réel de la plateforme Kwenda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboardData?.totalUsers || 0}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Car className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboardData?.activeDrivers || 0}</p>
                <p className="text-sm text-muted-foreground">Chauffeurs actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboardData?.totalBookings || 0}</p>
                <p className="text-sm text-muted-foreground">Courses total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(dashboardData?.totalRevenue || 0).toLocaleString()} CDF</p>
                <p className="text-sm text-muted-foreground">Revenus total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
