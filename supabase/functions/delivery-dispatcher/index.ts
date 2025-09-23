import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeliveryOrder {
  id: string
  pickup_coordinates: { lat: number; lng: number }
  delivery_coordinates: { lat: number; lng: number }
  delivery_type: string
  estimated_price: number
  user_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, pickupLat, pickupLng, deliveryType } = await req.json()

    console.log(`🚚 Looking for driver for delivery order ${orderId}`)

    // Find available drivers nearby (within 15km for deliveries)
    const { data: nearbyDrivers, error: driversError } = await supabase
      .rpc('find_nearby_drivers', {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        service_type_param: 'delivery',
        radius_km: 15
      })

    if (driversError) {
      console.error('Error finding drivers:', driversError)
      throw driversError
    }

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      console.log('❌ No drivers available for delivery')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun livreur disponible dans la zone',
          driversFound: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Select the closest driver
    const selectedDriver = nearbyDrivers[0]
    console.log(`✅ Found driver ${selectedDriver.driver_id} at ${selectedDriver.distance_km}km`)

    // Assign driver to delivery order
    const { error: assignError } = await supabase
      .from('delivery_orders')
      .update({
        driver_id: selectedDriver.driver_id,
        status: 'driver_assigned',
        driver_assigned_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (assignError) {
      console.error('Error assigning driver:', assignError)
      throw assignError
    }

    // Mark driver as unavailable
    const { error: locationError } = await supabase
      .from('driver_locations')
      .update({ is_available: false })
      .eq('driver_id', selectedDriver.driver_id)

    if (locationError) {
      console.error('Error updating driver availability:', locationError)
    }

    // Create notification for driver
    const { error: notificationError } = await supabase
      .from('delivery_notifications')
      .insert({
        user_id: selectedDriver.driver_id,
        delivery_order_id: orderId,
        notification_type: 'driver_assignment',
        title: 'Nouvelle livraison assignée',
        message: `Vous avez été assigné à une livraison ${deliveryType}`,
        metadata: {
          distance_km: selectedDriver.distance_km,
          delivery_type: deliveryType
        }
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    // Add status history entry
    const { error: historyError } = await supabase
      .from('delivery_status_history')
      .insert({
        delivery_order_id: orderId,
        status: 'driver_assigned',
        previous_status: 'confirmed',
        changed_by: selectedDriver.driver_id,
        notes: `Livreur assigné automatiquement - Distance: ${selectedDriver.distance_km.toFixed(1)}km`,
        location_coordinates: {
          lat: selectedDriver.latitude,
          lng: selectedDriver.longitude
        }
      })

    if (historyError) {
      console.error('Error creating status history:', historyError)
    }

    console.log(`🎯 Successfully assigned driver ${selectedDriver.driver_id} to delivery ${orderId}`)

    return new Response(
      JSON.stringify({
        success: true,
        driver: {
          id: selectedDriver.driver_id,
          distance: selectedDriver.distance_km,
          vehicleClass: selectedDriver.vehicle_class
        },
        message: 'Livreur assigné avec succès'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Delivery dispatcher error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})