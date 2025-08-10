import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AdminDriverModeration } from './AdminDriverModeration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const AdminRentalModeration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pending } = useQuery<any[]>({
    queryKey: ['admin-rental-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_vehicles')
        .select(`
          *,
          partner_profiles!inner(
            company_name,
            contact_email,
            phone,
            id
          )
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: pendingTaxi } = useQuery<any[]>({
    queryKey: ['admin-taxi-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_taxi_vehicles')
        .select(`
          *,
          partner_profiles!inner(
            company_name,
            contact_email,
            phone,
            id
          )
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const moderateRental = useMutation({
    mutationFn: async ({ vehicleId, action }: { vehicleId: string; action: 'approve' | 'reject' }) => {
      const { data, error } = await supabase.functions.invoke('rental-moderation', {
        body: { action, vehicle_id: vehicleId, rejection_reason: action === 'reject' ? 'Informations insuffisantes' : null }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { action }) => {
      toast({
        title: action === 'approve' ? 'Véhicule approuvé' : 'Véhicule rejeté',
        description: `Le véhicule a été ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-rental-pending'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modération.',
        variant: 'destructive',
      });
      console.error('Moderation error:', error);
    }
  });

  const moderateTaxi = useMutation({
    mutationFn: async ({ vehicleId, action }: { vehicleId: string; action: 'approve' | 'reject' }) => {
      const { data, error } = await supabase.functions.invoke('taxi-moderation', {
        body: { action, vehicle_id: vehicleId, rejection_reason: action === 'reject' ? 'Informations insuffisantes' : null }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { action }) => {
      toast({
        title: action === 'approve' ? 'Taxi approuvé' : 'Taxi rejeté',
        description: `Le taxi a été ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-taxi-pending'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modération.',
        variant: 'destructive',
      });
      console.error('Moderation error:', error);
    }
  });

  return (
    <Tabs defaultValue="drivers" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="drivers">Chauffeurs</TabsTrigger>
        <TabsTrigger value="rental">Véhicules Location</TabsTrigger>
        <TabsTrigger value="taxi">Taxis Partenaires</TabsTrigger>
      </TabsList>

      <TabsContent value="drivers" className="space-y-6">
        <AdminDriverModeration />
      </TabsContent>

      <TabsContent value="rental" className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Modération des véhicules de location</h2>
            <Badge variant="secondary">{pending?.length || 0} en attente</Badge>
          </div>
          
          {!pending?.length ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Aucun véhicule en attente de modération</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((vehicle) => (
                <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{vehicle.name}</span>
                      <Badge variant="outline">En attente</Badge>
                    </CardTitle>
                  </CardHeader>
                   <CardContent className="space-y-4">
                     {vehicle.partner_profiles && (
                       <div className="p-3 bg-muted rounded-md">
                         <p className="text-sm font-medium text-primary">
                           Partenaire: {vehicle.partner_profiles.company_name}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {vehicle.partner_profiles.contact_email}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {vehicle.partner_profiles.phone}
                         </p>
                       </div>
                     )}
                     <div className="space-y-2 text-sm">
                       <p><strong>Marque:</strong> {vehicle.brand}</p>
                       <p><strong>Modèle:</strong> {vehicle.model}</p>
                       <p><strong>Année:</strong> {vehicle.year}</p>
                       <p><strong>Classe:</strong> {vehicle.vehicle_class}</p>
                       <p><strong>Places:</strong> {vehicle.seats}</p>
                       <p><strong>Plaque:</strong> {vehicle.license_plate}</p>
                       {vehicle.price && (
                         <p><strong>Prix:</strong> {vehicle.price} CDF/jour</p>
                       )}
                     </div>
                     {vehicle.images && vehicle.images.length > 0 && (
                       <div className="mt-2">
                         <img 
                           src={vehicle.images[0]} 
                           alt={vehicle.name}
                           className="w-full h-32 object-cover rounded-md"
                         />
                       </div>
                     )}
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => moderateRental.mutate({ vehicleId: vehicle.id, action: 'reject' })}
                        disabled={moderateRental.isPending}
                      >
                        Rejeter
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => moderateRental.mutate({ vehicleId: vehicle.id, action: 'approve' })}
                        disabled={moderateRental.isPending}
                      >
                        Approuver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="taxi" className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Modération des taxis partenaires</h2>
            <Badge variant="secondary">{pendingTaxi?.length || 0} en attente</Badge>
          </div>
          
          {!pendingTaxi?.length ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Aucun taxi en attente de modération</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingTaxi.map((vehicle) => (
                <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{vehicle.name}</span>
                      <Badge variant="outline">En attente</Badge>
                    </CardTitle>
                  </CardHeader>
                   <CardContent className="space-y-4">
                     {vehicle.partner_profiles && (
                       <div className="p-3 bg-muted rounded-md">
                         <p className="text-sm font-medium text-primary">
                           Partenaire: {vehicle.partner_profiles.company_name}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {vehicle.partner_profiles.contact_email}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           {vehicle.partner_profiles.phone}
                         </p>
                       </div>
                     )}
                     <div className="space-y-2 text-sm">
                       <p><strong>Marque:</strong> {vehicle.brand}</p>
                       <p><strong>Modèle:</strong> {vehicle.model}</p>
                       <p><strong>Année:</strong> {vehicle.year}</p>
                       <p><strong>Classe:</strong> {vehicle.vehicle_class}</p>
                       <p><strong>Places:</strong> {vehicle.seats}</p>
                       <p><strong>Plaque:</strong> {vehicle.license_plate}</p>
                     </div>
                     {vehicle.images && vehicle.images.length > 0 && (
                       <div className="mt-2">
                         <img 
                           src={vehicle.images[0]} 
                           alt={vehicle.name}
                           className="w-full h-32 object-cover rounded-md"
                         />
                       </div>
                     )}
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => moderateTaxi.mutate({ vehicleId: vehicle.id, action: 'reject' })}
                        disabled={moderateTaxi.isPending}
                      >
                        Rejeter
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => moderateTaxi.mutate({ vehicleId: vehicle.id, action: 'approve' })}
                        disabled={moderateTaxi.isPending}
                      >
                        Approuver
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};