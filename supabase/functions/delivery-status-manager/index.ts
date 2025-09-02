import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatusUpdateRequest {
  orderId: string;
  newStatus: 'confirmed' | 'driver_assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  driverId?: string;
  locationCoordinates?: { lat: number; lng: number };
  driverNotes?: string;
  recipientSignature?: string;
  deliveryPhotoUrl?: string;
  deliveryProof?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, newStatus, driverId, locationCoordinates, driverNotes, recipientSignature, deliveryPhotoUrl, deliveryProof }: StatusUpdateRequest = await req.json()

    console.log(`Updating delivery order ${orderId} to status: ${newStatus}`)

    // Préparer les données de mise à jour
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Ajouter les timestamps spécifiques selon le statut
    const now = new Date().toISOString()
    switch (newStatus) {
      case 'confirmed':
        updateData.confirmed_at = now
        break
      case 'driver_assigned':
        updateData.driver_assigned_at = now
        if (driverId) {
          updateData.driver_id = driverId
        }
        break
      case 'picked_up':
        updateData.picked_up_at = now
        if (driverNotes) updateData.driver_notes = driverNotes
        break
      case 'in_transit':
        updateData.in_transit_at = now
        break
      case 'delivered':
        updateData.delivered_at = now
        if (deliveryProof) updateData.delivery_proof = deliveryProof
        if (recipientSignature) updateData.recipient_signature = recipientSignature
        if (deliveryPhotoUrl) updateData.delivery_photo_url = deliveryPhotoUrl
        if (driverNotes) updateData.driver_notes = driverNotes
        break
      case 'cancelled':
        updateData.cancelled_at = now
        break
    }

    // Mettre à jour la commande de livraison
    const { data: order, error: orderError } = await supabase
      .from('delivery_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (orderError) {
      throw new Error(`Failed to update delivery order: ${orderError.message}`)
    }

    console.log(`Delivery order ${orderId} updated successfully to ${newStatus}`)

    // Enregistrer dans l'historique avec localisation si fournie
    const historyData: any = {
      delivery_order_id: orderId,
      status: newStatus,
      changed_by: driverId || null,
      notes: `Status changed to ${newStatus}${driverNotes ? ` - ${driverNotes}` : ''}`
    }

    if (locationCoordinates) {
      historyData.location_coordinates = locationCoordinates
    }

    const { error: historyError } = await supabase
      .from('delivery_status_history')
      .insert(historyData)

    if (historyError) {
      console.error('Failed to record status history:', historyError)
    }

    // Envoyer des notifications selon le statut
    let notificationTitle = ''
    let notificationMessage = ''

    switch (newStatus) {
      case 'confirmed':
        notificationTitle = 'Commande confirmée'
        notificationMessage = 'Votre demande de livraison a été acceptée'
        break
      case 'driver_assigned':
        notificationTitle = 'Livreur assigné'
        notificationMessage = 'Un livreur se dirige vers le point de retrait'
        break
      case 'picked_up':
        notificationTitle = 'Colis récupéré'
        notificationMessage = 'Le livreur a récupéré votre colis'
        break
      case 'in_transit':
        notificationTitle = 'En cours de livraison'
        notificationMessage = 'Le colis est en route vers la destination'
        break
      case 'delivered':
        notificationTitle = 'Livré'
        notificationMessage = 'Colis livré avec succès'
        break
      case 'cancelled':
        notificationTitle = 'Livraison annulée'
        notificationMessage = 'Votre livraison a été annulée'
        break
    }

    // Créer une notification pour le client
    if (notificationTitle && order.user_id) {
      const { error: notificationError } = await supabase
        .from('user_notifications')
        .insert({
          user_id: order.user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'delivery_update',
          metadata: {
            delivery_order_id: orderId,
            status: newStatus,
            timestamp: now
          }
        })

      if (notificationError) {
        console.error('Failed to create notification:', notificationError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order,
        message: `Delivery status updated to ${newStatus}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in delivery-status-manager:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})