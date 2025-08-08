
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    if (!confirm("Supprimer ce véhicule taxi ?")) return;
    await deleteVehicle.mutateAsync(vehicle.id);
    toast({ title: "Véhicule supprimé" });
  };

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{vehicle.name}</h3>
            <Badge variant="secondary">
              {vehicle.brand} {vehicle.model} • {vehicle.year}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {vehicle.vehicle_class?.toUpperCase?.()} • {vehicle.seats} places • {vehicle.color || "—"}
          </p>
          <p className="text-xs text-muted-foreground">Immatriculation: {vehicle.license_plate}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant={vehicle.moderation_status === "approved" ? "default" : vehicle.moderation_status === "pending" ? "secondary" : "destructive"}>
              {vehicle.moderation_status}
            </Badge>
            {vehicle.is_active ? <Badge>Actif</Badge> : <Badge variant="outline">Inactif</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(vehicle)}>Modifier</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>Supprimer</Button>
        </div>
      </CardContent>
    </Card>
  );
}
