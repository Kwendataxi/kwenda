import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  DollarSign,
  Users,
  Activity,
  Truck,
  Timer
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminDeliveryManagement = () => {
  // Fetch delivery statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminDeliveryStats'],
    queryFn: async () => {
      const [deliveriesRes, driversRes, activeDeliveriesRes] = await Promise.all([
        supabase.from('delivery_orders').select('id, status, actual_price, created_at, delivery_type'),
        supabase.from('chauffeurs').select('id, is_active, verification_status, service_type').eq('service_type', 'delivery'),
        supabase.from('delivery_orders').select('id, status').in('status', ['pending', 'confirmed', 'driver_assigned', 'picked_up', 'in_transit'])
      ]);

      const deliveries = deliveriesRes.data || [];
      const drivers = driversRes.data || [];
      const activeDeliveries = activeDeliveriesRes.data || [];

      // Calculate stats
      const totalDeliveries = deliveries.length;
      const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;
      const cancelledDeliveries = deliveries.filter(d => d.status === 'cancelled').length;
      const totalRevenue = deliveries
        .filter(d => d.status === 'delivered')
        .reduce((sum, d) => sum + (Number(d.actual_price) || 0), 0);

      const totalDrivers = drivers.length;
      const activeDrivers = drivers.filter(d => d.is_active && d.verification_status === 'verified').length;

      // Deliveries by status
      const statusCounts = deliveries.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const deliveriesByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count
      }));

      // Deliveries by type
      const typeCounts = deliveries.reduce((acc, d) => {
        const type = d.delivery_type || 'flex';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const deliveriesByType = Object.entries(typeCounts).map(([type, count]) => ({
        name: type === 'flash' ? 'Flash (5mn)' : type === 'flex' ? 'Flex (Standard)' : 'Maxicharge',
        count
      }));

      // Revenue by day (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const revenueByDay = last7Days.map(day => {
        const dayRevenue = deliveries
          .filter(d => d.created_at?.startsWith(day) && d.status === 'delivered')
          .reduce((sum, d) => sum + (Number(d.actual_price) || 0), 0);
        
        return {
          date: day.substring(5),
          revenue: dayRevenue
        };
      });

      return {
        totalDeliveries,
        completedDeliveries,
        cancelledDeliveries,
        activeDeliveries: activeDeliveries.length,
        totalRevenue,
        avgDeliveryValue: totalDeliveries > 0 ? totalRevenue / completedDeliveries : 0,
        totalDrivers,
        activeDrivers,
        successRate: totalDeliveries > 0 ? (completedDeliveries / totalDeliveries * 100).toFixed(1) : 0,
        deliveriesByStatus,
        deliveriesByType,
        revenueByDay
      };
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Livraisons</h1>
          <p className="text-muted-foreground mt-1">
            Monitoring temps réel des livraisons et livreurs
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="deliveries">Livraisons</TabsTrigger>
          <TabsTrigger value="drivers">Livreurs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-20" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* DELIVERIES STATS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Statistiques Livraisons
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Livraisons</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalDeliveries || 0}</div>
                      <p className="text-xs text-muted-foreground">Tous statuts confondus</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">En Cours</CardTitle>
                      <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{stats?.activeDeliveries || 0}</div>
                      <p className="text-xs text-muted-foreground">Livraisons actives</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Livrées</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats?.completedDeliveries || 0}</div>
                      <p className="text-xs text-muted-foreground">Taux: {stats?.successRate}%</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Annulées</CardTitle>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{stats?.cancelledDeliveries || 0}</div>
                      <p className="text-xs text-muted-foreground">À analyser</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* REVENUE STATS */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenus Livraisons
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalRevenue.toLocaleString()} CDF</div>
                      <p className="text-xs text-muted-foreground">Livraisons complétées</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Valeur Moyenne</CardTitle>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Math.round(stats?.avgDeliveryValue || 0).toLocaleString()} CDF</div>
                      <p className="text-xs text-muted-foreground">Par livraison</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Livreurs Actifs</CardTitle>
                      <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{stats?.activeDrivers || 0}</div>
                      <p className="text-xs text-muted-foreground">Sur {stats?.totalDrivers} total</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* CHARTS */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Revenus - 7 Derniers Jours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={stats?.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} CDF`} />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Deliveries by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Répartition par Statut
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={stats?.deliveriesByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats?.deliveriesByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Deliveries by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Livraisons par Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats?.deliveriesByType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Delivery Times Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5" />
                      Performance Livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Temps moyen Flash</span>
                        <span className="text-lg font-bold text-orange-600">~15 min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Temps moyen Flex</span>
                        <span className="text-lg font-bold text-blue-600">~45 min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Temps moyen Maxicharge</span>
                        <span className="text-lg font-bold text-purple-600">~90 min</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">Taux de succès global</span>
                          <span className="text-xl font-bold text-green-600">{stats?.successRate}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* DELIVERIES TAB */}
        <TabsContent value="deliveries">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Livraisons</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tableau de gestion détaillé des livraisons à implémenter
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DRIVERS TAB */}
        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Livreurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tableau de gestion détaillé des livreurs à implémenter
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Avancées</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Analytics détaillées : zones de livraison, performances, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDeliveryManagement;
