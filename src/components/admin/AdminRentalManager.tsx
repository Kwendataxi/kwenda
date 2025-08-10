import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AdminRentalModeration } from './AdminRentalModeration';
import { RentalSubscriptionManager } from './RentalSubscriptionManager';
import { VehicleCategoryManager } from './VehicleCategoryManager';
import { RentalFinancialDashboard } from './RentalFinancialDashboard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Car, Settings, CreditCard, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

export const AdminRentalManager = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Statistiques générales
  const { data: stats } = useQuery({
    queryKey: ['rental-admin-stats'],
    queryFn: async () => {
      const [vehiclesResponse, subscriptionsResponse] = await Promise.all([
        supabase.from('rental_vehicles').select('moderation_status, is_active'),
        supabase.from('driver_subscriptions').select('status')
      ]);

      const vehicles = vehiclesResponse.data || [];
      const subscriptions = subscriptionsResponse.data || [];

      return {
        totalVehicles: vehicles.length,
        pendingModeration: vehicles.filter(v => v.moderation_status === 'pending').length,
        approvedVehicles: vehicles.filter(v => v.moderation_status === 'approved').length,
        activeVehicles: vehicles.filter(v => v.is_active).length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        totalCategories: 4 // Nombre fixe pour l'instant
      };
    }
  });

  const statCards = [
    {
      title: "Véhicules Total",
      value: stats?.totalVehicles || 0,
      icon: Car,
      color: "text-blue-600"
    },
    {
      title: "En Modération",
      value: stats?.pendingModeration || 0,
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Approuvés",
      value: stats?.approvedVehicles || 0,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Abonnements Actifs",
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      color: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Location</h1>
          <p className="text-muted-foreground">
            Administration complète des véhicules de location et abonnements
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Admin Location
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Modération
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Abonnements
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Types Véhicules
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Financier
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Modération en attente</p>
                    <p className="text-sm text-muted-foreground">
                      {stats?.pendingModeration} véhicules à modérer
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('moderation')}
                    className="text-sm text-primary hover:underline"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Abonnements</p>
                    <p className="text-sm text-muted-foreground">
                      {stats?.activeSubscriptions} abonnements actifs
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('subscriptions')}
                    className="text-sm text-primary hover:underline"
                  >
                    Gérer
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Taux d'approbation</span>
                    <span className="text-sm font-medium">
                      {stats?.totalVehicles ? Math.round((stats.approvedVehicles / stats.totalVehicles) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Véhicules actifs</span>
                    <span className="text-sm font-medium">
                      {stats?.activeVehicles || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Catégories disponibles</span>
                    <span className="text-sm font-medium">
                      {stats?.totalCategories || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="moderation">
          <AdminRentalModeration />
        </TabsContent>

        <TabsContent value="subscriptions">
          <RentalSubscriptionManager />
        </TabsContent>

        <TabsContent value="categories">
          <VehicleCategoryManager />
        </TabsContent>

        <TabsContent value="financial">
          <RentalFinancialDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};