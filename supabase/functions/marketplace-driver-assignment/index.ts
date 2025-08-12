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
        // Rechercher les livreurs disponibles dans la zone
        const { data: availableDrivers, error: driversError } = await supabase
          .from('driver_locations')
          .select(`
            driver_id,
            latitude,
            longitude,
            is_online,
            is_available,
            driver_profiles!inner(
              user_id,
              vehicle_make,
              vehicle_model,
              vehicle_plate,
              vehicle_color,
              rating_average,
              rating_count,
              verification_status,
              is_active,
              profiles!inner(display_name, phone_number)
            ),
            driver_credits!inner(
              balance
            )
          `)
          .eq('is_online', true)
          .eq('is_available', true)
          .eq('driver_profiles.verification_status', 'verified')
          .eq('driver_profiles.is_active', true)
          .gte('driver_credits.balance', 500) // Minimum balance pour assignation
          .limit(10)

        if (driversError) {
          console.error('Error fetching drivers:', driversError)
          throw driversError
        }

        // Transformer les données et calculer les distances (simulation)
        const formattedDrivers = (availableDrivers || []).map((driver: any, index: number) => ({
          driver_id: driver.driver_id,
          distance: 1.2 + (index * 0.3), // Distance simulée
          estimated_arrival: 8 + (index * 3), // Temps d'arrivée simulé
          has_sufficient_balance: driver.driver_credits?.balance >= 500,
          driver_profile: {
            user_id: driver.driver_profiles.user_id,
            vehicle_make: driver.driver_profiles.vehicle_make,
            vehicle_model: driver.driver_profiles.vehicle_model,
            vehicle_plate: driver.driver_profiles.vehicle_plate,
            vehicle_color: driver.driver_profiles.vehicle_color,
            rating_average: driver.driver_profiles.rating_average || 4.5,
            rating_count: driver.driver_profiles.rating_count || 50,
            display_name: driver.driver_profiles.profiles?.display_name || 'Livreur Kwenda',
            phone_number: driver.driver_profiles.profiles?.phone_number || '+243900000000'
          }
        }))

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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    )
  }
})