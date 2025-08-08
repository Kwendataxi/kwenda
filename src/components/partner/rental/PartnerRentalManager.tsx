
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { usePartnerRentals, RentalVehicle } from "@/hooks/usePartnerRentals";
import RentalVehicleForm from "./RentalVehicleForm";
import RentalVehicleCard from "./RentalVehicleCard";
import PartnerBookingsList from "./PartnerBookingsList";
import { Plus } from "lucide-react";

export default function PartnerRentalManager() {
  const { categories, vehicles, bookings, updateBookingStatus } = usePartnerRentals();
  const [editing, setEditing] = useState<RentalVehicle | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Location de véhicules (Partenaire)</h2>
        <Button onClick={() => { setEditing(null); setCreating(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Nouvelle annonce
        </Button>
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vehicles">Mes véhicules</TabsTrigger>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          {creating && (
            <RentalVehicleForm
              categories={categories}
              onSaved={() => { setCreating(false); }}
            />
          )}

          {editing && (
            <RentalVehicleForm
              categories={categories}
              initial={editing}
              onSaved={() => setEditing(null)}
            />
          )}

          <div className="grid grid-cols-1 gap-3">
            {vehicles.map((v) => (
              <RentalVehicleCard key={v.id} vehicle={v} onEdit={setEditing} />
            ))}
            {vehicles.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                Aucune annonce encore. Créez votre première annonce de location.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <PartnerBookingsList
            bookings={bookings}
            onUpdateStatus={(id, status) => updateBookingStatus.mutate({ id, status })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
