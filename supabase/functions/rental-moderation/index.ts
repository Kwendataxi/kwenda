// Version: 2025-11-07T14:30:00Z - Rental moderation proxy deployment
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModerationPayload {
  action: 'approve' | 'reject'
  vehicle_id: string
  rejection_reason?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create client with user's JWT for auth check
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('❌ Authentication error:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User authenticated:', user.id)

    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role, admin_role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle()

    if (adminError || !adminCheck) {
      console.error('❌ Admin check failed:', adminError)
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Admin verified:', { userId: user.id, role: adminCheck.role, adminRole: adminCheck.admin_role })

    // Parse request body
    const { action, vehicle_id, rejection_reason }: ModerationPayload = await req.json()

    console.log('📝 Processing moderation:', { action, vehicle_id })

    // Use service role client to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Update vehicle status
    const updateData: any = {
      moderation_status: action === 'approve' ? 'approved' : 'rejected',
      moderator_id: user.id,
      moderated_at: new Date().toISOString(),
    }

    if (action === 'reject' && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    if (action === 'approve') {
      updateData.is_active = true
    }

    const { data: updatedVehicle, error: updateError } = await serviceClient
      .from('rental_vehicles')
      .update(updateData)
      .eq('id', vehicle_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the moderation action
    await serviceClient.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'rental_moderation',
      description: `Véhicule ${action === 'approve' ? 'approuvé' : 'rejeté'}: ${vehicle_id}`,
      reference_type: 'rental_vehicle',
      reference_id: vehicle_id,
      metadata: { action, rejection_reason }
    })

    console.log('✅ Moderation completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updatedVehicle,
        message: `Véhicule ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Fatal error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
