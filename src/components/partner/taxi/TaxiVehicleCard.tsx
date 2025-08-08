
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaxiVehicle, usePartnerTaxiVehicles } from "@/hooks/usePartnerTaxiVehicles";

export default function TaxiVehicleCard({
  vehicle,
  onEdit,
}: {
  vehicle: TaxiVehicle;
  onEdit: (v: TaxiVehicle) => void;
}) {
  const { deleteVehicle } = usePartnerTaxiVehicles();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce taxi ?")) return;
    await deleteVehicle.mutateAsync(vehicle.id);
    toast({ title: "Taxi supprimé avec succès" });
  };

  const statusColor =
    vehicle.moderation_status === "approved"
      ? "bg-green-100 text-green-700"
      : vehicle.moderation_status === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <Card className="rounded-2xl border-0 shadow-sm hover:shadow-elegant transition-all duration-300 bg-card">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-heading-sm font-bold text-foreground">{vehicle.name}</h3>
              <Badge className={`${statusColor} rounded-lg font-medium`}>
                {vehicle.moderation_status === 'approved' ? '✓ Approuvé' : 
                 vehicle.moderation_status === 'rejected' ? '✗ Rejeté' : 
                 '⏳ En attente'}
              </Badge>
              {!vehicle.is_active && <Badge variant="secondary" className="rounded-lg">Inactif</Badge>}
            </div>
            
            <p className="text-body-sm text-muted-foreground mb-1">
              {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.seats} places
            </p>
            
            <div className="flex items-center gap-4 text-body-sm text-muted-foreground">
              <span>Classe: {vehicle.vehicle_class?.toUpperCase?.()}</span>
              <span>Couleur: {vehicle.color || "—"}</span>
            </div>
            
            <p className="text-body-sm text-muted-foreground mt-1">
              📋 {vehicle.license_plate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(vehicle)}
              className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" /> Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Supprimer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
