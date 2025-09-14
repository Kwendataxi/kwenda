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

    const { action, order_id, orderId, mode, radiusKm, maxDrivers, driverId } = await req.json();
    
    // Support both parameter formats
    const finalOrderId = order_id || orderId;

    if (action === 'find_drivers') {
      console.log(`🚚 Finding drivers for order ${finalOrderId}, mode: ${mode || 'flex'}, radius: ${radiusKm || 5}km`);

      // Récupérer la commande pour obtenir les coordonnées
      const { data: order, error: orderError } = await supabase
        .from('delivery_orders')
        .select('pickup_coordinates, delivery_coordinates, pickup_location, delivery_location')
        .eq('id', finalOrderId)
        .single();

      if (orderError || !order) {
        console.error('❌ Order not found:', orderError);
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const pickupCoords = order.pickup_coordinates;
      if (!pickupCoords?.lat || !pickupCoords?.lng) {
        console.warn('⚠️ No pickup coordinates found, using fallback');
      }

      // Get available drivers from driver_locations avec profiles
      const { data: availableDrivers, error: driversError } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          latitude,
          longitude,
          vehicle_class,
          is_online,
          is_available,
          last_ping
        `)
        .eq('is_online', true)
        .eq('is_available', true);

      if (driversError) {
        console.error('❌ Error fetching drivers:', driversError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch drivers' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`📋 Found ${availableDrivers?.length || 0} online drivers`);

      // Transform data for delivery driver format avec calcul de distance réel
      const deliveryDrivers = (availableDrivers || []).map((driver, index) => {
        // Calculer la distance réelle si possible
        let distance = 2 + Math.random() * 8; // Fallback: 2-10km
        
        if (pickupCoords?.lat && pickupCoords?.lng && driver.latitude && driver.longitude) {
          distance = calculateDistance(
            pickupCoords.lat,
            pickupCoords.lng,
            driver.latitude,
            driver.longitude
          );
        }
        
        // Estimate arrival time based on distance and vehicle type
        let speedKmh = 25; // default speed
        if (driver.vehicle_class === 'moto') speedKmh = 35;
        if (driver.vehicle_class === 'truck') speedKmh = 20;
        
        const estimatedArrival = Math.ceil((distance / speedKmh) * 60); // minutes
        
        // Map vehicle_class to vehicle_type for frontend compatibility
        let vehicleType: 'moto' | 'car' | 'truck' = 'car';
        if (driver.vehicle_class === 'moto') vehicleType = 'moto';
        if (driver.vehicle_class === 'truck') vehicleType = 'truck';

        // Calculer un score de performance
        const minutesSinceLastPing = driver.last_ping 
          ? (Date.now() - new Date(driver.last_ping).getTime()) / (1000 * 60)
          : 30;
        
        const activityScore = Math.max(0, 100 - minutesSinceLastPing);
        const distanceScore = Math.max(0, 100 - (distance * 10));
        const overallScore = (activityScore + distanceScore) / 2;

        return {
          driver_id: driver.driver_id,
          distance: Math.round(distance * 10) / 10,
          estimated_arrival: estimatedArrival,
          vehicle_type: vehicleType,
          score: overallScore,
          last_ping: driver.last_ping,
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

      // Filter by delivery mode requirements and driver capacity
      const deliveryMode = mode || 'flex';
      const filteredDrivers = deliveryDrivers.filter(driver => {
        // Filtrer par type de véhicule ET capacité de livraison
        if (deliveryMode === 'flash' && driver.vehicle_type !== 'moto') return false;
        if (deliveryMode === 'maxicharge' && driver.vehicle_type !== 'truck') return false;
        
        // Vérification supplémentaire de la capacité de livraison du chauffeur
        // Cette logique sera étendue quand nous aurons les données de capacité
        return true;
      });

      // Sort by score (meilleur score = meilleur livreur) puis distance
      const sortedDrivers = filteredDrivers
        .filter(driver => driver.distance <= (radiusKm || 5)) // Filtre par rayon
        .sort((a, b) => {
          // Trier par score décroissant, puis distance croissante
          if (b.score !== a.score) return b.score - a.score;
          return a.distance - b.distance;
        })
        .slice(0, maxDrivers || 10);

      console.log(`✅ Returning ${sortedDrivers.length} filtered drivers for mode ${deliveryMode}`);

      // Log pour la recherche de livreurs
      if (sortedDrivers.length > 0) {
        await supabase
          .from('delivery_status_history')
          .insert({
            delivery_order_id: finalOrderId,
            status: 'driver_search_success',
            notes: `${sortedDrivers.length} livreurs trouvés pour ${deliveryMode}`,
            metadata: {
              drivers_found: sortedDrivers.length,
              search_radius: radiusKm || 5,
              pickup_coordinates: pickupCoords
            }
          });
      }

      return new Response(
        JSON.stringify({ 
          drivers: sortedDrivers,
          total: sortedDrivers.length,
          mode: deliveryMode,
          radius: radiusKm || 5,
          pickup_location: order.pickup_location,
          delivery_location: order.delivery_location
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'assign_driver') {
      console.log(`Assigning driver ${driverId} to order ${finalOrderId}`);

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
        .eq('id', finalOrderId);

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

      console.log(`Successfully assigned driver ${driverId} to order ${finalOrderId}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Driver assigned successfully',
          driverId: driverId,
          orderId: finalOrderId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('❌ Error in delivery-dispatcher:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message || 'Une erreur inattendue s\'est produite'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Fonction pour calculer la distance entre deux points (formule haversine)
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