/**
 * 🚗 Dialog d'assignation de chauffeur à un véhicule
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePartnerDrivers } from '@/hooks/usePartnerDrivers';
import { User, UserCheck } from 'lucide-react';

interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleName: string;
  currentDriverId?: string | null;
  onAssign: (driverId: string | null) => Promise<void>;
}

export const VehicleAssignmentDialog = ({
  open,
  onOpenChange,
  vehicleId,
  vehicleName,
  currentDriverId,
  onAssign
}: VehicleAssignmentDialogProps) => {
  const { drivers, loading } = usePartnerDrivers();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(currentDriverId || null);
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await onAssign(selectedDriverId);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur assignation:', error);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner un chauffeur</DialogTitle>
          <DialogDescription>
            Choisissez un chauffeur pour le véhicule {vehicleName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélection du chauffeur */}
          <div className="space-y-3">
            <Label htmlFor="driver">Chauffeur</Label>
            <Select
              value={selectedDriverId || 'none'}
              onValueChange={(value) => setSelectedDriverId(value === 'none' ? null : value)}
              disabled={loading}
            >
              <SelectTrigger id="driver">
                <SelectValue placeholder="Sélectionner un chauffeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>Aucun chauffeur (retirer l'assignation)</span>
                  </div>
                </SelectItem>
                {drivers.filter(d => d.status === 'active').map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium">{driver.driver_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Code: {driver.driver_code}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {drivers.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground">
                Aucun chauffeur dans votre flotte. Ajoutez des chauffeurs d'abord.
              </p>
            )}
          </div>

          {/* Info */}
          {currentDriverId && selectedDriverId !== currentDriverId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Le chauffeur actuellement assigné sera remplacé par votre sélection.
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assigning}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assigning || loading}
              className="flex-1"
            >
              {assigning ? 'Assignation...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};