import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VehicleCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
}

export interface RentalVehicle {
  id: string;
  partner_id: string;
  category_id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
  fuel_type: string | null;
  transmission: string | null;
  seats: number;
  daily_rate: number;
  hourly_rate: number;
  weekly_rate: number;
  security_deposit: number;
  driver_available?: boolean;
  driver_required?: boolean;
  with_driver_daily_rate?: number;
  with_driver_hourly_rate?: number;
  with_driver_weekly_rate?: number;
  without_driver_daily_rate?: number;
  without_driver_hourly_rate?: number;
  without_driver_weekly_rate?: number;
  driver_equipment?: string[];
  vehicle_equipment?: string[];
  features: string[];
  images: string[];
  license_plate: string | null;
  location_address: string | null;
  city?: string;
  available_cities?: string[];
  comfort_level?: string;
  equipment?: string[];
  is_active: boolean;
  is_available: boolean;
  moderation_status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalBooking {
  id: string;
  user_id: string;
  vehicle_id: string;
  rental_duration_type: "hourly" | "half_day" | "daily" | "weekly";
  start_date: string;
  end_date: string;
  pickup_location: string;
  return_location: string;
  total_amount: number;
  security_deposit: number;
  special_requests: string | null;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "rejected" | "no_show";
  created_at: string;
  updated_at: string;
}

export function usePartnerRentals() {
  const qc = useQueryClient();

  // Keep the typing simple to avoid deep instantiation
  const userQuery = useQuery<any>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const userId = userQuery.data?.id as string | undefined;

  const categoriesQuery = useQuery<VehicleCategory[]>({
    queryKey: ["rental-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_vehicle_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data || []) as VehicleCategory[];
    },
    enabled: true,
  });

  const vehiclesQuery = useQuery<RentalVehicle[]>({
    queryKey: ["partner-rental-vehicles", userId],
    queryFn: async () => {
      if (!userId) return [] as RentalVehicle[];
      
      // First get partner_id from user_id
      const { data: partnerData, error: partnerError } = await supabase
        .from("partenaires")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (partnerError || !partnerData) return [] as RentalVehicle[];
      
      const { data, error } = await (supabase as any)
        .from("rental_vehicles")
        .select("*")
        .eq("partner_id", partnerData.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((v: any) => ({
        ...v,
        features: Array.isArray(v.features) ? v.features.map((x: any) => String(x)) : [],
        images: Array.isArray(v.images) ? v.images.map((x: any) => String(x)) : [],
      })) as RentalVehicle[];
    },
    enabled: !!userId,
  });

  const bookingsQuery = useQuery<RentalBooking[]>({
    queryKey: ["partner-rental-bookings", userId],
    queryFn: async () => {
      if (!userId) return [] as RentalBooking[];

      // First get partner_id
      const { data: partnerData, error: partnerError } = await supabase
        .from("partenaires")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (partnerError || !partnerData) return [] as RentalBooking[];

      const { data: vehicleIdsData, error: idsErr } = await (supabase as any)
        .from("rental_vehicles")
        .select("id")
        .eq("partner_id", partnerData.id);

      if (idsErr) throw idsErr;

      const vehicleIds = (vehicleIdsData || []).map((r: any) => r.id);
      if (vehicleIds.length === 0) return [] as RentalBooking[];

      const { data, error } = await (supabase as any)
        .from("rental_bookings")
        .select("*")
        .in("vehicle_id", vehicleIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as RentalBooking[];
    },
    enabled: !!userId && !!vehiclesQuery.data,
  });

  // Mutations
  const createVehicle = useMutation({
    mutationFn: async (payload: Partial<RentalVehicle>) => {
      if (!userId) throw new Error("Not authenticated");
      
      // Get partner_id first
      const { data: partnerData, error: partnerError } = await supabase
        .from("partenaires")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (partnerError || !partnerData) throw new Error("Partner not found");
      
      const insert = {
        ...payload,
        partner_id: partnerData.id,
        features: payload.features || [],
        images: payload.images || [],
      };
      // Cast to any to avoid friction with generated Insert typing requiring all mandatory fields at compile-time
      const { data, error } = await supabase
        .from("rental_vehicles")
        .insert(insert as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as RentalVehicle;
    },
    meta: { onError: (e: any) => console.error("createVehicle error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-rental-vehicles", userId] });
    },
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RentalVehicle> }) => {
      const { data, error } = await supabase
        .from("rental_vehicles")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as RentalVehicle;
    },
    meta: { onError: (e: any) => console.error("updateVehicle error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-rental-vehicles", userId] });
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rental_vehicles").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    meta: { onError: (e: any) => console.error("deleteVehicle error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-rental-vehicles", userId] });
    },
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RentalBooking["status"] }) => {
      const { data, error } = await supabase
        .from("rental_bookings")
        .update({ status } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as RentalBooking;
    },
    meta: { onError: (e: any) => console.error("updateBookingStatus error", e) },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partner-rental-bookings", userId] });
    },
  });

  // Realtime: invalider quand changement
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("rental-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_vehicles" },
        (payload) => {
          console.log("rental_vehicles change", payload);
          qc.invalidateQueries({ queryKey: ["partner-rental-vehicles", userId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_bookings" },
        (payload) => {
          console.log("rental_bookings change", payload);
          qc.invalidateQueries({ queryKey: ["partner-rental-bookings", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return useMemo(
    () => ({
      user: userQuery.data,
      categories: categoriesQuery.data || [],
      vehicles: vehiclesQuery.data || [],
      bookings: bookingsQuery.data || [],
      isLoading: categoriesQuery.isLoading || vehiclesQuery.isLoading || bookingsQuery.isLoading,
      createVehicle,
      updateVehicle,
      deleteVehicle,
      updateBookingStatus,
    }),
    [
      userQuery.data,
      categoriesQuery.data,
      vehiclesQuery.data,
      bookingsQuery.data,
      categoriesQuery.isLoading,
      vehiclesQuery.isLoading,
      bookingsQuery.isLoading,
      createVehicle,
      updateVehicle,
      deleteVehicle,
      updateBookingStatus,
    ]
  );
}
