
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { usePartnerRentals, RentalVehicle } from "@/hooks/usePartnerRentals";
import RentalVehicleForm from "./RentalVehicleForm";
import RentalVehicleCard from "./RentalVehicleCard";
import PartnerBookingsList from "./PartnerBookingsList";
import { Plus, Car } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-heading-lg font-bold text-foreground">Gestion de flotte</h2>
          <p className="text-body-md text-muted-foreground">Gérez vos véhicules de location et taxis</p>
        </div>
      </div>

      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted p-1 h-auto">
          {/* Mobile: Stack tabs on small screens */}
          <TabsTrigger 
            value="vehicles" 
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm md:text-base px-2 md:px-4 py-2"
          >
            Location
          </TabsTrigger>
          <TabsTrigger 
            value="taxi"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm md:text-base px-2 md:px-4 py-2"
          >
            Taxis
          </TabsTrigger>
          <TabsTrigger 
            value="bookings"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-sm md:text-base px-2 md:px-4 py-2"
          >
            Réservations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setEditing(null); setCreating(true); }}
              className="rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> 
              Nouvelle annonce location
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <RentalVehicleCard key={v.id} vehicle={v} onEdit={setEditing} />
            ))}
            {vehicles.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
                  <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-body-md text-muted-foreground">Aucune annonce de location</p>
                  <p className="text-body-sm text-muted-foreground/70">Créez votre première annonce pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="taxi" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setEditingTaxi(null); setCreatingTaxi(true); }}
              className="rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> 
              Nouveau taxi
            </Button>
          </div>

          {creatingTaxi && (
            <TaxiVehicleForm onSaved={() => setCreatingTaxi(false)} />
          )}

          {editingTaxi && (
            <TaxiVehicleForm initial={editingTaxi} onSaved={() => setEditingTaxi(null)} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {taxiVehicles.map((v) => (
              <TaxiVehicleCard key={v.id} vehicle={v} onEdit={setEditingTaxi} />
            ))}
            {taxiVehicles.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
                  <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-body-md text-muted-foreground">Aucun taxi enregistré</p>
                  <p className="text-body-sm text-muted-foreground/70">Ajoutez votre premier véhicule taxi</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <PartnerBookingsList
            bookings={bookings}
            onUpdateStatus={(id, status) => updateBookingStatus.mutate({ id, status })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
