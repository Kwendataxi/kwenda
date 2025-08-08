
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TaxiVehicle, usePartnerTaxiVehicles } from "@/hooks/usePartnerTaxiVehicles";

interface Props {
  initial?: Partial<TaxiVehicle>;
  onSaved?: () => void;
}

export default function TaxiVehicleForm({ initial, onSaved }: Props) {
  const { createVehicle, updateVehicle } = usePartnerTaxiVehicles();
  const { toast } = useToast();

  const [values, setValues] = useState<Partial<TaxiVehicle>>({
    name: initial?.name || "",
    brand: initial?.brand || "",
    model: initial?.model || "",
    year: initial?.year || new Date().getFullYear(),
    vehicle_class: (initial?.vehicle_class as any) || "standard",
    color: initial?.color || "",
    seats: initial?.seats || 4,
    images: initial?.images || [],
    license_plate: initial?.license_plate || "",
  });

  const isEditing = !!initial?.id;

  const handleChange = (key: keyof TaxiVehicle, v: any) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const handleSubmit = async () => {
    if (!values.name || !values.brand || !values.model || !values.license_plate) {
      toast({ title: "Champs requis manquants", description: "Nom, Marque, Modèle et Immatriculation sont requis", variant: "destructive" });
      return;
    }

    const payload: Partial<TaxiVehicle> = {
      ...values,
      images: (values.images || []) as string[],
      is_active: true,
      is_available: true,
      moderation_status: "pending",
    };

    if (isEditing && initial?.id) {
      await updateVehicle.mutateAsync({ id: initial.id, updates: payload });
      toast({ title: "Véhicule taxi mis à jour" });
    } else {
      await createVehicle.mutateAsync(payload);
      toast({ title: "Taxi ajouté (en attente de validation)" });
    }

    onSaved?.();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Nom</label>
            <Input className="mt-1" value={values.name as string} onChange={(e) => handleChange("name", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Marque</label>
            <Input className="mt-1" value={values.brand as string} onChange={(e) => handleChange("brand", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Modèle</label>
            <Input className="mt-1" value={values.model as string} onChange={(e) => handleChange("model", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Année</label>
            <Input type="number" className="mt-1" value={values.year as number} onChange={(e) => handleChange("year", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium">Classe véhicule</label>
            <Select value={values.vehicle_class as any} onValueChange={(v) => handleChange("vehicle_class", v as any)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moto">Moto</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="bus">Bus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Couleur</label>
            <Input className="mt-1" value={values.color as string} onChange={(e) => handleChange("color", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Places</label>
            <Input type="number" className="mt-1" value={values.seats as number} onChange={(e) => handleChange("seats", Number(e.target.value))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Immatriculation</label>
            <Input className="mt-1" value={values.license_plate as string} onChange={(e) => handleChange("license_plate", e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <label className="text-sm font-medium">Images (URLs séparées par des virgules)</label>
            <Input
              className="mt-1"
              value={(values.images as string[])?.join(", ") || ""}
              onChange={(e) =>
                handleChange(
                  "images",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-primary-glow text-white">
            {isEditing ? "Mettre à jour" : "Ajouter le taxi"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
