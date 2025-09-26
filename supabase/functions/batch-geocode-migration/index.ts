/**
 * Edge Function pour migration batch des coordonnées vers adresses Google Maps
 * Traite les données existantes par petits lots pour éviter les timeouts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationRequest {
  table: 'driver_locations' | 'transport_bookings' | 'delivery_orders';
  batchSize?: number;
  startOffset?: number;
}

interface GoogleGeocodeResponse {
  results: Array<{
    formatted_address: string;
    place_id: string;
    geometry: {
      location: { lat: number; lng: number };
    };
    types: string[];
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
}

async function geocodeCoordinates(lat: number, lng: number): Promise<{
  address: string;
  placeName?: string;
  placeId?: string;
} | null> {
  const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  
  if (!googleApiKey) {
    console.log('Google API key not configured, using fallback');
    return {
      address: `Coordonnées: ${lat.toFixed(6)}, ${lng.toFixed(6)}, Kinshasa, RDC`,
      placeName: 'Location approximative',
      placeId: undefined
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}&language=fr&region=cd`;
    
    const response = await fetch(url);
    const data: GoogleGeocodeResponse = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      // Extraire le nom du lieu principal
      const placeName = result.address_components.find(component => 
        component.types.includes('establishment') || 
        component.types.includes('point_of_interest')
      )?.long_name;
      
      return {
        address: result.formatted_address,
        placeName: placeName,
        placeId: result.place_id
      };
    }
    
    // Fallback avec coordonnées
    return {
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}, Kinshasa, RDC`,
      placeName: 'Localisation géographique',
      placeId: undefined
    };
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      address: `Coordonnées: ${lat.toFixed(6)}, ${lng.toFixed(6)}, Kinshasa, RDC`,
      placeName: 'Location approximative',
      placeId: undefined
    };
  }
}

async function migrateDriverLocations(supabase: any, batchSize: number, offset: number) {
  console.log(`Migrating driver_locations, batch size: ${batchSize}, offset: ${offset}`);
  
  // Récupérer les locations sans adresse Google
  const { data: locations, error } = await supabase
    .from('driver_locations')
    .select('id, driver_id, latitude, longitude')
    .is('google_address', null)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .range(offset, offset + batchSize - 1);

  if (error) {
    throw new Error(`Error fetching driver locations: ${error.message}`);
  }

  if (!locations || locations.length === 0) {
    return { processed: 0, hasMore: false };
  }

  console.log(`Processing ${locations.length} driver locations`);
  
  // Traiter chaque location
  for (const location of locations) {
    const geocoded = await geocodeCoordinates(location.latitude, location.longitude);
    
    if (geocoded) {
      const { error: updateError } = await supabase
        .from('driver_locations')
        .update({
          google_address: geocoded.address,
          google_place_name: geocoded.placeName,
          google_place_id: geocoded.placeId,
          google_geocoded_at: new Date().toISOString(),
          geocode_source: geocoded.placeId ? 'google' : 'fallback'
        })
        .eq('id', location.id);

      if (updateError) {
        console.error(`Error updating driver location ${location.id}:`, updateError);
      } else {
        console.log(`✅ Updated driver location ${location.id}: ${geocoded.address}`);
      }
    }
    
    // Petit délai pour éviter de surcharger l'API Google
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { 
    processed: locations.length, 
    hasMore: locations.length === batchSize 
  };
}

async function migrateTransportBookings(supabase: any, batchSize: number, offset: number) {
  console.log(`Migrating transport_bookings, batch size: ${batchSize}, offset: ${offset}`);
  
  const { data: bookings, error } = await supabase
    .from('transport_bookings')
    .select('id, pickup_coordinates, delivery_coordinates')
    .is('pickup_google_address', null)
    .not('pickup_coordinates', 'is', null)
    .range(offset, offset + batchSize - 1);

  if (error) {
    throw new Error(`Error fetching transport bookings: ${error.message}`);
  }

  if (!bookings || bookings.length === 0) {
    return { processed: 0, hasMore: false };
  }

  console.log(`Processing ${bookings.length} transport bookings`);
  
  for (const booking of bookings) {
    const pickupCoords = booking.pickup_coordinates;
    const deliveryCoords = booking.delivery_coordinates;
    
    const updates: any = { google_geocoded_at: new Date().toISOString() };
    
    // Géocoder pickup
    if (pickupCoords?.lat && pickupCoords?.lng) {
      const pickupGeocoded = await geocodeCoordinates(pickupCoords.lat, pickupCoords.lng);
      if (pickupGeocoded) {
        updates.pickup_google_address = pickupGeocoded.address;
        updates.pickup_google_place_name = pickupGeocoded.placeName;
        updates.pickup_google_place_id = pickupGeocoded.placeId;
      }
    }
    
    // Géocoder delivery
    if (deliveryCoords?.lat && deliveryCoords?.lng) {
      const deliveryGeocoded = await geocodeCoordinates(deliveryCoords.lat, deliveryCoords.lng);
      if (deliveryGeocoded) {
        updates.delivery_google_address = deliveryGeocoded.address;
        updates.delivery_google_place_name = deliveryGeocoded.placeName;
        updates.delivery_google_place_id = deliveryGeocoded.placeId;
      }
    }
    
    const { error: updateError } = await supabase
      .from('transport_bookings')
      .update(updates)
      .eq('id', booking.id);

    if (updateError) {
      console.error(`Error updating transport booking ${booking.id}:`, updateError);
    } else {
      console.log(`✅ Updated transport booking ${booking.id}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  return { 
    processed: bookings.length, 
    hasMore: bookings.length === batchSize 
  };
}

async function migrateDeliveryOrders(supabase: any, batchSize: number, offset: number) {
  console.log(`Migrating delivery_orders, batch size: ${batchSize}, offset: ${offset}`);
  
  const { data: orders, error } = await supabase
    .from('delivery_orders')
    .select('id, pickup_coordinates, delivery_coordinates')
    .is('pickup_google_address', null)
    .not('pickup_coordinates', 'is', null)
    .range(offset, offset + batchSize - 1);

  if (error) {
    throw new Error(`Error fetching delivery orders: ${error.message}`);
  }

  if (!orders || orders.length === 0) {
    return { processed: 0, hasMore: false };
  }

  console.log(`Processing ${orders.length} delivery orders`);
  
  for (const order of orders) {
    const pickupCoords = order.pickup_coordinates;
    const deliveryCoords = order.delivery_coordinates;
    
    const updates: any = { google_geocoded_at: new Date().toISOString() };
    
    // Géocoder pickup
    if (pickupCoords?.lat && pickupCoords?.lng) {
      const pickupGeocoded = await geocodeCoordinates(pickupCoords.lat, pickupCoords.lng);
      if (pickupGeocoded) {
        updates.pickup_google_address = pickupGeocoded.address;
        updates.pickup_google_place_name = pickupGeocoded.placeName;
        updates.pickup_google_place_id = pickupGeocoded.placeId;
      }
    }
    
    // Géocoder delivery
    if (deliveryCoords?.lat && deliveryCoords?.lng) {
      const deliveryGeocoded = await geocodeCoordinates(deliveryCoords.lat, deliveryCoords.lng);
      if (deliveryGeocoded) {
        updates.delivery_google_address = deliveryGeocoded.address;
        updates.delivery_google_place_name = deliveryGeocoded.placeName;
        updates.delivery_google_place_id = deliveryGeocoded.placeId;
      }
    }
    
    const { error: updateError } = await supabase
      .from('delivery_orders')
      .update(updates)
      .eq('id', order.id);

    if (updateError) {
      console.error(`Error updating delivery order ${order.id}:`, updateError);
    } else {
      console.log(`✅ Updated delivery order ${order.id}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  return { 
    processed: orders.length, 
    hasMore: orders.length === batchSize 
  };
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
    );

    const { table, batchSize = 50, startOffset = 0 }: MigrationRequest = await req.json();

    let migrationFunction;
    switch (table) {
      case 'driver_locations':
        migrationFunction = migrateDriverLocations;
        break;
      case 'transport_bookings':
        migrationFunction = migrateTransportBookings;
        break;
      case 'delivery_orders':
        migrationFunction = migrateDeliveryOrders;
        break;
      default:
        throw new Error(`Table not supported: ${table}`);
    }

    const result = await migrationFunction(supabase, batchSize, startOffset);

    return new Response(JSON.stringify({
      success: true,
      table,
      processed: result.processed,
      hasMore: result.hasMore,
      nextOffset: startOffset + result.processed,
      message: `Processed ${result.processed} records from ${table}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});