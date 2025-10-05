import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * VENDOR SUBSCRIPTION MANAGER
 * 
 * Cette Edge Function gère les abonnements pour les vendeurs marketplace.
 * STATUT: PRÉPARATION - Système actuellement INACTIF
 * 
 * Activation future prévue quand le modèle d'abonnement vendeurs sera lancé.
 */

interface VendorSubscriptionRequest {
  plan_id: string
  vendor_id: string
  payment_method: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // FEATURE FLAG: Vérifier si les abonnements vendeurs sont activés
    const VENDOR_SUBSCRIPTIONS_ENABLED = false // À activer plus tard

    if (!VENDOR_SUBSCRIPTIONS_ENABLED) {
      return new Response(JSON.stringify({ 
        error: 'Vendor subscriptions not yet available',
        message: 'Les abonnements vendeurs seront bientôt disponibles. Restez connecté !'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { plan_id, vendor_id, payment_method } = await req.json() as VendorSubscriptionRequest

    // TODO: Implémenter la logique d'abonnement vendeur
    // - Vérifier le plan dans vendor_subscription_plans
    // - Créer l'abonnement
    // - Traiter le paiement Mobile Money
    // - Activer les fonctionnalités du plan (max_products, analytics, etc.)

    return new Response(JSON.stringify({
      success: false,
      message: 'Feature under development'
    }), {
      status: 501,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('[Vendor Subscription] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})