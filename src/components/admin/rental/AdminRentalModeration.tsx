import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, CheckCircle, XCircle, Car, Calendar, MapPin } from 'lucide-react';

export const AdminRentalModeration = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch véhicules avec filtres
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['rental-vehicles-moderation', statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('partner_rental_vehicles')
        .select(`
          *,
          partenaires!partner_rental_vehicles_partner_id_fkey (
            company_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('moderation_status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`vehicle_name.ilike.%${searchTerm}%,license_plate.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000
  });

  // Mutation pour approuver un véhicule
  const approveMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const { error } = await supabase
        .from('partner_rental_vehicles')
        .update({
          moderation_status: 'approved',
          is_active: true,
          moderated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-vehicles-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rental-stats'] });
      toast({
        title: 'Véhicule approuvé',
        description: 'Le véhicule a été approuvé avec succès',
      });
      setSelectedVehicle(null);
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'approbation du véhicule',
        variant: 'destructive',
      });
      console.error(error);
    }
  });

  // Mutation pour rejeter un véhicule
  const rejectMutation = useMutation({
    mutationFn: async ({ vehicleId, reason }: { vehicleId: string; reason: string }) => {
      const { error } = await supabase
        .from('partner_rental_vehicles')
        .update({
          moderation_status: 'rejected',
          is_active: false,
          rejection_reason: reason,
          moderated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-vehicles-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['admin-rental-stats'] });
      toast({
        title: 'Véhicule rejeté',
        description: 'Le véhicule a été rejeté',
      });
      setSelectedVehicle(null);
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors du rejet du véhicule',
        variant: 'destructive',
      });
      console.error(error);
    }
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'secondary' as const, label: '⏳ En attente', color: 'text-orange-600' },
      approved: { variant: 'default' as const, label: '✅ Approuvé', color: 'text-green-600' },
      rejected: { variant: 'destructive' as const, label: '❌ Rejeté', color: 'text-red-600' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou plaque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des véhicules */}
      <Card>
        <CardHeader>
          <CardTitle>Véhicules à modérer</CardTitle>
          <CardDescription>
            {vehicles?.length || 0} véhicule(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : vehicles && vehicles.length > 0 ? (
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-lg">{vehicle.vehicle_name}</h4>
                      {getStatusBadge(vehicle.moderation_status || 'pending')}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Partenaire:</span>
                        <span>{vehicle.partenaires?.company_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Plaque:</span>
                        <span className="font-mono">{vehicle.license_plate || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{vehicle.location || 'Non spécifié'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(vehicle.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Prix/jour:</span> {vehicle.daily_rate} CDF
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {vehicle.moderation_status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => approveMutation.mutate(vehicle.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => rejectMutation.mutate({ 
                            vehicleId: vehicle.id, 
                            reason: 'Documents incomplets' 
                          })}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun véhicule trouvé
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog détails véhicule */}
      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du véhicule</DialogTitle>
            <DialogDescription>
              Informations complètes du véhicule
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Nom du véhicule</p>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.vehicle_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Plaque d'immatriculation</p>
                  <p className="text-sm text-muted-foreground font-mono">{selectedVehicle.license_plate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Prix journalier</p>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.daily_rate} CDF</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Localisation</p>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Partenaire</p>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.partenaires?.company_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Statut</p>
                  {getStatusBadge(selectedVehicle.moderation_status)}
                </div>
              </div>
              
              {selectedVehicle.rejection_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Raison du rejet</p>
                  <p className="text-sm text-red-700">{selectedVehicle.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};