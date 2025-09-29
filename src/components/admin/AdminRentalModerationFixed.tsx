import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Car, Truck, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RentalVehicle {
  id: string;
  brand: string;
  model: string;
  daily_rate: number;
  moderation_status: string;
  created_at: string;
  category_id: string;
  partner_id: string;
}

interface TaxiVehicle {
  id: string;
  brand: string;
  model: string;
  license_plate: string;
  moderation_status: string;
  created_at: string;
  partner_id: string;
}

export const AdminRentalModerationFixed = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending rental vehicles
  const { data: pendingRentals = [], isLoading: loadingRentals } = useQuery({
    queryKey: ["admin-pending-rentals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_vehicles")
        .select(`
          id, brand, model, daily_rate, moderation_status, created_at, category_id,
          partner_id
        `)
        .eq("moderation_status", "pending");
      
      if (error) throw error;
      return data as RentalVehicle[];
    },
  });

  // Fetch pending taxi vehicles
  const { data: pendingTaxis = [], isLoading: loadingTaxis } = useQuery({
    queryKey: ["admin-pending-taxis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_taxi_vehicles")
        .select(`
          id, brand, model, license_plate, moderation_status, created_at,
          partner_id
        `)
        .eq("moderation_status", "pending");
      
      if (error) throw error;
      return data as TaxiVehicle[];
    },
  });

  // Moderate rental vehicles
  const moderateRental = useMutation({
    mutationFn: async ({ vehicleId, action, reason }: { vehicleId: string; action: "approve" | "reject"; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke("rental-moderation", {
        body: {
          vehicle_id: vehicleId,
          action,
          rejection_reason: reason,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Véhicule de location modéré avec succès" });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-rentals"] });
    },
    onError: (error) => {
      console.error("Error moderating rental:", error);
      toast({ title: "Erreur", description: "Erreur lors de la modération", variant: "destructive" });
    },
  });

  // Moderate taxi vehicles
  const moderateTaxi = useMutation({
    mutationFn: async ({ vehicleId, action, reason }: { vehicleId: string; action: "approve" | "reject"; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke("taxi-moderation", {
        body: {
          vehicle_id: vehicleId,
          action,
          rejection_reason: reason,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Taxi modéré avec succès" });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-taxis"] });
    },
    onError: (error) => {
      console.error("Error moderating taxi:", error);
      toast({ title: "Erreur", description: "Erreur lors de la modération", variant: "destructive" });
    },
  });

  const handleRentalAction = async (vehicleId: string, action: "approve" | "reject") => {
    let reason;
    if (action === "reject") {
      reason = prompt("Raison du rejet:");
      if (!reason) return;
    }
    moderateRental.mutate({ vehicleId, action, reason });
  };

  const handleTaxiAction = async (vehicleId: string, action: "approve" | "reject") => {
    let reason;
    if (action === "reject") {
      reason = prompt("Raison du rejet:");
      if (!reason) return;
    }
    moderateTaxi.mutate({ vehicleId, action, reason });
  };

  const getVehicleIcon = (type: string) => {
    return type === "rental" ? <Car className="h-4 w-4" /> : <Truck className="h-4 w-4" />;
  };

  const renderRentalCard = (vehicle: RentalVehicle) => (
    <Card key={vehicle.id} className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getVehicleIcon("rental")}
            {vehicle.brand} {vehicle.model}
          </CardTitle>
          <Badge variant="outline">
            {vehicle.daily_rate.toLocaleString()} CDF/jour
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Partenaire ID:</span>
            <p className="text-muted-foreground">
              {vehicle.partner_id || "Non assigné"}
            </p>
          </div>
          <div>
            <span className="font-medium">Statut:</span>
            <p className="text-muted-foreground">
              {vehicle.moderation_status}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => handleRentalAction(vehicle.id, "approve")}
            disabled={moderateRental.isPending}
            className="flex-1"
            variant="default"
          >
            {moderateRental.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approuver
          </Button>
          <Button
            onClick={() => handleRentalAction(vehicle.id, "reject")}
            disabled={moderateRental.isPending}
            className="flex-1"
            variant="destructive"
          >
            <XCircle className="h-4 w-4" />
            Rejeter
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTaxiCard = (vehicle: TaxiVehicle) => (
    <Card key={vehicle.id} className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getVehicleIcon("taxi")}
            {vehicle.brand} {vehicle.model}
          </CardTitle>
          <Badge variant="outline">
            {vehicle.license_plate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Partenaire ID:</span>
            <p className="text-muted-foreground">
              {vehicle.partner_id || "Non assigné"}
            </p>
          </div>
          <div>
            <span className="font-medium">Statut:</span>
            <p className="text-muted-foreground">
              {vehicle.moderation_status}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => handleTaxiAction(vehicle.id, "approve")}
            disabled={moderateTaxi.isPending}
            className="flex-1"
            variant="default"
          >
            {moderateTaxi.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approuver
          </Button>
          <Button
            onClick={() => handleTaxiAction(vehicle.id, "reject")}
            disabled={moderateTaxi.isPending}
            className="flex-1"
            variant="destructive"
          >
            <XCircle className="h-4 w-4" />
            Rejeter
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loadingRentals || loadingTaxis) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des véhicules en attente...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-orange-500" />
        <h2 className="text-2xl font-bold">Modération des Véhicules</h2>
        <Badge variant="secondary">
          {pendingRentals.length + pendingTaxis.length} en attente
        </Badge>
      </div>

      {/* Rental Vehicles Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Car className="h-5 w-5" />
          Véhicules de Location ({pendingRentals.length})
        </h3>
        
        {pendingRentals.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aucun véhicule de location en attente de modération
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingRentals.map(renderRentalCard)}
          </div>
        )}
      </div>

      {/* Taxi Vehicles Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Taxis Partenaires ({pendingTaxis.length})
        </h3>
        
        {pendingTaxis.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aucun taxi en attente de modération
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingTaxis.map(renderTaxiCard)}
          </div>
        )}
      </div>
    </div>
  );
};