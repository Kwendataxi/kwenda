import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, rideRequestId, driverId, coordinates } = await req.json();

    console.log('Ride dispatcher action:', action, { rideRequestId, driverId });

    switch (action) {
      case 'create_request':
        return await createRideRequest(supabase, req.json());
      
      case 'find_drivers':
        return await findNearbyDrivers(supabase, rideRequestId, coordinates);
      
      case 'assign_driver':
        return await assignDriverToRide(supabase, rideRequestId, driverId);
      
      case 'update_status':
        return await updateRideStatus(supabase, rideRequestId, req.json());
      
      default:
        throw new Error('Action non supportée');
    }

  } catch (error) {
    console.error('Erreur dispatcher:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function createRideRequest(supabase: any, data: any) {
  const { 
    userId, 
    pickupLocation, 
    pickupCoordinates, 
    destination, 
    destinationCoordinates, 
    vehicleClass = 'standard' 
  } = data;

  // Calculer les zones
  const { data: pickupZone } = await supabase
    .rpc('get_zone_for_coordinates', {
      lat: pickupCoordinates.lat,
      lng: pickupCoordinates.lng
    });

  const { data: destinationZone } = await supabase
    .rpc('get_zone_for_coordinates', {
      lat: destinationCoordinates.lat,
      lng: destinationCoordinates.lng
    });

  // Calculer le prix estimé
  const distance = calculateDistance(
    pickupCoordinates.lat, pickupCoordinates.lng,
    destinationCoordinates.lat, destinationCoordinates.lng
  );

  // Récupérer les règles de tarification
  const { data: pricingRule } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('vehicle_class', vehicleClass)
    .eq('service_type', 'transport')
    .eq('city', 'kinshasa')
    .eq('is_active', true)
    .single();

  let estimatedPrice = pricingRule?.base_price || 500;
  if (distance > 0) {
    estimatedPrice += distance * (pricingRule?.price_per_km || 150);
  }

  // Calculer le surge pricing
  const { data: surgeMultiplier } = await supabase
    .rpc('calculate_surge_pricing', {
      zone_id_param: pickupZone,
      vehicle_class_param: vehicleClass
    });

  const surgePrice = estimatedPrice * (surgeMultiplier || 1);

  // Créer la demande de course
  const { data: rideRequest, error } = await supabase
    .from('ride_requests')
    .insert({
      user_id: userId,
      pickup_location: pickupLocation,
      pickup_coordinates: pickupCoordinates,
      destination: destination,
      destination_coordinates: destinationCoordinates,
      pickup_zone_id: pickupZone,
      destination_zone_id: destinationZone,
      vehicle_class: vehicleClass,
      estimated_price: estimatedPrice,
      surge_price: surgePrice,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  // Déclencher la recherche de chauffeurs
  setTimeout(() => {
    findNearbyDrivers(supabase, rideRequest.id, pickupCoordinates);
  }, 1000);

  return new Response(
    JSON.stringify({ 
      success: true, 
      rideRequest,
      estimatedPrice: surgePrice 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function findNearbyDrivers(supabase: any, rideRequestId: string, coordinates: any) {
  console.log('Recherche de chauffeurs pour:', rideRequestId);

  // Récupérer les détails de la demande
  const { data: rideRequest } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('id', rideRequestId)
    .single();

  if (!rideRequest || rideRequest.status !== 'pending') {
    return new Response(
      JSON.stringify({ error: 'Demande de course non trouvée ou déjà traitée' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Rechercher les chauffeurs disponibles dans un rayon de 5km
  const { data: nearbyDrivers } = await supabase
    .from('driver_locations')
    .select(`
      driver_id,
      latitude,
      longitude,
      driver_profiles!inner(
        user_id,
        vehicle_make,
        vehicle_model,
        vehicle_class,
        rating_average,
        is_active,
        verification_status
      )
    `)
    .eq('is_online', true)
    .eq('is_available', true)
    .eq('driver_profiles.is_active', true)
    .eq('driver_profiles.verification_status', 'verified')
    .eq('vehicle_class', rideRequest.vehicle_class);

  if (!nearbyDrivers || nearbyDrivers.length === 0) {
    // Aucun chauffeur disponible
    await supabase
      .from('ride_requests')
      .update({ status: 'no_drivers_available' })
      .eq('id', rideRequestId);

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Aucun chauffeur disponible' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Calculer les distances et trier
  const driversWithDistance = nearbyDrivers
    .map(driver => ({
      ...driver,
      distance: calculateDistance(
        coordinates.lat, coordinates.lng,
        driver.latitude, driver.longitude
      )
    }))
    .filter(driver => driver.distance <= 5) // 5km max
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3); // Top 3 chauffeurs

  if (driversWithDistance.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Aucun chauffeur à proximité' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Mettre à jour le statut de la demande
  await supabase
    .from('ride_requests')
    .update({ 
      status: 'dispatching',
      dispatch_time: new Date().toISOString()
    })
    .eq('id', rideRequestId);

  // Envoyer les notifications aux chauffeurs
  for (const driver of driversWithDistance) {
    await supabase
      .from('push_notifications')
      .insert({
        user_id: driver.driver_id,
        title: 'Nouvelle course disponible',
        message: `Course vers ${rideRequest.destination} - ${rideRequest.surge_price} CDF`,
        notification_type: 'ride_request',
        reference_id: rideRequestId
      });
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      drivers: driversWithDistance,
      message: `${driversWithDistance.length} chauffeurs notifiés`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function assignDriverToRide(supabase: any, rideRequestId: string, driverId: string) {
  console.log('Attribution chauffeur:', { rideRequestId, driverId });

  // Vérifier que la demande est toujours disponible
  const { data: rideRequest } = await supabase
    .from('ride_requests')
    .select('*')
    .eq('id', rideRequestId)
    .single();

  if (!rideRequest || rideRequest.status !== 'dispatching') {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Course déjà attribuée ou annulée' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Attribuer le chauffeur
  const { error: updateError } = await supabase
    .from('ride_requests')
    .update({
      assigned_driver_id: driverId,
      status: 'accepted',
      acceptance_time: new Date().toISOString()
    })
    .eq('id', rideRequestId);

  if (updateError) throw updateError;

  // Marquer le chauffeur comme non disponible
  await supabase
    .from('driver_locations')
    .update({ is_available: false })
    .eq('driver_id', driverId);

  // Notifier le client
  await supabase
    .from('push_notifications')
    .insert({
      user_id: rideRequest.user_id,
      title: 'Chauffeur trouvé !',
      message: 'Votre chauffeur arrive, préparez-vous',
      notification_type: 'driver_assigned',
      reference_id: rideRequestId
    });

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateRideStatus(supabase: any, rideRequestId: string, data: any) {
  const { status, coordinates, notes } = data;

  console.log('Mise à jour statut course:', { rideRequestId, status });

  const updates: any = { status };

  switch (status) {
    case 'driver_arrived':
      updates.pickup_time = new Date().toISOString();
      break;
    case 'in_progress':
      updates.pickup_time = updates.pickup_time || new Date().toISOString();
      break;
    case 'completed':
      updates.completion_time = new Date().toISOString();
      break;
    case 'cancelled':
      updates.cancellation_time = new Date().toISOString();
      if (notes) updates.cancellation_reason = notes;
      break;
  }

  const { error } = await supabase
    .from('ride_requests')
    .update(updates)
    .eq('id', rideRequestId);

  if (error) throw error;

  // Si course terminée ou annulée, remettre le chauffeur disponible
  if (['completed', 'cancelled'].includes(status)) {
    const { data: ride } = await supabase
      .from('ride_requests')
      .select('assigned_driver_id')
      .eq('id', rideRequestId)
      .single();

    if (ride?.assigned_driver_id) {
      await supabase
        .from('driver_locations')
        .update({ is_available: true })
        .eq('driver_id', ride.assigned_driver_id);
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}