import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverAssignmentResult {
  success: boolean;
  driver?: any;
  error?: string;
  estimatedArrival?: number;
}

interface AssignmentRequest {
  orderId: string;
  pickupCoordinates: { lat: number; lng: number };
  deliveryCoordinates: { lat: number; lng: number };
  deliveryType: 'flash' | 'flex' | 'maxicharge';
  priority?: 'normal' | 'high' | 'urgent';
}

export const useDriverAssignment = () => {
  const [loading, setLoading] = useState(false);
  const [assignedDriver, setAssignedDriver] = useState<any>(null);
  const [validationTimer, setValidationTimer] = useState<number | null>(null);
  const { toast } = useToast();

  // Assignation automatique du livreur avec géolocalisation optimisée
  const assignDriver = useCallback(async (request: AssignmentRequest): Promise<DriverAssignmentResult> => {
    setLoading(true);
    
    try {
      console.log('🔍 Recherche livreur automatique:', request);

      // Étape 1: Rechercher les livreurs disponibles par proximité
      const { data: availableDrivers, error: driversError } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          latitude,
          longitude,
          is_online,
          is_available,
          vehicle_class,
          last_ping,
          driver_profiles!inner(
            user_id,
            verification_status,
            service_type,
            rating_average,
            total_rides,
            vehicle_make,
            vehicle_model,
            profiles!inner(display_name, phone_number)
          )
        `)
        .eq('is_online', true)
        .eq('is_available', true)
        .eq('driver_profiles.verification_status', 'verified')
        .eq('driver_profiles.service_type', 'delivery')
        .gte('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Actif dans les 10 dernières minutes
        .order('last_ping', { ascending: false });

      if (driversError) {
        throw driversError;
      }

      if (!availableDrivers || availableDrivers.length === 0) {
        return {
          success: false,
          error: 'Aucun livreur disponible dans votre zone'
        };
      }

      console.log(`📍 ${availableDrivers.length} livreurs trouvés`);

      // Étape 2: Calculer la distance et filtrer par compatibilité
      const driversWithDistance = availableDrivers
        .map(driver => {
          const distance = calculateDistance(
            request.pickupCoordinates.lat,
            request.pickupCoordinates.lng,
            driver.latitude,
            driver.longitude
          );

          // Vérifier la compatibilité du véhicule
          const isCompatible = checkVehicleCompatibility(driver.vehicle_class, request.deliveryType);

          return {
            ...driver,
            distance,
            isCompatible,
            score: calculateDriverScore(driver, distance, request.priority || 'normal')
          };
        })
        .filter(driver => driver.isCompatible && driver.distance <= 15) // Maximum 15km
        .sort((a, b) => b.score - a.score); // Meilleur score en premier

      if (driversWithDistance.length === 0) {
        return {
          success: false,
          error: 'Aucun livreur compatible trouvé dans un rayon de 15km'
        };
      }

      // Étape 3: Assigner le meilleur livreur
      const bestDriver = driversWithDistance[0];
      
      console.log('🎯 Meilleur livreur sélectionné:', {
        name: bestDriver.driver_profiles.profiles.display_name,
        distance: bestDriver.distance,
        score: bestDriver.score,
        rating: bestDriver.driver_profiles.rating_average
      });

      // Étape 4: Créer l'assignation dans la base de données
      const { data: assignment, error: assignmentError } = await supabase
        .from('marketplace_delivery_assignments')
        .insert({
          order_id: request.orderId,
          driver_id: bestDriver.driver_id,
          pickup_location: `${request.pickupCoordinates.lat},${request.pickupCoordinates.lng}`,
          delivery_location: `${request.deliveryCoordinates.lat},${request.deliveryCoordinates.lng}`,
          pickup_coordinates: request.pickupCoordinates,
          delivery_coordinates: request.deliveryCoordinates,
          estimated_delivery_time: new Date(Date.now() + (bestDriver.distance / 25 * 60 * 60 * 1000)).toISOString(),
          assignment_status: 'pending'
        })
        .select()
        .single();

      if (assignmentError) {
        throw assignmentError;
      }

      // Étape 5: Marquer le livreur comme non disponible temporairement
      await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', bestDriver.driver_id);

      // Étape 6: Notifier le livreur via Edge Function
      try {
        await supabase.functions.invoke('marketplace-driver-assignment', {
          body: {
            action: 'notify_driver',
            driver_id: bestDriver.driver_id,
            assignment_id: assignment.id,
            pickup_location: request.pickupCoordinates,
            delivery_location: request.deliveryCoordinates,
            estimated_earnings: calculateEarnings(bestDriver.distance, request.deliveryType)
          }
        });
      } catch (notificationError) {
        console.warn('⚠️ Erreur notification livreur:', notificationError);
        // Continue quand même, l'assignation est créée
      }

      const driverInfo = {
        id: bestDriver.driver_id,
        name: bestDriver.driver_profiles.profiles.display_name,
        phone: bestDriver.driver_profiles.profiles.phone_number,
        rating: bestDriver.driver_profiles.rating_average,
        vehicle: `${bestDriver.driver_profiles.vehicle_make} ${bestDriver.driver_profiles.vehicle_model}`,
        distance: bestDriver.distance,
        estimatedArrival: Math.round(bestDriver.distance / 25 * 60), // 25 km/h moyenne
        assignmentId: assignment.id
      };

      setAssignedDriver(driverInfo);

      // Démarrer le timer de validation de 2 minutes
      startValidationTimer(driverInfo);

      toast({
        title: "Livreur assigné !",
        description: `${driverInfo.name} arrive dans ~${driverInfo.estimatedArrival} minutes`,
      });

      return {
        success: true,
        driver: driverInfo,
        estimatedArrival: driverInfo.estimatedArrival
      };

    } catch (error: any) {
      console.error('❌ Erreur assignation livreur:', error);
      toast({
        title: "Erreur d'assignation",
        description: error.message || "Impossible d'assigner un livreur",
        variant: "destructive"
      });

      return {
        success: false,
        error: error.message || "Erreur interne"
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Timer de validation de 2 minutes
  const startValidationTimer = (driver: any) => {
    setValidationTimer(120); // 2 minutes
    
    const timer = setInterval(() => {
      setValidationTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleDriverTimeout(driver);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Gestion du timeout du livreur
  const handleDriverTimeout = async (driver: any) => {
    console.log('⏰ Timeout livreur:', driver.name);
    
    // Marquer le livreur comme disponible à nouveau
    await supabase
      .from('driver_locations')
      .update({ is_available: true })
      .eq('driver_id', driver.id);

    // Mettre à jour le statut de l'assignation
    await supabase
      .from('marketplace_delivery_assignments')
      .update({ assignment_status: 'timeout' })
      .eq('id', driver.assignmentId);

    setAssignedDriver(null);
    
    toast({
      title: "Livreur non disponible",
      description: "Recherche d'un autre livreur en cours...",
      variant: "destructive"
    });

    // Relancer automatiquement l'assignation
    // Note: Cela nécessiterait de passer les données originales de la commande
  };

  // Confirmation d'acceptation du livreur
  const confirmDriverAcceptance = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('marketplace_delivery_assignments')
        .update({ 
          assignment_status: 'accepted',
          actual_pickup_time: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      setValidationTimer(null);
      
      toast({
        title: "Livreur confirmé !",
        description: "Votre livreur est en route vers le point de récupération",
      });

      return true;
    } catch (error: any) {
      console.error('Erreur confirmation livreur:', error);
      return false;
    }
  };

  return {
    loading,
    assignedDriver,
    validationTimer,
    assignDriver,
    confirmDriverAcceptance,
    timeoutDriver: handleDriverTimeout
  };
};

// Fonctions utilitaires
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function checkVehicleCompatibility(vehicleClass: string, deliveryType: string): boolean {
  const compatibility = {
    'flash': ['bike', 'scooter', 'motorcycle'],
    'flex': ['car', 'van', 'small_truck'],
    'maxicharge': ['truck', 'large_truck', 'van']
  };
  
  return compatibility[deliveryType as keyof typeof compatibility]?.includes(vehicleClass) || false;
}

function calculateDriverScore(driver: any, distance: number, priority: string): number {
  let score = 0;
  
  // Score basé sur la proximité (50% du score)
  score += Math.max(0, (15 - distance) / 15) * 50;
  
  // Score basé sur la note (30% du score)
  score += (driver.driver_profiles.rating_average / 5) * 30;
  
  // Score basé sur l'expérience (20% du score)
  score += Math.min(driver.driver_profiles.total_rides / 100, 1) * 20;
  
  // Bonus pour priorité élevée
  if (priority === 'urgent') score += 10;
  if (priority === 'high') score += 5;
  
  return score;
}

function calculateEarnings(distance: number, deliveryType: string): number {
  const baseRates = {
    'flash': { base: 2000, perKm: 300 },
    'flex': { base: 3000, perKm: 400 },
    'maxicharge': { base: 5000, perKm: 600 }
  };
  
  const rate = baseRates[deliveryType as keyof typeof baseRates];
  return rate.base + (distance * rate.perKm);
}