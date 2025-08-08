
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { usePartnerRentals, RentalVehicle } from "@/hooks/usePartnerRentals";
import RentalVehicleForm from "./RentalVehicleForm";
import RentalVehicleCard from "./RentalVehicleCard";
import PartnerBookingsList from "./PartnerBookingsList";
import { Plus } from "lucide-react";
import { usePartnerTaxiVehicles, TaxiVehicle } from "@/hooks/usePartnerTaxiVehicles";
import TaxiVehicleForm from "@/components/partner/taxi/TaxiVehicleForm";
import TaxiVehicleCard from "@/components/partner/taxi/TaxiVehicleCard";

export default function PartnerRentalManager() {
  const { categories, vehicles, bookings, updateBookingStatus } = usePartnerRentals();
  const { vehicles: taxiVehicles } = usePartnerTaxiVehicles();

  const [editing, setEditing] = useState<RentalVehicle | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingTaxi, setEditingTaxi] = useState<TaxiVehicle | null>(null);
  const [creatingTaxi, setCreatingTaxi] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gestion de flotte (Location & Taxi)</h2>
      </div>

      <Tabs defaultValue="vehicles">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vehicles">Mes véhicules (Location)</TabsTrigger>
          <TabsTrigger value="taxi">Taxis</TabsTrigger>
          <TabsTrigger value="bookings">Réservations</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditing(null); setCreating(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Nouvelle annonce (Location)
            </Button>
          </div>

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
                Aucune annonce de location encore. Créez votre première annonce.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="taxi" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingTaxi(null); setCreatingTaxi(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Nouveau taxi
            </Button>
          </div>

          {creatingTaxi && (
            <TaxiVehicleForm onSaved={() => setCreatingTaxi(false)} />
          )}

          {editingTaxi && (
            <TaxiVehicleForm initial={editingTaxi} onSaved={() => setEditingTaxi(null)} />
          )}

          <div className="grid grid-cols-1 gap-3">
            {taxiVehicles.map((v) => (
              <TaxiVehicleCard key={v.id} vehicle={v} onEdit={setEditingTaxi} />
            ))}
            {taxiVehicles.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                Aucun taxi encore. Ajoutez votre premier véhicule taxi.
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
