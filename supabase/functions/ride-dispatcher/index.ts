import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DispatchRequest {
  booking_id: string;
  pickup_coordinates: {
    lat: number;
    lng: number;
  };
  service_type?: string;
  radius_km?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('🔍 Raw request body:', body);
    
    // Support des deux formats de paramètres
    let booking_id = body.booking_id;
    let pickup_coordinates = body.pickup_coordinates;
    
    // Compatibilité avec l'ancien format
    if (!booking_id && body.rideRequestId) {
      booking_id = body.rideRequestId;
    }
    
    if (!pickup_coordinates && body.pickupLat && body.pickupLng) {
      pickup_coordinates = {
        lat: body.pickupLat,
        lng: body.pickupLng
      };
    }
    
    // Validation stricte des paramètres
    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'Missing booking_id parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!pickup_coordinates || typeof pickup_coordinates.lat !== 'number' || typeof pickup_coordinates.lng !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Invalid pickup_coordinates format. Expected: {lat: number, lng: number}' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const service_type = body.service_type || 'taxi';
    const radius_km = body.radius_km || 15;

    console.log(`🚗 Dispatch request for booking ${booking_id} at ${pickup_coordinates.lat}, ${pickup_coordinates.lng}`);

    // Validate coordinates using our database function
    const { data: coordinateValidation, error: validationError } = await supabaseClient
      .rpc('validate_booking_coordinates', {
        pickup_coords: pickup_coordinates
      });

    if (validationError) {
      console.error('❌ Coordinate validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates', details: validationError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validatedCoords = coordinateValidation.pickup;

    // Find nearby drivers using our database function with correct parameters
    const { data: nearbyDrivers, error: searchError } = await supabaseClient
      .rpc('find_nearby_drivers', {
        pickup_lat: validatedCoords.lat,
        pickup_lng: validatedCoords.lng,
        service_type_param: service_type,
        radius_km: radius_km
      });

    if (searchError) {
      console.error('❌ Driver search error:', searchError);
      return new Response(
        JSON.stringify({ error: 'Failed to find drivers', details: searchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Found ${nearbyDrivers?.length || 0} nearby drivers`);

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      // No drivers found - update booking status
      await supabaseClient
        .from('transport_bookings')
        .update({ 
          status: 'no_driver_available',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No drivers available in the area',
          drivers_searched: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to assign the closest driver
    const closestDriver = nearbyDrivers[0];
    
    // Update booking with assigned driver
    const { error: assignError } = await supabaseClient
      .from('transport_bookings')
      .update({
        driver_id: closestDriver.driver_id,
        status: 'driver_assigned',
        driver_assigned_at: new Date().toISOString(),
        pickup_coordinates: validatedCoords,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    if (assignError) {
      console.error('❌ Driver assignment error:', assignError);
      return new Response(
        JSON.stringify({ error: 'Failed to assign driver', details: assignError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark driver as unavailable temporarily
    await supabaseClient
      .from('driver_locations')
      .update({ 
        is_available: false,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', closestDriver.driver_id);

    // Create driver notification in activity_logs with required user_id
    const { error: activityError } = await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: closestDriver.driver_id,
        activity_type: 'ride_request',
        description: `Nouvelle course assignée - ${service_type}`,
        reference_type: 'transport_booking',
        reference_id: booking_id,
        metadata: {
          pickup_coordinates: validatedCoords,
          distance_km: closestDriver.distance_km,
          estimated_arrival: Math.round(closestDriver.distance_km * 2) // 2 min per km estimate
        }
      });

    if (activityError) {
      console.error('❌ Error creating activity log:', activityError);
    }

    console.log(`✅ Driver ${closestDriver.driver_id} assigned to booking ${booking_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        driver_assigned: {
          driver_id: closestDriver.driver_id,
          distance_km: closestDriver.distance_km,
          estimated_arrival_minutes: Math.round(closestDriver.distance_km * 2)
        },
        total_drivers_found: nearbyDrivers.length,
        coordinates_corrected: validatedCoords.corrected || false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error in ride dispatcher:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});