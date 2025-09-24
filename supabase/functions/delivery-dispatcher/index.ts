import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryOrder {
  id: string;
  pickup_coordinates: any;
  delivery_coordinates: any;
  delivery_type: string;
  estimated_price: number;
  user_id: string;
  sender_phone?: string;
  recipient_phone?: string;
  sender_name?: string;
  recipient_name?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, pickupLat, pickupLng, deliveryType } = await req.json();

    console.log(`🚚 Looking for driver for delivery order ${orderId}`);
    console.log(`📍 Pickup location: ${pickupLat}, ${pickupLng}`);
    console.log(`🚛 Delivery type: ${deliveryType}`);

    // Find nearby available drivers within 15km - Using correct parameters
    const { data: drivers, error: driversError } = await supabase.rpc('find_nearby_drivers', {
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      service_type_param: 'delivery',
      radius_km: 15
    });

    if (driversError) {
      console.error('❌ Error finding drivers:', driversError);
      throw driversError;
    }

    if (!drivers || drivers.length === 0) {
      console.log('❌ No drivers available for delivery');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun livreur disponible dans votre zone',
          drivers_searched: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Found ${drivers.length} available drivers`);
    
    // Select the closest driver
    const selectedDriver = drivers[0];
    
    console.log(`🎯 Assigning driver ${selectedDriver.driver_id} (${selectedDriver.distance_km}km away)`);

    // Update the delivery order with driver assignment
    const { error: updateError } = await supabase
      .from('delivery_orders')
      .update({
        driver_id: selectedDriver.driver_id,
        status: 'driver_assigned',
        driver_assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('❌ Error updating delivery order:', updateError);
      throw updateError;
    }

    // Mark driver as unavailable
    const { error: locationError } = await supabase
      .from('driver_locations')
      .update({
        is_available: false,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', selectedDriver.driver_id);

    if (locationError) {
      console.warn('⚠️ Could not update driver availability:', locationError);
    }

    // Get delivery order details for notification
    const { data: orderDetails, error: orderError } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.warn('⚠️ Could not get order details:', orderError);
    }

    // Create notification for the driver with contact information
    const notificationData = {
      user_id: selectedDriver.driver_id,
      title: `Nouvelle livraison ${deliveryType.toUpperCase()}`,
      message: `Nouvelle commande de livraison assignée. Distance: ${selectedDriver.distance_km.toFixed(1)}km`,
      notification_type: 'delivery_assignment',
      delivery_order_id: orderId,
      metadata: {
        orderId,
        deliveryType,
        distance: selectedDriver.distance_km,
        estimatedPrice: orderDetails?.estimated_price,
        pickupLocation: orderDetails?.pickup_location,
        deliveryLocation: orderDetails?.delivery_location,
        senderName: orderDetails?.sender_name,
        senderPhone: orderDetails?.sender_phone,
        recipientName: orderDetails?.recipient_name,
        recipientPhone: orderDetails?.recipient_phone
      }
    };

    const { error: notificationError } = await supabase
      .from('delivery_notifications')
      .insert([notificationData]);

    if (notificationError) {
      console.warn('⚠️ Could not create notification:', notificationError);
    }

    // Log the assignment in delivery status history
    const { error: historyError } = await supabase
      .from('delivery_status_history')
      .insert([{
        delivery_order_id: orderId,
        status: 'driver_assigned',
        previous_status: 'pending',
        changed_by: null, // System assignment
        metadata: {
          driver_id: selectedDriver.driver_id,
          assignment_method: 'automatic',
          distance_km: selectedDriver.distance_km
        },
        notes: `Livreur assigné automatiquement - Distance: ${selectedDriver.distance_km.toFixed(1)}km`
      }]);

    if (historyError) {
      console.warn('⚠️ Could not log status history:', historyError);
    }

    console.log('✅ Driver assignment completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        driver: {
          id: selectedDriver.driver_id,
          distance: selectedDriver.distance_km,
          vehicle_class: selectedDriver.vehicle_class
        },
        message: 'Livreur assigné avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Delivery dispatcher error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Erreur lors de l\'assignation du livreur'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});