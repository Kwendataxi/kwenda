import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Car, Bike, Edit, GripVertical } from 'lucide-react';
import { useVehicleTypeManagement, VehicleTypeData } from '@/hooks/admin/useVehicleTypeManagement';
import { EditVehicleTypeDialog } from './EditVehicleTypeDialog';
import { Skeleton } from '@/components/ui/skeleton';

export const VehicleTypeManager = () => {
  const { vehicleTypes, isLoading, updateVehicleType, toggleVehicleActive } = useVehicleTypeManagement();
  const [editingVehicle, setEditingVehicle] = useState<VehicleTypeData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getIcon = (serviceType: string) => {
    if (serviceType === 'taxi_moto') return Bike;
    return Car;
  };

  const handleEdit = (vehicle: VehicleTypeData) => {
    setEditingVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleSave = (updates: Partial<VehicleTypeData> & { id: string }) => {
    updateVehicleType.mutate(updates);
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleVehicleActive.mutate({ id, is_active: !currentStatus });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Types de Véhicules Taxi</CardTitle>
          <CardDescription>
            Configurez les types de véhicules disponibles pour le service taxi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehicleTypes?.map((vehicle) => {
              const Icon = getIcon(vehicle.service_type);
              
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Drag handle */}
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{vehicle.display_name}</h3>
                      {vehicle.is_active ? (
                        <Badge variant="default" className="text-xs animate-pulse">Actif</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactif</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.description}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Base: {vehicle.base_price} CDF</span>
                      <span>Par km: {vehicle.price_per_km} CDF</span>
                      <span>Minimum: {vehicle.minimum_fare} CDF</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={vehicle.is_active}
                      onCheckedChange={() => handleToggleActive(vehicle.id, vehicle.is_active)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(vehicle)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <EditVehicleTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicleType={editingVehicle}
        onSave={handleSave}
      />
    </>
  );
};
