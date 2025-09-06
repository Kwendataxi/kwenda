import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { autoGeofencing } from '@/services/autoGeofencing'
import { useToast } from './use-toast'

interface AssignmentRequest {
  pickup_location: { latitude: number; longitude: number }
  delivery_location?: { latitude: number; longitude: number }
  service_type: 'transport' | 'delivery'
  vehicle_class?: string
  priority?: 'normal' | 'high' | 'urgent'
}

interface AssignmentResult {
  driver_id: string
  estimated_arrival: number // in minutes
  estimated_price: number
  zone_id: string
  surge_multiplier: number
}

export const useIntelligentAssignment = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const findBestDriver = useCallback(async (request: AssignmentRequest): Promise<AssignmentResult | null> => {
    setLoading(true)
    setError(null)

    try {
      // 1. Détecter la zone de départ
      const pickupZone = await autoGeofencing.detectZone(request.pickup_location)
      if (!pickupZone) {
        throw new Error('Zone de service non couverte')
      }

      // 2. Obtenir les chauffeurs disponibles dans la zone
      const availableDrivers = await autoGeofencing.getAvailableDriversInZone(pickupZone.id)
      
      if (availableDrivers.length === 0) {
        throw new Error('Aucun chauffeur disponible dans cette zone')
      }

      // 3. Récupérer les préférences de service et associations véhicules
      const driverIds = availableDrivers.map(d => d.driver_id)
      
      const { data: driverPreferences } = await supabase
        .from('driver_service_preferences')
        .select('*')
        .in('driver_id', driverIds)
        .eq('is_active', true)

      const { data: vehicleAssociations } = await supabase
        .from('driver_vehicle_associations')
        .select('*')
        .in('driver_id', driverIds)
        .eq('is_active', true)
        .eq('approval_status', 'approved')

      // 4. Filtrer les chauffeurs selon leurs préférences de service
      const compatibleDrivers = availableDrivers.filter(driver => {
        const preferences = driverPreferences?.find(p => p.driver_id === driver.driver_id)
        const associations = vehicleAssociations?.filter(a => a.driver_id === driver.driver_id)
        
        // Vérifier qu'il a au moins un véhicule approuvé
        if (!associations || associations.length === 0) return false
        
        // Vérifier le type de service
        if (preferences?.service_types && !preferences.service_types.includes(request.service_type)) {
          return false
        }

        // Vérifier la distance maximale
        const distance = calculateDistance(
          request.pickup_location,
          { latitude: driver.latitude, longitude: driver.longitude }
        )
        
        if (preferences?.max_distance_km && distance > preferences.max_distance_km) {
          return false
        }

        return true
      })

      if (compatibleDrivers.length === 0) {
        throw new Error('Aucun chauffeur compatible trouvé pour ce type de service')
      }

      // 5. Calculer les scores pour chaque chauffeur compatible
      const driverScores = compatibleDrivers.map(driver => {
        const distance = calculateDistance(
          request.pickup_location,
          { latitude: driver.latitude, longitude: driver.longitude }
        )

        const score = calculateDriverScore({
          distance,
          rating: driver.driver_profiles?.rating_average || 3.0,
          totalRides: driver.driver_profiles?.total_rides || 0,
          serviceType: driver.driver_profiles?.service_type || 'taxi',
          lastActivity: new Date(driver.last_ping)
        })

        return {
          driver_id: driver.driver_id,
          score,
          distance,
          estimated_arrival: Math.ceil(distance * 2), // Estimation simple: 2 min par km
          rating: driver.driver_profiles?.rating_average || 3.0
        }
      })

      // 6. Sélectionner le meilleur chauffeur
      const bestDriver = driverScores.reduce((best, current) => 
        current.score > best.score ? current : best
      )

      // 7. Calculer le prix avec surge pricing
      const pricing = await autoGeofencing.getDynamicPricing(
        pickupZone.id, 
        request.vehicle_class || 'standard'
      )

      const basePrice = pricing?.base_price || 2000
      const pricePerKm = pricing?.price_per_km || 300
      const surgeMultiplier = pricing?.surge_multiplier || 1.0

      let totalDistance = bestDriver.distance
      if (request.delivery_location) {
        totalDistance += calculateDistance(
          request.pickup_location,
          request.delivery_location
        )
      }

      const estimatedPrice = Math.round(
        (basePrice + (totalDistance * pricePerKm)) * surgeMultiplier
      )

      return {
        driver_id: bestDriver.driver_id,
        estimated_arrival: bestDriver.estimated_arrival,
        estimated_price: estimatedPrice,
        zone_id: pickupZone.id,
        surge_multiplier: surgeMultiplier
      }

    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Erreur d'affectation",
        description: err.message,
        variant: "destructive"
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  const assignDriver = useCallback(async (
    assignmentResult: AssignmentResult,
    bookingData: any
  ): Promise<boolean> => {
    try {
      // Mettre à jour le booking avec le chauffeur assigné
      const { error: updateError } = await supabase
        .from(bookingData.service_type === 'transport' ? 'transport_bookings' : 'delivery_orders')
        .update({
          driver_id: assignmentResult.driver_id,
          estimated_price: assignmentResult.estimated_price,
          status: 'assigned',
          pickup_zone_id: assignmentResult.zone_id
        })
        .eq('id', bookingData.id)

      if (updateError) throw updateError

      // Mettre à jour le statut du chauffeur
      const { error: driverError } = await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', assignmentResult.driver_id)

      if (driverError) throw driverError

      toast({
        title: "Chauffeur assigné",
        description: "Un chauffeur a été trouvé pour votre demande",
        variant: "default"
      })

      return true
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Erreur d'affectation",
        description: "Impossible d'assigner le chauffeur",
        variant: "destructive"
      })
      return false
    }
  }, [toast])

  const calculateDriverScore = (params: {
    distance: number
    rating: number
    totalRides: number
    serviceType: string
    lastActivity: Date
  }) => {
    const { distance, rating, totalRides, lastActivity } = params

    // Score basé sur la proximité (plus proche = meilleur score)
    const proximityScore = Math.max(0, 100 - distance * 10)

    // Score basé sur la note (0-5 -> 0-100)
    const ratingScore = (rating / 5) * 100

    // Score basé sur l'expérience
    const experienceScore = Math.min(100, totalRides * 2)

    // Score basé sur l'activité récente
    const activityScore = Math.max(0, 100 - (Date.now() - lastActivity.getTime()) / (60 * 1000))

    // Score pondéré
    return (
      proximityScore * 0.4 +  // 40% proximité
      ratingScore * 0.3 +     // 30% note
      experienceScore * 0.2 + // 20% expérience
      activityScore * 0.1     // 10% activité récente
    )
  }

  return {
    findBestDriver,
    assignDriver,
    loading,
    error
  }
}

// Fonction utilitaire pour calculer la distance entre deux points
function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371 // Rayon de la Terre en kilomètres
  const dLat = deg2rad(point2.latitude - point1.latitude)
  const dLon = deg2rad(point2.longitude - point1.longitude)
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(point1.latitude)) * Math.cos(deg2rad(point2.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c // Distance en kilomètres
  
  return distance
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180)
}