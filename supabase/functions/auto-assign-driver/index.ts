const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Auto-assign driver service started');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { action = 'auto_assign_pending' } = await req.json().catch(() => ({}));

    switch (action) {
      case 'auto_assign_pending':
        return await autoAssignPendingOrders(supabase);
      
      case 'find_drivers_for_order':
        const { orderId } = await req.json();
        return await findDriversForOrder(supabase, orderId);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('❌ Error in auto-assign-driver:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fonction principale: Assigner automatiquement les commandes en attente
async function autoAssignPendingOrders(supabase: any) {
  console.log('📋 Recherche des commandes en attente...');
  
  // Récupérer les commandes en attente (max 10 à la fois)
  const { data: pendingOrders, error: ordersError } = await supabase
    .from('delivery_orders')
    .select('*')
    .eq('status', 'pending')
    .is('driver_id', null)
    .order('created_at', { ascending: true })
    .limit(10);

  if (ordersError) {
    console.error('❌ Erreur récupération commandes:', ordersError);
    throw ordersError;
  }

  console.log(`📦 ${pendingOrders?.length || 0} commandes en attente trouvées`);

  if (!pendingOrders || pendingOrders.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Aucune commande en attente',
        assigned_count: 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let assignedCount = 0;
  const results = [];

  // Traiter chaque commande
  for (const order of pendingOrders) {
    try {
      console.log(`🎯 Traitement commande ${order.id}`);
      
      // Extraire les coordonnées de pickup
      const pickupCoords = order.pickup_coordinates;
      if (!pickupCoords?.lat || !pickupCoords?.lng) {
        console.warn(`⚠️ Coordonnées pickup manquantes pour ${order.id}`);
        continue;
      }

      // Chercher des chauffeurs disponibles dans un rayon de 10km
      const { data: drivers, error: driversError } = await supabase.rpc(
        'find_nearby_drivers_secure',
        {
          user_lat: pickupCoords.lat,
          user_lng: pickupCoords.lng,
          max_distance_km: 10,
          vehicle_class_filter: null // Accepter tous types de véhicules
        }
      );

      if (driversError) {
        console.error(`❌ Erreur recherche chauffeurs pour ${order.id}:`, driversError);
        continue;
      }

      if (!drivers || drivers.length === 0) {
        console.log(`🔍 Aucun chauffeur disponible pour ${order.id}`);
        continue;
      }

      // Prendre le chauffeur le plus proche avec la meilleure note
      const bestDriver = drivers.sort((a: any, b: any) => {
        // Priorité: distance puis note
        if (a.distance_km !== b.distance_km) {
          return a.distance_km - b.distance_km;
        }
        return b.rating_average - a.rating_average;
      })[0];

      console.log(`👨‍💼 Meilleur chauffeur: ${bestDriver.driver_id} (${bestDriver.distance_km}km, note: ${bestDriver.rating_average})`);

      // Assigner le chauffeur
      const { error: assignError } = await supabase
        .from('delivery_orders')
        .update({
          driver_id: bestDriver.driver_id,
          status: 'driver_assigned',
          driver_assigned_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (assignError) {
        console.error(`❌ Erreur assignation ${order.id}:`, assignError);
        continue;
      }

      // Marquer le chauffeur comme indisponible temporairement
      await supabase
        .from('driver_locations')
        .update({ is_available: false })
        .eq('driver_id', bestDriver.driver_id);

      console.log(`✅ Commande ${order.id} assignée à ${bestDriver.driver_id}`);
      assignedCount++;

      results.push({
        order_id: order.id,
        driver_id: bestDriver.driver_id,
        distance_km: bestDriver.distance_km,
        estimated_arrival: bestDriver.estimated_arrival_minutes
      });

      // Créer notifications (optionnel)
      try {
        // Notification client
        await supabase.from('activity_logs').insert({
          user_id: order.user_id,
          activity_type: 'delivery_driver_assigned',
          description: `Livreur assigné pour votre commande de livraison`,
          reference_type: 'delivery_order',
          reference_id: order.id,
          metadata: {
            driver_id: bestDriver.driver_id,
            estimated_arrival: bestDriver.estimated_arrival_minutes
          }
        });

        // Notification chauffeur
        await supabase.from('activity_logs').insert({
          user_id: bestDriver.driver_id,
          activity_type: 'delivery_assignment_received',
          description: `Nouvelle commande de livraison assignée`,
          reference_type: 'delivery_order',
          reference_id: order.id,
          metadata: {
            pickup_location: order.pickup_location,
            delivery_location: order.delivery_location,
            estimated_price: order.estimated_price
          }
        });
      } catch (notifError) {
        console.warn(`⚠️ Erreur notifications pour ${order.id}:`, notifError);
      }

    } catch (orderError) {
      console.error(`❌ Erreur traitement commande ${order.id}:`, orderError);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `${assignedCount} commandes assignées avec succès`,
      assigned_count: assignedCount,
      assignments: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Fonction spécifique: Chercher des chauffeurs pour une commande donnée
async function findDriversForOrder(supabase: any, orderId: string) {
  console.log(`🔍 Recherche chauffeurs pour commande ${orderId}`);

  if (!orderId) {
    throw new Error('ID de commande requis');
  }

  // Récupérer la commande
  const { data: order, error: orderError } = await supabase
    .from('delivery_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('Commande non trouvée');
  }

  const pickupCoords = order.pickup_coordinates;
  if (!pickupCoords?.lat || !pickupCoords?.lng) {
    throw new Error('Coordonnées pickup manquantes');
  }

  // Chercher chauffeurs dans différents rayons
  const searchRadii = [5, 10, 15, 20]; // km
  let allDrivers = [];

  for (const radius of searchRadii) {
    const { data: drivers, error } = await supabase.rpc(
      'find_nearby_drivers_secure',
      {
        user_lat: pickupCoords.lat,
        user_lng: pickupCoords.lng,
        max_distance_km: radius,
        vehicle_class_filter: null
      }
    );

    if (!error && drivers && drivers.length > 0) {
      allDrivers = drivers.map((d: any) => ({
        ...d,
        search_radius: radius
      }));
      break; // Utiliser le plus petit rayon avec des résultats
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      order_id: orderId,
      drivers_found: allDrivers.length,
      drivers: allDrivers.slice(0, 5), // Top 5 chauffeurs
      pickup_location: order.pickup_location
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}