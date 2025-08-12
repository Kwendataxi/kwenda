import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, orderId, mode, radiusKm, maxDrivers, driverId } = await req.json();

    if (action === 'find_drivers') {
      console.log(`Finding drivers for order ${orderId}, mode: ${mode}, radius: ${radiusKm}km`);

      // Get available drivers from driver_locations
      const { data: availableDrivers, error: driversError } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          latitude,
          longitude,
          vehicle_class,
          is_online,
          is_available
        `)
        .eq('is_online', true)
        .eq('is_available', true);

      if (driversError) {
        console.error('Error fetching drivers:', driversError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch drivers' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`Found ${availableDrivers?.length || 0} online drivers`);

      // Transform data for delivery driver format
      const deliveryDrivers = (availableDrivers || []).map((driver, index) => {
        // Calculate simulated distance (for demo purposes)
        const baseDistance = 0.5 + (index * 0.3);
        const distance = Math.round((baseDistance + Math.random() * 1.5) * 10) / 10;
        
        // Estimate arrival time based on distance and vehicle type
        let speedKmh = 25; // default speed
        if (driver.vehicle_class === 'moto') speedKmh = 35;
        if (driver.vehicle_class === 'truck') speedKmh = 20;
        
        const estimatedArrival = Math.ceil((distance / speedKmh) * 60); // minutes
        
        // Map vehicle_class to vehicle_type for frontend compatibility
        let vehicleType: 'moto' | 'car' | 'truck' = 'car';
        if (driver.vehicle_class === 'moto') vehicleType = 'moto';
        if (driver.vehicle_class === 'truck') vehicleType = 'truck';

        return {
          driver_id: driver.driver_id,
          distance: distance,
          estimated_arrival: estimatedArrival,
          vehicle_type: vehicleType,
          driver_profile: {
            user_id: driver.driver_id,
            vehicle_type: `${driver.vehicle_class === 'moto' ? 'Moto' : driver.vehicle_class === 'truck' ? 'Camion' : 'Voiture'} ${['Honda', 'Toyota', 'Yamaha', 'Nissan', 'Isuzu'][index % 5]}`,
            vehicle_plate: `KIN-${1000 + index}${index}`,
            vehicle_color: ['Blanc', 'Noir', 'Rouge', 'Bleu', 'Gris'][index % 5],
            rating_average: 4.2 + (Math.random() * 0.8), // 4.2 to 5.0
            rating_count: 50 + Math.floor(Math.random() * 200),
            total_rides: 100 + Math.floor(Math.random() * 300),
            display_name: ['Jean K.', 'Marie T.', 'Paul M.', 'Grace B.', 'David L.'][index % 5],
            phone_number: `+24390000000${index + 1}`
          }
        };
      });

      // Filter by delivery mode requirements
      const filteredDrivers = deliveryDrivers.filter(driver => {
        if (mode === 'flash' && driver.vehicle_type !== 'moto') return false;
        if (mode === 'maxicharge' && driver.vehicle_type !== 'truck') return false;
        return true;
      });

      // Sort by distance and limit results
      const sortedDrivers = filteredDrivers
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxDrivers || 10);

      console.log(`Returning ${sortedDrivers.length} filtered drivers for mode ${mode}`);

      return new Response(
        JSON.stringify({ 
          drivers: sortedDrivers,
          total: sortedDrivers.length,
          mode: mode,
          radius: radiusKm
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'assign_driver') {
      console.log(`Assigning driver ${driverId} to order ${orderId}`);

      // Update driver availability
      const { error: updateError } = await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', driverId);

      if (updateError) {
        console.error('Error updating driver availability:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to assign driver' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Update delivery order with driver assignment
      const { error: orderError } = await supabase
        .from('delivery_orders')
        .update({ 
          driver_id: driverId,
          status: 'assigned',
          pickup_time: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderError) {
        console.error('Error updating delivery order:', orderError);
        // Rollback driver availability
        await supabase
          .from('driver_locations')
          .update({ is_available: true })
          .eq('driver_id', driverId);
        
        return new Response(
          JSON.stringify({ error: 'Failed to update order' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`Successfully assigned driver ${driverId} to order ${orderId}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Driver assigned successfully',
          driverId: driverId,
          orderId: orderId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error in delivery-dispatcher:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});