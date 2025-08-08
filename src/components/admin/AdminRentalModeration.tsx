
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function AdminRentalModeration() {
  const { toast } = useToast();

  // Explicitly type the query to avoid deep type instantiation
  const pendingQuery = useQuery<any[]>({
    queryKey: ["admin-rental-pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_vehicles")
        .select("*")
        .eq("moderation_status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const moderate = async (vehicleId: string, action: "approve" | "reject") => {
    const rejection_reason = action === "reject" ? "Informations insuffisantes" : undefined;
    const { data, error } = await supabase.functions.invoke("rental-moderation", {
      body: { action, vehicle_id: vehicleId, rejection_reason },
    });
    if (error) {
      console.error("Moderation error", error);
      toast({ title: "Erreur de modération", variant: "destructive" });
      return;
    }
    if (data?.success) {
      toast({ title: action === "approve" ? "Annonce approuvée" : "Annonce rejetée" });
      pendingQuery.refetch();
    }
  };

  const pending = pendingQuery.data || [];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Modération des véhicules de location</h2>
      <div className="grid grid-cols-1 gap-3">
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
                <Button variant="outline" onClick={() => moderate(v.id, "reject")}>Rejeter</Button>
                <Button className="bg-gradient-to-r from-primary to-primary-glow text-white" onClick={() => moderate(v.id, "approve")}>Approuver</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {pending.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6">
            Aucune annonce en attente.
          </div>
        )}
      </div>
    </div>
  );
}
