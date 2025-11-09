import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePartnerRentals, RentalVehicle } from "@/hooks/usePartnerRentals";
import RentalVehicleForm from "./RentalVehicleForm";
import RentalVehicleCard from "./RentalVehicleCard";
import PartnerBookingsList from "./PartnerBookingsList";
import { Plus, Car, Clock } from "lucide-react";
import { usePartnerTaxiVehicles, TaxiVehicle } from "@/hooks/usePartnerTaxiVehicles";
import TaxiVehicleForm from "@/components/partner/taxi/TaxiVehicleForm";
import TaxiVehicleCard from "@/components/partner/taxi/TaxiVehicleCard";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PartnerRentalManager() {
  const { categories, vehicles, bookings, updateBookingStatus } = usePartnerRentals();
  const { vehicles: taxiVehicles } = usePartnerTaxiVehicles();
  const isMobile = useIsMobile();

  const [editing, setEditing] = useState<RentalVehicle | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingTaxi, setEditingTaxi] = useState<TaxiVehicle | null>(null);
  const [creatingTaxi, setCreatingTaxi] = useState(false);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className={`grid w-full grid-cols-3 rounded-2xl bg-grey-50 border border-grey-100 p-1 ${isMobile ? 'h-12' : 'h-14'} shadow-sm`}>
          <TabsTrigger 
            value="vehicles" 
            className={`rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 font-medium ${isMobile ? 'text-xs px-2 py-1.5' : 'text-sm px-4 py-2'} hover:bg-background/50`}
          >
            🏠 Location
          </TabsTrigger>
          <TabsTrigger 
            value="taxi"
            className={`rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 font-medium ${isMobile ? 'text-xs px-2 py-1.5' : 'text-sm px-4 py-2'} hover:bg-background/50`}
          >
            🚗 Taxis
          </TabsTrigger>
          <TabsTrigger 
            value="bookings"
            className={`rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 font-medium ${isMobile ? 'text-xs px-2 py-1.5' : 'text-sm px-4 py-2'} hover:bg-background/50`}
          >
            📋 Réservations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles" className="space-y-4 mt-4">
          {/* Alert véhicules en attente */}
          {vehicles.filter(v => v.moderation_status === 'pending').length > 0 && (
            <Card className="bg-yellow-50 border-yellow-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-800">
                      {vehicles.filter(v => v.moderation_status === 'pending').length} véhicule(s) en attente de validation
                    </p>
                    <p className="text-sm text-yellow-700">
                      Vos annonces seront visibles aux clients après validation par l'admin
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
            <Button 
              onClick={() => { setEditing(null); setCreating(true); }}
              className={`rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary-glow hover:to-primary hover:shadow-elegant transition-all duration-300 font-medium ${isMobile ? 'w-full max-w-sm px-6 py-3' : 'px-6 py-2.5'} shadow-md`}
            >
              <Plus className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-4 h-4 mr-2'}`} /> 
              {isMobile ? '+ Nouvelle annonce' : 'Nouvelle annonce location'}
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

          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {vehicles.map((v) => (
              <RentalVehicleCard key={v.id} vehicle={v} onEdit={setEditing} />
            ))}
            {vehicles.length === 0 && (
              <div className="col-span-full">
                <div className={`text-center bg-gradient-to-br from-grey-50 to-background rounded-3xl border-2 border-dashed border-grey-200 transition-all duration-300 hover:border-primary/30 ${isMobile ? 'py-8 px-4' : 'py-12 px-6'}`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Car className="w-8 h-8 text-primary" />
                  </div>
                  <p className={`text-card-foreground font-medium mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>Aucune annonce de location</p>
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>Créez votre première annonce pour commencer</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="taxi" className="space-y-4 mt-4">
          <div className={`flex ${isMobile ? 'justify-center' : 'justify-end'}`}>
            <Button 
              onClick={() => { setEditingTaxi(null); setCreatingTaxi(true); }}
              className={`rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary-glow hover:to-primary hover:shadow-elegant transition-all duration-300 font-medium ${isMobile ? 'w-full max-w-sm px-6 py-3' : 'px-6 py-2.5'} shadow-md`}
            >
              <Plus className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-4 h-4 mr-2'}`} /> 
              {isMobile ? '+ Nouveau taxi' : 'Nouveau taxi'}
            </Button>
          </div>

          {creatingTaxi && (
            <TaxiVehicleForm onSaved={() => setCreatingTaxi(false)} />
          )}

          {editingTaxi && (
            <TaxiVehicleForm initial={editingTaxi} onSaved={() => setEditingTaxi(null)} />
          )}

          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {taxiVehicles.map((v) => (
              <TaxiVehicleCard key={v.id} vehicle={v} onEdit={setEditingTaxi} />
            ))}
            {taxiVehicles.length === 0 && (
              <div className="col-span-full">
                <div className={`text-center bg-gradient-to-br from-grey-50 to-background rounded-3xl border-2 border-dashed border-grey-200 transition-all duration-300 hover:border-primary/30 ${isMobile ? 'py-8 px-4' : 'py-12 px-6'}`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Car className="w-8 h-8 text-primary" />
                  </div>
                  <p className={`text-card-foreground font-medium mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>Aucun taxi enregistré</p>
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>Ajoutez votre premier véhicule taxi</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <PartnerBookingsList
            bookings={bookings}
            onUpdateStatus={(id, status) => updateBookingStatus.mutate({ id, status })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
