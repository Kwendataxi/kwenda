import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PendingOrder {
  id: string;
  pickup_coordinates: {
    lat: number;
    lng: number;
  };
  delivery_type: string;
  created_at: string;
  retry_count?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 AUTO-RETRY DELIVERY DISPATCH');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les commandes en attente sans chauffeur (créées il y a plus de 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: pendingOrders, error: fetchError } = await supabase
      .from('delivery_orders')
      .select('id, pickup_coordinates, delivery_type, created_at')
      .eq('status', 'pending')
      .is('driver_id', null)
      .lt('created_at', twoMinutesAgo)
      .order('created_at', { ascending: true })
      .limit(20); // Limiter à 20 commandes par run

    if (fetchError) {
      console.error('❌ Erreur récupération commandes:', fetchError);
      throw fetchError;
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('✅ Aucune commande en attente nécessitant un retry');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pending orders to retry',
          orders_checked: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 ${pendingOrders.length} commande(s) en attente trouvée(s)`);

    const results = {
      total: pendingOrders.length,
      retried: 0,
      failed: 0,
      already_assigned: 0,
      invalid_coordinates: 0
    };

    // Réessayer chaque commande
    for (const order of pendingOrders as PendingOrder[]) {
      try {
        console.log(`\n🔄 Retry commande ${order.id}`);
        console.log('   Type:', order.delivery_type);
        console.log('   Créée:', order.created_at);

        // Vérifier que les coordonnées sont valides
        if (!order.pickup_coordinates?.lat || !order.pickup_coordinates?.lng) {
          console.warn(`⚠️ Coordonnées invalides pour ${order.id}`);
          results.invalid_coordinates++;
          continue;
        }

        // Vérifier que la commande n'a pas été assignée entre-temps
        const { data: currentOrder, error: checkError } = await supabase
          .from('delivery_orders')
          .select('driver_id, status')
          .eq('id', order.id)
          .single();

        if (checkError) {
          console.error(`❌ Erreur vérification commande ${order.id}:`, checkError);
          results.failed++;
          continue;
        }

        if (currentOrder.driver_id || currentOrder.status !== 'pending') {
          console.log(`✅ Commande ${order.id} déjà assignée ou changée de statut`);
          results.already_assigned++;
          continue;
        }

        // Appeler le delivery-dispatcher
        console.log(`📡 Appel delivery-dispatcher pour ${order.id}`);
        
        const { data: dispatchResult, error: dispatchError } = await supabase.functions.invoke(
          'delivery-dispatcher',
          {
            body: {
              orderId: order.id,
              pickupLat: order.pickup_coordinates.lat,
              pickupLng: order.pickup_coordinates.lng,
              deliveryType: order.delivery_type
            }
          }
        );

        if (dispatchError) {
          console.error(`❌ Erreur dispatch ${order.id}:`, dispatchError);
          results.failed++;
          continue;
        }

        console.log(`✅ Dispatch result pour ${order.id}:`, dispatchResult);
        
        if (dispatchResult?.success && dispatchResult?.drivers_notified > 0) {
          console.log(`🎯 ${dispatchResult.drivers_notified} livreur(s) notifié(s)`);
          results.retried++;
          
          // Optionnel: Notifier l'utilisateur
          await supabase
            .from('delivery_notifications')
            .insert({
              user_id: currentOrder.user_id || '00000000-0000-0000-0000-000000000000',
              delivery_order_id: order.id,
              notification_type: 'retry_search',
              title: 'Recherche de livreur relancée',
              message: `Nous avons trouvé ${dispatchResult.drivers_notified} livreur(s) disponible(s) pour votre commande.`,
              metadata: {
                drivers_notified: dispatchResult.drivers_notified,
                search_radius: dispatchResult.search_radius,
                retry_timestamp: new Date().toISOString()
              }
            });
        } else {
          console.log(`⏳ Aucun livreur trouvé pour ${order.id}, réessaiera plus tard`);
          results.failed++;
        }

        // Petit délai entre chaque commande pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (orderError: any) {
        console.error(`❌ Erreur traitement commande ${order.id}:`, orderError);
        results.failed++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RÉSULTATS RETRY:');
    console.log('   Total vérifié:', results.total);
    console.log('   Réussis:', results.retried);
    console.log('   Échoués:', results.failed);
    console.log('   Déjà assignés:', results.already_assigned);
    console.log('   Coordonnées invalides:', results.invalid_coordinates);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return new Response(
      JSON.stringify({
        success: true,
        results: results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ ERREUR CRITIQUE AUTO-RETRY:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});