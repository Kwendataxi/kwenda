import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ModernVehicleCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
  city: string;
  priority: number;
}

export interface RentalEquipment {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  is_premium: boolean;
}

export interface DriverEquipment {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  is_required: boolean;
}

export interface ModernRentalVehicle {
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
  driver_available: boolean;
  driver_required: boolean;
  with_driver_daily_rate: number;
  with_driver_hourly_rate: number;
  with_driver_weekly_rate: number;
  without_driver_daily_rate: number;
  without_driver_hourly_rate: number;
  without_driver_weekly_rate: number;
  driver_equipment: string[];
  vehicle_equipment: string[];
  features: string[];
  images: string[];
  city: string;
  available_cities: string[];
  comfort_level: string;
  equipment: string[];
  is_active: boolean;
  is_available: boolean;
  moderation_status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface CityPricing {
  id: string;
  city: string;
  category_id: string | null;
  multiplier: number;
  base_delivery_fee: number;
}

export function useModernRentals(selectedCity?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<string>('Kinshasa');

  // Détecter la localisation de l'utilisateur
  useEffect(() => {
    if (selectedCity) {
      setUserLocation(selectedCity);
    }
  }, [selectedCity]);

  // Catégories modernes
  const categoriesQuery = useQuery<ModernVehicleCategory[]>({
    queryKey: ["modern-rental-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_vehicle_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as ModernVehicleCategory[];
    },
  });

  // Équipements véhicules disponibles
  const equipmentQuery = useQuery<RentalEquipment[]>({
    queryKey: ["vehicle-equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_equipment_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as RentalEquipment[];
    },
  });

  // Équipements chauffeurs disponibles
  const driverEquipmentQuery = useQuery<DriverEquipment[]>({
    queryKey: ["driver-equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_equipment_types")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as DriverEquipment[];
    },
  });

  // Véhicules par ville
  const vehiclesQuery = useQuery<ModernRentalVehicle[]>({
    queryKey: ["modern-rental-vehicles", userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_vehicles")
        .select("*")
        .eq("is_available", true)
        .eq("is_active", true)
        .eq("moderation_status", "approved")
        .filter("available_cities", "cs", `{${userLocation}}`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data || []).map((v: any) => ({
        ...v,
        features: Array.isArray(v.features) ? v.features : [],
        images: Array.isArray(v.images) ? v.images : [],
        available_cities: Array.isArray(v.available_cities) ? v.available_cities : [],
        equipment: Array.isArray(v.equipment) ? v.equipment : [],
      })) as ModernRentalVehicle[];
    },
    enabled: !!userLocation,
  });

  // Pricing par ville
  const pricingQuery = useQuery<CityPricing[]>({
    queryKey: ["city-pricing", userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_city_pricing")
        .select("*")
        .eq("city", userLocation);
      if (error) throw error;
      return (data || []) as CityPricing[];
    },
    enabled: !!userLocation,
  });

  // Realtime updates for rentals (categories, vehicles, pricing)
  useEffect(() => {
    const channel = supabase
      .channel('modern-rentals-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_vehicles' },
        () => {
          qc.invalidateQueries({ queryKey: ['modern-rental-vehicles', userLocation] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_vehicle_categories' },
        () => {
          qc.invalidateQueries({ queryKey: ['modern-rental-categories'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_city_pricing' },
        () => {
          qc.invalidateQueries({ queryKey: ['city-pricing', userLocation] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, userLocation]);

  // Calculer le prix avec multiplier de ville
  const calculateCityPrice = (basePrice: number, categoryId?: string): number => {
    if (!pricingQuery.data) return basePrice;
    
    const pricing = pricingQuery.data.find(p => 
      p.category_id === categoryId || p.category_id === null
    );
    
    const multiplier = pricing?.multiplier || 1.0;
    return Math.round(basePrice * multiplier);
  };

  // Filtrer les véhicules par catégorie
  const getVehiclesByCategory = (categoryId: string): ModernRentalVehicle[] => {
    return vehiclesQuery.data?.filter(v => v.category_id === categoryId) || [];
  };

  // Obtenir les villes disponibles
  const availableCities = useMemo(() => {
    return ['Kinshasa', 'Lubumbashi', 'Kolwezi'];
  }, []);

  // Mutation pour créer une réservation avec vérification de disponibilité
  const createBooking = useMutation({
    mutationFn: async (bookingData: any) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Utilisateur non connecté');

      // Vérifier la disponibilité avant de créer
      const { data: isAvailable } = await supabase.rpc('check_vehicle_availability' as any, {
        p_vehicle_id: bookingData.vehicle_id,
        p_start_date: bookingData.start_date,
        p_end_date: bookingData.end_date
      } as any);

      if (!isAvailable) {
        throw new Error('Ce véhicule n\'est pas disponible pour ces dates');
      }

      const { data, error } = await supabase
        .from("rental_bookings")
        .insert({
          ...bookingData,
          user_id: user.user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modern-rental-vehicles'] });
      toast({
        title: "Réservation créée",
        description: "Votre demande de location a été enregistrée avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la réservation",
        variant: "destructive"
      });
    }
  });

  return useMemo(() => ({
    userLocation,
    setUserLocation,
    availableCities,
    categories: categoriesQuery.data || [],
    equipment: equipmentQuery.data || [],
    driverEquipment: driverEquipmentQuery.data || [],
    vehicles: vehiclesQuery.data || [],
    pricing: pricingQuery.data || [],
    isLoading: categoriesQuery.isLoading || vehiclesQuery.isLoading || equipmentQuery.isLoading || driverEquipmentQuery.isLoading,
    isError: categoriesQuery.isError || vehiclesQuery.isError || equipmentQuery.isError || driverEquipmentQuery.isError,
    calculateCityPrice,
    getVehiclesByCategory,
    createBooking,
  }), [
    userLocation,
    availableCities,
    categoriesQuery.data,
    equipmentQuery.data,
    driverEquipmentQuery.data,
    vehiclesQuery.data,
    pricingQuery.data,
    categoriesQuery.isLoading,
    vehiclesQuery.isLoading,
    equipmentQuery.isLoading,
    driverEquipmentQuery.isLoading,
    categoriesQuery.isError,
    vehiclesQuery.isError,
    equipmentQuery.isError,
    driverEquipmentQuery.isError,
    calculateCityPrice,
    getVehiclesByCategory,
    createBooking,
  ]);
}