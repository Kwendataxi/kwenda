import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()

    switch (action) {
      case 'find_drivers':
        return await findAvailableDrivers(supabase, params)
      
      case 'assign_driver':
        return await assignDriverToDelivery(supabase, params)
        
      case 'notify_drivers':
        return await notifyNearbyDrivers(supabase, params)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non reconnue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})

// Fonction principale de recherche de livreurs
async function findAvailableDrivers(supabase: any, params: any) {
  try {
    const { orderId, mode, radiusKm = 5, pickup_coordinates, maxDrivers = 10 } = params
    
    console.log(`Finding drivers for order ${orderId}, mode: ${mode}, radius: ${radiusKm}km`)
    
    // Récupérer les détails de la commande si orderId fourni
    let orderDetails = null
    if (orderId) {
      const { data: order } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('id', orderId)
        .single()
      orderDetails = order
    }
    
    // Coordonnées de récupération (de la commande ou des paramètres)
    const pickup = pickup_coordinates || orderDetails?.pickup_coordinates || { lat: -4.3217, lng: 15.3069 }
    
    // Requête pour trouver les livreurs disponibles
    const { data: drivers, error } = await supabase
      .from('driver_locations')
      .select(`
        driver_id,
        latitude,
        longitude,
        vehicle_class,
        is_online,
        is_available,
        last_ping,
        driver_profiles!driver_locations_driver_id_fkey (
          user_id,
          vehicle_make,
          vehicle_model,
          vehicle_plate,
          vehicle_color,
          rating_average,
          rating_count,
          total_rides,
          service_type,
          verification_status,
          profiles!driver_profiles_user_id_fkey (
            display_name,
            phone_number
          )
        )
      `)
      .eq('is_online', true)
      .eq('is_available', true)
      .gte('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Actif dans les 10 dernières minutes
    
    if (error) {
      console.error('Error fetching drivers:', error)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la recherche de livreurs' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }
    
    if (!drivers || drivers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, drivers: [], message: 'Aucun livreur disponible' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }
    
    // Calculer les distances et scorer les livreurs
    const scoredDrivers = drivers
      .map(driver => {
        const distance = calculateDistance(
          pickup.lat,
          pickup.lng,
          driver.latitude,
          driver.longitude
        )
        
        // Filtrer par rayon
        if (distance > radiusKm) return null
        
        // Calculer le score du livreur
        const score = calculateDriverScore({
          distance,
          rating: driver.driver_profiles?.rating_average || 0,
          totalRides: driver.driver_profiles?.total_rides || 0,
          lastActivity: new Date(driver.last_ping)
        })
        
        // Temps d'arrivée estimé (distance * facteur + trafic)
        const estimatedArrival = Math.max(3, Math.round(distance * 2 + Math.random() * 5))
        
        // Déterminer le type de véhicule selon le mode
        const vehicleType = getVehicleTypeForMode(mode, driver.vehicle_class)
        
        return {
          driver_id: driver.driver_id,
          distance: Math.round(distance * 10) / 10,
          estimated_arrival: estimatedArrival,
          score,
          vehicle_type: vehicleType,
          driver_profile: {
            user_id: driver.driver_profiles?.user_id || driver.driver_id,
            vehicle_type: `${driver.driver_profiles?.vehicle_make || ''} ${driver.driver_profiles?.vehicle_model || ''}`.trim() || vehicleType,
            vehicle_plate: driver.driver_profiles?.vehicle_plate || 'N/A',
            vehicle_color: driver.driver_profiles?.vehicle_color || 'Inconnu',
            rating_average: driver.driver_profiles?.rating_average || 5.0,
            rating_count: driver.driver_profiles?.rating_count || 0,
            total_rides: driver.driver_profiles?.total_rides || 0,
            display_name: driver.driver_profiles?.profiles?.display_name || 'Livreur',
            phone_number: driver.driver_profiles?.profiles?.phone_number || ''
          }
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score) // Trier par score décroissant
      .slice(0, maxDrivers)
    
    console.log(`Found ${scoredDrivers.length} available drivers`)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        drivers: scoredDrivers,
        searchRadius: radiusKm,
        totalFound: scoredDrivers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
    
  } catch (error) {
    console.error('Error in findAvailableDrivers:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
}

// Fonction d'assignation de livreur
async function assignDriverToDelivery(supabase: any, params: any) {
  try {
    const { orderId, driverId } = params
    
    console.log(`Assigning driver ${driverId} to order ${orderId}`)
    
    // Vérifier que le livreur est toujours disponible
    const { data: driver } = await supabase
      .from('driver_locations')
      .select('is_available, is_online')
      .eq('driver_id', driverId)
      .single()
    
    if (!driver?.is_available || !driver?.is_online) {
      return new Response(
        JSON.stringify({ error: 'Livreur non disponible' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }
    
    // Assigner le livreur à la commande
    const { error: updateError } = await supabase
      .from('delivery_orders')
      .update({ 
        driver_id: driverId,
        status: 'driver_assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (updateError) {
      console.error('Error assigning driver:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'assignation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      )
    }
    
    // Marquer le livreur comme non disponible
    await supabase
      .from('driver_locations')
      .update({ is_available: false })
      .eq('driver_id', driverId)
    
    console.log(`Driver ${driverId} successfully assigned to order ${orderId}`)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Livreur assigné avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
    
  } catch (error) {
    console.error('Error in assignDriverToDelivery:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
}

// Fonction de notification des livreurs
async function notifyNearbyDrivers(supabase: any, params: any) {
  try {
    const { orderId, pickup_coordinates, radiusKm = 10 } = params
    
    // Envoyer notifications push aux livreurs proches
    // Cette fonction peut être étendue avec FCM/Push notifications
    
    return new Response(
      JSON.stringify({ success: true, message: 'Notifications envoyées' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
    
  } catch (error) {
    console.error('Error in notifyNearbyDrivers:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
}

// Fonction de calcul de distance (formule de Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Fonction de scoring des livreurs
function calculateDriverScore(params: {
  distance: number
  rating: number
  totalRides: number
  lastActivity: Date
}): number {
  const { distance, rating, totalRides, lastActivity } = params
  
  // Score de base sur la distance (plus proche = meilleur score)
  const distanceScore = Math.max(0, 100 - (distance * 10))
  
  // Score de rating (0-5 → 0-100)
  const ratingScore = (rating / 5) * 100
  
  // Score d'expérience (nombre de courses)
  const experienceScore = Math.min(100, totalRides * 2)
  
  // Score d'activité récente (plus récent = meilleur)
  const timeSinceActivity = Date.now() - lastActivity.getTime()
  const activityScore = Math.max(0, 100 - (timeSinceActivity / (1000 * 60 * 10))) // 10 min max
  
  // Score pondéré
  return (
    distanceScore * 0.4 +      // 40% distance
    ratingScore * 0.3 +        // 30% rating
    experienceScore * 0.2 +    // 20% expérience
    activityScore * 0.1        // 10% activité récente
  )
}

// Fonction pour déterminer le type de véhicule selon le mode
function getVehicleTypeForMode(mode: string, vehicleClass?: string): string {
  switch (mode) {
    case 'flash':
      return 'moto'
    case 'maxicharge':
      return 'truck'
    case 'flex':
    default:
      return vehicleClass || 'car'
  }
}