
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import { RentalVehicle, usePartnerRentals } from "@/hooks/usePartnerRentals";

interface Props {
  vehicle: RentalVehicle;
  onEdit: (v: RentalVehicle) => void;
}

export default function RentalVehicleCard({ vehicle, onEdit }: Props) {
  const { updateVehicle, deleteVehicle } = usePartnerRentals();

  const statusColor =
    vehicle.moderation_status === "approved"
      ? "bg-green-100 text-green-700"
      : vehicle.moderation_status === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <Card className="hover:shadow-md transition">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{vehicle.name}</h3>
              <Badge className={statusColor}>{vehicle.moderation_status}</Badge>
              {!vehicle.is_active && <Badge variant="secondary">inactif</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {vehicle.brand} {vehicle.model} • {vehicle.year} • {vehicle.seats} places
            </p>
            <p className="text-sm text-primary mt-1">
              {vehicle.daily_rate.toLocaleString()} FC / jour • Caution {vehicle.security_deposit.toLocaleString()} FC
            </p>
            {vehicle.moderation_status === "rejected" && vehicle.rejection_reason && (
              <p className="text-xs text-red-600 mt-1">Motif: {vehicle.rejection_reason}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Disponible</span>
              <Switch
                checked={vehicle.is_available}
                onCheckedChange={(val) => updateVehicle.mutate({ id: vehicle.id, updates: { is_available: val } })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(vehicle)}>
                <Pencil className="w-4 h-4 mr-1" /> Éditer
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteVehicle.mutate(vehicle.id)}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Supprimer
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Actif</span>
              <Switch
                checked={vehicle.is_active}
                onCheckedChange={(val) => updateVehicle.mutate({ id: vehicle.id, updates: { is_active: val } })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
