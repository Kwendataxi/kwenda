import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId } = await req.json()

    console.log(`Processing marketplace order ${orderId}`)

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_products!inner(title, seller_id),
        escrow_payments!inner(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      throw new Error(`Failed to fetch order: ${orderError.message}`)
    }

    // Check if this is a delivery order
    if (order.delivery_method !== 'pickup') {
      // Create delivery assignment for internal drivers
      const { data: assignment, error: assignmentError } = await supabaseClient
        .from('marketplace_delivery_assignments')
        .insert({
          order_id: orderId,
          pickup_location: `Vendeur: ${order.marketplace_products.title}`,
          delivery_location: order.delivery_address,
          pickup_coordinates: order.pickup_coordinates,
          delivery_coordinates: order.delivery_coordinates,
          assignment_status: 'pending',
          delivery_fee: calculateDeliveryFee(order.delivery_coordinates)
        })
        .select()
        .single()

      if (assignmentError) {
        console.error('Failed to create delivery assignment:', assignmentError)
      } else {
        console.log('Created delivery assignment:', assignment.id)

        // Find available drivers in the area
        const { data: availableDrivers, error: driversError } = await supabaseClient
          .from('profiles')
          .select('user_id, display_name')
          .eq('user_type', 'chauffeur')
          .limit(10)

        if (!driversError && availableDrivers?.length > 0) {
          // For now, assign to the first available driver
          // In a real implementation, you'd use location-based matching
          const selectedDriver = availableDrivers[0]

          await supabaseClient
            .from('marketplace_delivery_assignments')
            .update({ 
              driver_id: selectedDriver.user_id,
              assignment_status: 'assigned' 
            })
            .eq('id', assignment.id)

          console.log(`Assigned delivery to driver: ${selectedDriver.display_name}`)
        }
      }
    }

    // Calculate and distribute commissions
    const totalAmount = order.total_amount
    const commissionData = await calculateCommissions(totalAmount, order)

    // Record commission transactions
    for (const commission of commissionData) {
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          user_id: commission.user_id,
          wallet_id: commission.wallet_id,
          transaction_type: 'commission',
          amount: commission.amount,
          currency: 'CDF',
          description: `Commission - Commande ${orderId}`,
          reference_id: orderId,
          reference_type: 'marketplace_order',
          balance_before: commission.balance_before,
          balance_after: commission.balance_after
        })
    }

    // Update order status
    await supabaseClient
      .from('marketplace_orders')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId,
        commissions: commissionData.length,
        deliveryAssigned: order.delivery_method !== 'pickup'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in process-marketplace-order:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

function calculateDeliveryFee(coordinates: any): number {
  // Simple distance-based calculation
  // In a real implementation, you'd use proper geolocation services
  return 5000; // 5000 FC base fee
}

async function calculateCommissions(totalAmount: number, order: any): Promise<any[]> {
  // Get commission settings
  const platformRate = 0.05; // 5%
  const adminRate = 0.10; // 10%
  const sellerRate = 0.85; // 85%

  const platformCommission = totalAmount * platformRate;
  const adminCommission = totalAmount * adminRate;
  const sellerAmount = totalAmount * sellerRate;

  return [
    {
      user_id: 'system',
      wallet_id: 'platform',
      amount: platformCommission,
      balance_before: 0,
      balance_after: platformCommission,
      type: 'platform_commission'
    },
    {
      user_id: order.seller_id,
      wallet_id: order.seller_id, // Simplified
      amount: sellerAmount,
      balance_before: 0, // Would fetch actual balance
      balance_after: sellerAmount,
      type: 'seller_payment'
    }
  ];
}