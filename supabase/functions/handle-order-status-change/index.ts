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

    const { orderId, newStatus, metadata = {} } = await req.json()

    console.log(`Updating order ${orderId} to status: ${newStatus}`)

    // Préparer les données de mise à jour selon le nouveau statut
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Ajouter les timestamps spécifiques selon le statut
    switch (newStatus) {
      case 'confirmed':
        updateData.confirmed_at = new Date().toISOString()
        break
      case 'preparing':
        updateData.preparing_at = new Date().toISOString()
        break
      case 'ready_for_pickup':
        updateData.ready_for_pickup_at = new Date().toISOString()
        break
      case 'in_transit':
        updateData.in_transit_at = new Date().toISOString()
        if (metadata.driver_id) {
          // Assigner le livreur si fourni
          const { error: assignmentError } = await supabaseClient
            .from('marketplace_delivery_assignments')
            .update({
              driver_id: metadata.driver_id,
              assignment_status: 'assigned'
            })
            .eq('order_id', orderId)
        }
        break
      case 'delivered':
        updateData.delivered_at = new Date().toISOString()
        if (metadata.driver_notes) {
          updateData.driver_notes = metadata.driver_notes
        }
        break
      case 'completed':
        updateData.completed_at = new Date().toISOString()
        updateData.payment_status = 'completed'
        break
    }

    // Calculer l'estimation de livraison
    if (['confirmed', 'preparing', 'ready_for_pickup', 'in_transit'].includes(newStatus)) {
      const { data: estimation } = await supabaseClient
        .rpc('calculate_delivery_estimate', { order_id_param: orderId })
      
      if (estimation) {
        updateData.estimated_delivery_time = estimation
      }
    }

    // Mettre à jour la commande
    const { data: order, error: orderError } = await supabaseClient
      .from('marketplace_orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        marketplace_products!inner(title, seller_id),
        marketplace_delivery_assignments(*)
      `)
      .single()

    if (orderError) {
      throw new Error(`Failed to update order: ${orderError.message}`)
    }

    // Actions spéciales selon le statut
    if (newStatus === 'in_transit' && order.delivery_method === 'delivery') {
      // Notifier le client du début de livraison avec estimation
      console.log('Order is now in transit, notifications will be sent via trigger')
    }

    if (newStatus === 'completed') {
      // Libérer le paiement escrow
      const { error: escrowError } = await supabaseClient
        .from('escrow_payments')
        .update({
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      if (escrowError) {
        console.error('Failed to release escrow payment:', escrowError)
      } else {
        console.log('Escrow payment released successfully')
      }

      // Appeler l'Edge Function pour traiter la commande complète
      try {
        await supabaseClient.functions.invoke('process-marketplace-order', {
          body: { orderId }
        })
      } catch (processError) {
        console.error('Failed to process completed order:', processError)
      }
    }

    // Broadcast real-time update
    const channel = supabaseClient.channel(`order-${orderId}`)
    await channel.send({
      type: 'broadcast',
      event: 'order_status_updated',
      payload: {
        order_id: orderId,
        new_status: newStatus,
        estimated_delivery: updateData.estimated_delivery_time,
        updated_at: updateData.updated_at
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId,
        newStatus,
        estimatedDelivery: updateData.estimated_delivery_time,
        order
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in handle-order-status-change:', error)
    
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