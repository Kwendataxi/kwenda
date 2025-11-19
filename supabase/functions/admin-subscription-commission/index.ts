import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_COMMISSION_RATE = 10.0 // 10% pour la plateforme Kwenda

interface CommissionRequest {
  subscription_id: string
  driver_id: string
  subscription_amount: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { subscription_id, driver_id, subscription_amount }: CommissionRequest = await req.json()

    console.log('[Admin Commission] 💰 Processing admin commission:', {
      subscription_id,
      driver_id,
      subscription_amount,
      commission_rate: ADMIN_COMMISSION_RATE
    })

    // Calculer la commission admin (10%)
    const commissionAmount = (subscription_amount * ADMIN_COMMISSION_RATE) / 100

    console.log(`[Admin Commission] Calculated: ${commissionAmount} CDF (${ADMIN_COMMISSION_RATE}%)`)

    // 1. Récupérer le premier admin actif (super_admin)
    const { data: adminUser, error: adminError } = await supabase
      .from('admins')
      .select('user_id, display_name')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (adminError || !adminUser) {
      console.error('[Admin Commission] ❌ No admin user found:', adminError)
      throw new Error('Admin principal introuvable')
    }

    console.log('[Admin Commission] ✅ Admin found:', adminUser.display_name)

    // 2. Récupérer ou créer le wallet admin CDF
    let { data: adminWallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('id, balance')
      .eq('user_id', adminUser.user_id)
      .eq('currency', 'CDF')
      .maybeSingle()

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('[Admin Commission] ❌ Error fetching admin wallet:', walletError)
      throw new Error('Erreur récupération wallet admin')
    }

    // Créer le wallet admin s'il n'existe pas
    if (!adminWallet) {
      console.log('[Admin Commission] Creating admin wallet...')
      const { data: newWallet, error: createError } = await supabase
        .from('user_wallets')
        .insert({
          user_id: adminUser.user_id,
          currency: 'CDF',
          balance: 0,
          bonus_balance: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('[Admin Commission] ❌ Error creating wallet:', createError)
        throw new Error('Impossible de créer le wallet admin')
      }

      adminWallet = newWallet
    }

    // 3. Créditer le wallet admin
    const newBalance = Number(adminWallet.balance) + commissionAmount

    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({ balance: newBalance })
      .eq('id', adminWallet.id)

    if (updateError) {
      console.error('[Admin Commission] ❌ Error updating wallet:', updateError)
      throw new Error('Erreur mise à jour wallet admin')
    }

    console.log(`[Admin Commission] ✅ Wallet credited: ${newBalance} CDF (+ ${commissionAmount})`)

    // 4. Logger la transaction dans wallet_transactions
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: adminWallet.id,
        user_id: adminUser.user_id,
        transaction_type: 'credit',
        amount: commissionAmount,
        currency: 'CDF',
        description: `Commission admin ${ADMIN_COMMISSION_RATE}% - Abonnement chauffeur`,
        reference_id: subscription_id,
        reference_type: 'admin_subscription_commission',
        status: 'completed'
      })
      .select()
      .single()

    if (transactionError) {
      console.error('[Admin Commission] ⚠️ Error logging transaction:', transactionError)
    }

    // 5. Enregistrer dans admin_subscription_earnings
    const { error: earningsError } = await supabase
      .from('admin_subscription_earnings')
      .insert({
        subscription_id,
        driver_id,
        subscription_amount,
        admin_commission_rate: ADMIN_COMMISSION_RATE,
        admin_commission_amount: commissionAmount,
        status: 'paid',
        wallet_transaction_id: transaction?.id
      })

    if (earningsError) {
      console.error('[Admin Commission] ⚠️ Error recording earnings:', earningsError)
    }

    console.log(`[Admin Commission] ✅ SUCCESS: ${commissionAmount} CDF credited to admin`)

    return new Response(
      JSON.stringify({
        success: true,
        commission_amount: commissionAmount,
        admin_wallet_balance: newBalance,
        message: `Commission admin de ${commissionAmount} CDF créditée avec succès`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('[Admin Commission] ❌ FATAL ERROR:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur interne lors du calcul de la commission admin'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
