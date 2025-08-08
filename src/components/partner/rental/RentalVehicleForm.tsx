import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { usePartnerRentals, VehicleCategory, RentalVehicle } from "@/hooks/usePartnerRentals";
import { useToast } from "@/hooks/use-toast";

interface Props {
  categories: VehicleCategory[];
  initial?: Partial<RentalVehicle>;
  onSaved?: () => void;
}

const defaultRates = { hourly_rate: 5000, daily_rate: 50000, weekly_rate: 300000, security_deposit: 50000 };

export default function RentalVehicleForm({ categories, initial, onSaved }: Props) {
  const { createVehicle, updateVehicle } = usePartnerRentals();
  const { toast } = useToast();

  const [values, setValues] = useState<Partial<RentalVehicle>>({
    name: initial?.name || "",
    brand: initial?.brand || "",
    model: initial?.model || "",
    year: initial?.year || new Date().getFullYear(),
    vehicle_type: initial?.vehicle_type || "car",
    fuel_type: initial?.fuel_type || "essence",
    transmission: initial?.transmission || "manuel",
    seats: initial?.seats || 4,
    category_id: initial?.category_id,
    ...defaultRates,
    daily_rate: initial?.daily_rate ?? defaultRates.daily_rate,
    hourly_rate: initial?.hourly_rate ?? defaultRates.hourly_rate,
    weekly_rate: initial?.weekly_rate ?? defaultRates.weekly_rate,
    security_deposit: initial?.security_deposit ?? defaultRates.security_deposit,
    features: initial?.features || [],
    images: initial?.images || [],
    license_plate: initial?.license_plate || "",
    location_address: initial?.location_address || "",
  });

  const isEditing = !!initial?.id;

  const handleChange = (key: keyof RentalVehicle, v: any) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const handleSubmit = async () => {
    const payload = {
      ...values,
      features: (values.features || []) as string[],
      images: (values.images || []) as string[],
      moderation_status: "pending",
      is_active: true,
      is_available: true,
    } as Partial<RentalVehicle>;

    if (!payload.category_id) {
      toast({ title: "Catégorie requise", variant: "destructive" });
      return;
    }
    if (!payload.name || !payload.brand || !payload.model) {
      toast({ title: "Nom/Marque/Modèle requis", variant: "destructive" });
      return;
    }

    if (isEditing && initial?.id) {
      await updateVehicle.mutateAsync({ id: initial.id, updates: payload });
      toast({ title: "Annonce mise à jour" });
    } else {
      await createVehicle.mutateAsync(payload);
      toast({ title: "Annonce créée (en attente de validation)" });
    }

    onSaved?.();
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const uploads: string[] = [];
    const { data: userData } = await window.supabase.auth.getUser(); // fallback if global; else use client directly
    // Prefer client import for robust behavior:
    // but keep minimal: we will import supabase here:
  };

  return (
    <Card className="rounded-2xl border-0 shadow-elegant bg-card">
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-sm font-medium">Catégorie</label>
            <Select value={values.category_id} onValueChange={(v) => handleChange("category_id" as any, v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            <Input
              type="number"
              className="mt-1"
              value={values.year as number}
              onChange={(e) => handleChange("year", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={values.vehicle_type as string} onValueChange={(v) => handleChange("vehicle_type", v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moto">Moto</SelectItem>
                <SelectItem value="car">Voiture</SelectItem>
                <SelectItem value="utility">Utilitaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Carburant</label>
            <Input className="mt-1" value={values.fuel_type as string} onChange={(e) => handleChange("fuel_type", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Transmission</label>
            <Input className="mt-1" value={values.transmission as string} onChange={(e) => handleChange("transmission", e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Places</label>
            <Input
              type="number"
              className="mt-1"
              value={values.seats as number}
              onChange={(e) => handleChange("seats", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tarif (heure)</label>
            <Input
              type="number"
              className="mt-1"
              value={values.hourly_rate as number}
              onChange={(e) => handleChange("hourly_rate", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tarif (jour)</label>
            <Input
              type="number"
              className="mt-1"
              value={values.daily_rate as number}
              onChange={(e) => handleChange("daily_rate", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tarif (semaine)</label>
            <Input
              type="number"
              className="mt-1"
              value={values.weekly_rate as number}
              onChange={(e) => handleChange("weekly_rate", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Caution</label>
            <Input
              type="number"
              className="mt-1"
              value={values.security_deposit as number}
              onChange={(e) => handleChange("security_deposit", Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Adresse du véhicule</label>
            <Input
              className="mt-1"
              value={values.location_address as string}
              onChange={(e) => handleChange("location_address", e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-sm font-medium">Caractéristiques (séparées par des virgules)</label>
            <Input
              className="mt-1"
              value={(values.features as string[])?.join(", ") || ""}
              onChange={(e) =>
                handleChange(
                  "features",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onSaved?.()}
            className="rounded-xl"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
          >
            {isEditing ? "Mettre à jour" : "Publier l'annonce"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
