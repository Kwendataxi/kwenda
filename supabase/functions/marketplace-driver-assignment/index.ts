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
    console.log('Marketplace driver assignment action:', action, params)

    switch (action) {
      case 'find_marketplace_drivers':
        const { lat, lng, max_distance = 10, city = 'Kinshasa' } = params;
        
        console.log(`Recherche de livreurs près de ${lat}, ${lng} dans un rayon de ${max_distance}km`);

        // Rechercher les livreurs disponibles avec moins de contraintes
        const { data: availableDrivers, error: driversError } = await supabase
          .from('driver_locations')
          .select(`
            driver_id,
            latitude,
            longitude,
            is_online,
            is_available,
            vehicle_class,
            is_verified,
            minimum_balance,
            last_ping
          `)
          .eq('is_online', true)
          .eq('is_available', true)
          .eq('is_verified', true)
          .gte('minimum_balance', 500)
          .gte('last_ping', new Date(Date.now() - 10 * 60 * 1000).toISOString())
          .limit(15)

        if (driversError) {
          console.error('Error fetching drivers:', driversError)
          throw driversError
        }

        console.log(`${availableDrivers?.length || 0} chauffeurs trouvés en base`);

        // Fonction pour calculer la distance
        function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
          const R = 6371; // Rayon de la Terre en km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        }

        // Calculer les vraies distances si coordonnées fournies
        const formattedDrivers = (availableDrivers || []).map((driver: any, index: number) => {
          let distance_km = 2 + (index * 0.5); // Distance par défaut
          
          if (lat && lng && driver.latitude && driver.longitude) {
            distance_km = calculateDistance(lat, lng, driver.latitude, driver.longitude);
          }
          
          return {
            driver_id: driver.driver_id,
            distance_km: Math.round(distance_km * 100) / 100,
            estimated_arrival: Math.max(5, Math.round(distance_km * 3 + 2)),
            vehicle_class: driver.vehicle_class || 'moto',
            is_online: driver.is_online,
            last_ping: driver.last_ping
          };
        })
        .filter(driver => !lat || !lng || driver.distance_km <= max_distance)
        .sort((a, b) => a.distance_km - b.distance_km)

        return new Response(
          JSON.stringify({ 
            success: true, 
            drivers: formattedDrivers,
            message: `${formattedDrivers.length} livreur(s) trouvé(s)`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      
      case 'assign_marketplace_driver':
        const { order_id, driver_id, pickup_location, delivery_location, assignment_fee } = params
        
        // Créer l'assignation de livraison
        const { data: assignment, error: assignmentError } = await supabase
          .from('marketplace_delivery_assignments')
          .insert({
            order_id,
            driver_id,
            pickup_location,
            delivery_location,
            assignment_status: 'assigned',
            delivery_fee: assignment_fee || 500,
            pickup_coordinates: null, // À améliorer avec géolocalisation
            delivery_coordinates: null // À améliorer avec géolocalisation
          })
          .select()
          .single()

        if (assignmentError) {
          console.error('Error creating assignment:', assignmentError)
          throw assignmentError
        }

        // Mettre à jour le statut de la commande
        const { error: orderUpdateError } = await supabase
          .from('marketplace_orders')
          .update({ 
            status: 'assigned_to_driver',
            assigned_to_driver_at: new Date().toISOString()
          })
          .eq('id', order_id)

        if (orderUpdateError) {
          console.error('Error updating order:', orderUpdateError)
          throw orderUpdateError
        }

        // Marquer le livreur comme non disponible temporairement
        const { error: driverUpdateError } = await supabase
          .from('driver_locations')
          .update({ is_available: false })
          .eq('driver_id', driver_id)

        if (driverUpdateError) {
          console.error('Error updating driver availability:', driverUpdateError)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            assignment_id: assignment.id,
            message: 'Livreur marketplace assigné avec succès' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non reconnue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        )
    }

  } catch (error) {
    console.error('Erreur marketplace-driver-assignment:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})