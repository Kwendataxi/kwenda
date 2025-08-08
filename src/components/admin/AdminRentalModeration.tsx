
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function AdminRentalModeration() {
  const { toast } = useToast();

  // Pending Location (rental) vehicles
  const pendingQuery = useQuery<any[]>({
    queryKey: ["admin-rental-pending"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("rental_vehicles")
        .select("*")
        .eq("moderation_status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Pending Taxi vehicles
  const pendingTaxiQuery = useQuery<any[]>({
    queryKey: ["admin-taxi-pending"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("partner_taxi_vehicles")
        .select("*")
        .eq("moderation_status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const moderateRental = async (vehicleId: string, action: "approve" | "reject") => {
    const rejection_reason = action === "reject" ? "Informations insuffisantes" : undefined;
    const { data, error } = await supabase.functions.invoke("rental-moderation", {
      body: { action, vehicle_id: vehicleId, rejection_reason },
    });
    if (error) {
      console.error("Moderation error", error);
      toast({ title: "Erreur de modération (Location)", variant: "destructive" });
      return;
    }
    if (data?.success) {
      toast({ title: action === "approve" ? "Annonce approuvée (Location)" : "Annonce rejetée (Location)" });
      pendingQuery.refetch();
    }
  };

  const moderateTaxi = async (vehicleId: string, action: "approve" | "reject") => {
    const rejection_reason = action === "reject" ? "Informations insuffisantes" : undefined;
    const { data, error } = await supabase.functions.invoke("taxi-moderation", {
      body: { action, vehicle_id: vehicleId, rejection_reason },
    });
    if (error) {
      console.error("Taxi Moderation error", error);
      toast({ title: "Erreur de modération (Taxi)", variant: "destructive" });
      return;
    }
    if (data?.success) {
      toast({ title: action === "approve" ? "Taxi approuvé" : "Taxi rejeté" });
      pendingTaxiQuery.refetch();
    }
  };

  const pending = pendingQuery.data || [];
  const pendingTaxi = pendingTaxiQuery.data || [];

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Modération des véhicules de location</h2>
        <div className="grid grid-cols-1 gap-3 mt-3">
          {pending.map((v: any) => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{v.name}</h3>
                    <Badge variant="secondary">{v.brand} {v.model} • {v.year}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {v.daily_rate?.toLocaleString?.() || v.daily_rate} FC / jour • Caution {v.security_deposit?.toLocaleString?.() || v.security_deposit} FC
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => moderateRental(v.id, "reject")}>Rejeter</Button>
                  <Button className="bg-gradient-to-r from-primary to-primary-glow text-white" onClick={() => moderateRental(v.id, "approve")}>Approuver</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pending.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-6">
              Aucune annonce de location en attente.
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Modération des taxis partenaires</h2>
        <div className="grid grid-cols-1 gap-3 mt-3">
          {pendingTaxi.map((v: any) => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{v.name}</h3>
                    <Badge variant="secondary">{v.brand} {v.model} • {v.year}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Classe {v.vehicle_class?.toUpperCase?.()} • {v.seats} places • Immatriculation {v.license_plate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => moderateTaxi(v.id, "reject")}>Rejeter</Button>
                  <Button className="bg-gradient-to-r from-primary to-primary-glow text-white" onClick={() => moderateTaxi(v.id, "approve")}>Approuver</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingTaxi.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-6">
              Aucun taxi en attente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
