import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CreditCard, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';

export const AdminSubscriptionManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Abonnements chauffeurs simplifiés
  const { data: driverSubscriptions = [] } = useQuery({
    queryKey: ['admin-driver-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Abonnements location simplifiés
  const { data: rentalSubscriptions = [] } = useQuery({
    queryKey: ['admin-rental-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Statistiques
  const { data: stats } = useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: async () => {
      const [driverStats, rentalStats] = await Promise.all([
        supabase
          .from('driver_subscriptions')
          .select('*')
          .eq('status', 'active'),
        supabase
          .from('partner_rental_subscriptions')
          .select('*')
          .eq('status', 'active')
      ]);

      return {
        activeDriverSubs: driverStats.data?.length || 0,
        activeRentalSubs: rentalStats.data?.length || 0,
        totalRevenue: [
          ...(driverStats.data || []),
          ...(rentalStats.data || [])
        ].reduce((sum, sub: any) => sum + (sub.amount || 0), 0)
      };
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Actif' },
      expired: { variant: 'destructive' as const, label: 'Expiré' },
      cancelled: { variant: 'secondary' as const, label: 'Annulé' },
      pending: { variant: 'outline' as const, label: 'En attente' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isExpiringSoon = (endDate: string) => {
    const daysUntilExpiry = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Chauffeurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeDriverSubs || 0}</div>
            <p className="text-xs text-muted-foreground">actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Location</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeRentalSubs || 0}</div>
            <p className="text-xs text-muted-foreground">actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.totalRevenue || 0).toLocaleString()} CDF</div>
            <p className="text-xs text-muted-foreground">ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...driverSubscriptions, ...rentalSubscriptions].filter(sub => 
                sub.status === 'active' && isExpiringSoon(sub.end_date)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">dans 7 jours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drivers" className="w-full">
        <TabsList>
          <TabsTrigger value="drivers">Abonnements Chauffeurs</TabsTrigger>
          <TabsTrigger value="rentals">Abonnements Location</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {driverSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold">Chauffeur ID: {subscription.driver_id}</h3>
                        {getStatusBadge(subscription.status)}
                        {subscription.status === 'active' && isExpiringSoon(subscription.end_date) && (
                          <Badge variant="outline" className="text-orange-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Expire bientôt
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span><strong>Plan ID:</strong> {subscription.plan_id}</span>
                        <span><strong>Début:</strong> {new Date(subscription.start_date).toLocaleDateString()}</span>
                        <span><strong>Fin:</strong> {new Date(subscription.end_date).toLocaleDateString()}</span>
                        <span><strong>Auto-renew:</strong> {subscription.auto_renew ? 'Oui' : 'Non'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rentals" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {rentalSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold">Partenaire ID: {subscription.partner_id}</h3>
                        {getStatusBadge(subscription.status)}
                        {subscription.status === 'active' && isExpiringSoon(subscription.end_date) && (
                          <Badge variant="outline" className="text-orange-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Expire bientôt
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span><strong>Véhicule ID:</strong> {subscription.vehicle_id}</span>
                        <span><strong>Plan ID:</strong> {subscription.plan_id}</span>
                        <span><strong>Début:</strong> {new Date(subscription.start_date).toLocaleDateString()}</span>
                        <span><strong>Fin:</strong> {new Date(subscription.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {driverSubscriptions.length === 0 && rentalSubscriptions.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Aucun abonnement trouvé</p>
              <p className="text-sm text-muted-foreground">
                Les abonnements apparaîtront ici une fois que les utilisateurs commenceront à s'abonner
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};