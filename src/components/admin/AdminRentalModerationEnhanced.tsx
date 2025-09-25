import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Car, Truck, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface RentalVehicle {
  id: string;
  name?: string;
  brand: string;
  model: string;
  year: number;
  daily_rate: number;
  partner_id: string;
  moderation_status: string;
  is_active: boolean;
  created_at: string;
  partenaires: any;
}

interface TaxiVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  partner_id: string;
  moderation_status: string;
  is_active: boolean;
  created_at: string;
  partenaires: any;
}

export default function AdminRentalModerationEnhanced() {
  const queryClient = useQueryClient();

  // Fetch pending rental vehicles
  const { data: pendingRentals, isLoading: loadingRentals } = useQuery({
    queryKey: ['admin-pending-rentals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_vehicles')
        .select(`
          *,
          partenaires!inner(company_name, display_name, phone_number)
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RentalVehicle[];
    }
  });

  // Fetch pending taxi vehicles
  const { data: pendingTaxis, isLoading: loadingTaxis } = useQuery({
    queryKey: ['admin-pending-taxis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_taxi_vehicles')
        .select(`
          *,
          partenaires!inner(company_name, display_name, phone_number)
        `)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TaxiVehicle[];
    }
  });

  // Moderation mutations
  const moderateRental = useMutation({
    mutationFn: async ({ vehicleId, action, reason }: { vehicleId: string, action: 'approve' | 'reject', reason?: string }) => {
      const { data, error } = await supabase.functions.invoke('rental-moderation', {
        body: { vehicleId, action, reason }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-rentals'] });
      toast.success('Décision de modération enregistrée');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la modération');
    }
  });

  const moderateTaxi = useMutation({
    mutationFn: async ({ vehicleId, action, reason }: { vehicleId: string, action: 'approve' | 'reject', reason?: string }) => {
      const { data, error } = await supabase.functions.invoke('taxi-moderation', {
        body: { vehicleId, action, reason }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-taxis'] });
      toast.success('Décision de modération enregistrée');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la modération');
    }
  });

  const handleRentalAction = (vehicleId: string, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? prompt('Raison du rejet (optionnel):') : undefined;
    moderateRental.mutate({ vehicleId, action, reason: reason || undefined });
  };

  const handleTaxiAction = (vehicleId: string, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? prompt('Raison du rejet (optionnel):') : undefined;
    moderateTaxi.mutate({ vehicleId, action, reason: reason || undefined });
  };

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'taxi':
      case 'berline':
        return <Car className="h-5 w-5" />;
      case 'suv':
      case 'pickup':
        return <Truck className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const renderRentalCard = (vehicle: RentalVehicle) => (
    <Card key={vehicle.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          {getVehicleIcon(vehicle.brand)}
          {vehicle.name || `${vehicle.brand} ${vehicle.model}`}
        </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Véhicule</p>
            <p className="font-medium">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
            <p className="text-sm text-muted-foreground mt-1">Type: {vehicle.vehicle_type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Partenaire</p>
            <p className="font-medium">{vehicle.partenaires.company_name}</p>
            <p className="text-sm text-muted-foreground">{vehicle.partenaires.phone_number}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-primary">
              {vehicle.daily_rate.toLocaleString()} CDF/jour
            </p>
            <p className="text-xs text-muted-foreground">
              Soumis le {new Date(vehicle.created_at).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleRentalAction(vehicle.id, 'reject')}
              disabled={moderateRental.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeter
            </Button>
            <Button
              size="sm"
              onClick={() => handleRentalAction(vehicle.id, 'approve')}
              disabled={moderateRental.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approuver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTaxiCard = (vehicle: TaxiVehicle) => (
    <Card key={vehicle.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          {getVehicleIcon(vehicle.brand)}
          {vehicle.brand} {vehicle.model}
        </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Véhicule</p>
            <p className="font-medium">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
            <p className="text-sm text-muted-foreground">Couleur: {vehicle.color}</p>
            <p className="text-sm text-muted-foreground">Plaque: {vehicle.license_plate}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Partenaire</p>
            <p className="font-medium">{vehicle.partenaires.company_name}</p>
            <p className="text-sm text-muted-foreground">{vehicle.partenaires.phone_number}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Soumis le {new Date(vehicle.created_at).toLocaleDateString()}
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleTaxiAction(vehicle.id, 'reject')}
              disabled={moderateTaxi.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeter
            </Button>
            <Button
              size="sm"
              onClick={() => handleTaxiAction(vehicle.id, 'approve')}
              disabled={moderateTaxi.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approuver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Modération Véhicules</h2>
        <p className="text-muted-foreground">
          Approuver ou rejeter les véhicules soumis par les partenaires
        </p>
      </div>

      <Tabs defaultValue="rental" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rental" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Location ({pendingRentals?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="taxi" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Taxi ({pendingTaxis?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rental" className="space-y-4">
          {loadingRentals ? (
            <div className="text-center py-8">Chargement...</div>
          ) : pendingRentals?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun véhicule de location en attente</p>
              </CardContent>
            </Card>
          ) : (
            pendingRentals?.map(renderRentalCard)
          )}
        </TabsContent>

        <TabsContent value="taxi" className="space-y-4">
          {loadingTaxis ? (
            <div className="text-center py-8">Chargement...</div>
          ) : pendingTaxis?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun taxi en attente</p>
              </CardContent>
            </Card>
          ) : (
            pendingTaxis?.map(renderTaxiCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}