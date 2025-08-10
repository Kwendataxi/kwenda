import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, driverId } = await req.json()

    if (!orderId) {
      throw new Error('Order ID is required')
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // If driverId is provided, assign specific driver
    if (driverId) {
      // Check if driver is available
      const { data: driverLocation, error: driverError } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .eq('is_online', true)
        .eq('is_available', true)
        .single()

      if (driverError || !driverLocation) {
        throw new Error('Driver not available')
      }

      // Create or update delivery assignment
      const { error: assignmentError } = await supabase
        .from('marketplace_delivery_assignments')
        .upsert({
          order_id: orderId,
          driver_id: driverId,
          pickup_location: order.delivery_address || 'Boutique vendeur',
          delivery_location: order.delivery_address,
          pickup_coordinates: order.pickup_coordinates,
          delivery_coordinates: order.delivery_coordinates,
          assignment_status: 'assigned',
          estimated_delivery_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        })

      if (assignmentError) {
        throw new Error('Failed to create delivery assignment')
      }

      // Update order status
      const { error: statusError } = await supabase
        .from('marketplace_orders')
        .update({ status: 'assigned_to_driver' })
        .eq('id', orderId)

      if (statusError) {
        throw new Error('Failed to update order status')
      }

      console.log(`Order ${orderId} assigned to driver ${driverId}`)
    } else {
      // Auto-assign to available driver
      const { data: availableDrivers, error: driversError } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          latitude,
          longitude,
          driver_profiles!inner(
            user_id,
            is_active,
            verification_status
          )
        `)
        .eq('is_online', true)
        .eq('is_available', true)
        .eq('driver_profiles.is_active', true)
        .eq('driver_profiles.verification_status', 'verified')

      if (driversError || !availableDrivers || availableDrivers.length === 0) {
        console.log(`No available drivers for order ${orderId}`)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'No available drivers found' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }

      // Select the first available driver (can be enhanced with distance-based selection)
      const selectedDriver = availableDrivers[0]

      // Create delivery assignment
      const { error: assignmentError } = await supabase
        .from('marketplace_delivery_assignments')
        .insert({
          order_id: orderId,
          driver_id: selectedDriver.driver_id,
          pickup_location: order.delivery_address || 'Boutique vendeur',
          delivery_location: order.delivery_address,
          pickup_coordinates: order.pickup_coordinates,
          delivery_coordinates: order.delivery_coordinates,
          assignment_status: 'assigned',
          estimated_delivery_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        })

      if (assignmentError) {
        throw new Error('Failed to create delivery assignment')
      }

      // Update order status
      const { error: statusError } = await supabase
        .from('marketplace_orders')
        .update({ status: 'assigned_to_driver' })
        .eq('id', orderId)

      if (statusError) {
        throw new Error('Failed to update order status')
      }

      // Update driver availability
      const { error: availabilityError } = await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', selectedDriver.driver_id)

      if (availabilityError) {
        console.error('Failed to update driver availability:', availabilityError)
      }

      console.log(`Order ${orderId} auto-assigned to driver ${selectedDriver.driver_id}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Driver assigned successfully',
        orderId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in marketplace-driver-assignment:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})