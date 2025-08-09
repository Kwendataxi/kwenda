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

    const body = await req.json();
    const { action } = body || {};

    if (action !== 'find_drivers') {
      return new Response(
        JSON.stringify({ success: false, error: 'Action non supportée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, mode, pickupCoordinates, radiusKm } = body as {
      orderId: string;
      mode: 'flash' | 'flex' | 'maxicharge';
      pickupCoordinates: { lat: number; lng: number };
      radiusKm?: number;
    };

    if (!orderId || !pickupCoordinates?.lat || !pickupCoordinates?.lng || !mode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paramètres manquants' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Déterminer le rayon par défaut selon le mode
    const computedRadius = radiusKm ?? (mode === 'flash' ? 5 : mode === 'flex' ? 10 : 15);

    // Récupérer la commande (vérifier statut)
    const { data: order, error: orderErr } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ success: false, error: 'Commande introuvable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rechercher chauffeurs disponibles
    const { data: locations, error: locErr } = await supabase
      .from('driver_locations')
      .select('driver_id, latitude, longitude, is_online, is_available')
      .eq('is_online', true)
      .eq('is_available', true)
      .limit(100);

    if (locErr) {
      console.error('driver_locations error:', locErr);
    }

    const withinRadius = (locations || [])
      .map((loc) => ({
        ...loc,
        distance: haversine(pickupCoordinates.lat, pickupCoordinates.lng, Number(loc.latitude), Number(loc.longitude)),
      }))
      .filter((loc) => loc.distance <= computedRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    // Mettre la commande en statut "searching_driver"
    await supabase
      .from('delivery_orders')
      .update({ status: 'searching_driver', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    return new Response(
      JSON.stringify({ success: true, driversFound: withinRadius.length, radiusKm: computedRadius }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('delivery-dispatcher error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Erreur interne' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
