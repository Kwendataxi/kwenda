import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Récupérer l'utilisateur authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization required');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error('Utilisateur non authentifié');

    const { orderId, rating, feedback } = await req.json();

    console.log('🍽️ Releasing food escrow for order:', orderId, 'by user:', user.id);

    // Récupérer la commande food
    const { data: order, error: orderError } = await supabaseClient
      .from('food_orders')
      .select(`
        *,
        restaurant_profiles (
          id,
          user_id,
          restaurant_name
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      throw new Error('Commande non trouvée');
    }

    // Vérifier que c'est bien le client qui confirme
    if (order.user_id !== user.id) {
      throw new Error('Vous ne pouvez confirmer que vos propres commandes');
    }

    // Vérifier que la commande est livrée
    if (order.status !== 'delivered') {
      throw new Error('La commande doit être livrée avant confirmation');
    }

    const restaurantUserId = order.restaurant_profiles?.user_id;
    if (!restaurantUserId) {
      throw new Error('Restaurant non trouvé');
    }

    // Vérifier l'escrow existant
    const { data: existingEscrow, error: escrowCheckError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('order_id', orderId)
      .eq('transaction_type', 'food_order')
      .eq('status', 'held')
      .maybeSingle();

    if (escrowCheckError) {
      console.error('Escrow check error:', escrowCheckError);
    }

    // Calculer les montants
    const totalAmount = order.total_amount;
    const platformFee = totalAmount * 0.05; // 5% commission
    const restaurantAmount = totalAmount - platformFee;

    console.log('💰 Amounts:', { total: totalAmount, platform: platformFee, restaurant: restaurantAmount });

    // Si escrow existe, le libérer
    if (existingEscrow) {
      const { error: escrowUpdateError } = await supabaseClient
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingEscrow.id);

      if (escrowUpdateError) {
        console.error('Escrow update error:', escrowUpdateError);
      }
    }

    // Récupérer ou créer le wallet restaurant
    let { data: wallet } = await supabaseClient
      .from('restaurant_wallets')
      .select('*')
      .eq('restaurant_id', order.restaurant_id)
      .single();

    if (!wallet) {
      // Créer wallet restaurant si n'existe pas
      const { data: newWallet, error: createError } = await supabaseClient
        .from('restaurant_wallets')
        .insert({
          restaurant_id: order.restaurant_id,
          balance: 0,
          currency: 'CDF',
          total_earned: 0,
          total_withdrawn: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Wallet creation error:', createError);
        // Fallback: utiliser vendor_wallets
        const { data: vendorWallet } = await supabaseClient
          .from('vendor_wallets')
          .select('*')
          .eq('vendor_id', restaurantUserId)
          .eq('currency', 'CDF')
          .single();

        if (!vendorWallet) {
          const { data: newVendorWallet, error: vendorCreateError } = await supabaseClient
            .from('vendor_wallets')
            .insert({
              vendor_id: restaurantUserId,
              balance: 0,
              currency: 'CDF',
              total_earned: 0,
              total_withdrawn: 0,
              is_active: true
            })
            .select()
            .single();

          if (vendorCreateError) throw vendorCreateError;
          wallet = newVendorWallet;
        } else {
          wallet = vendorWallet;
        }
      } else {
        wallet = newWallet;
      }
    }

    // Créditer le wallet (utiliser la bonne table)
    const walletTable = wallet.restaurant_id ? 'restaurant_wallets' : 'vendor_wallets';
    const walletIdField = wallet.restaurant_id ? 'restaurant_id' : 'vendor_id';
    const walletIdValue = wallet.restaurant_id || restaurantUserId;

    const { error: walletUpdateError } = await supabaseClient
      .from(walletTable)
      .update({
        balance: (wallet.balance || 0) + restaurantAmount,
        total_earned: (wallet.total_earned || 0) + restaurantAmount,
        updated_at: new Date().toISOString()
      })
      .eq(walletIdField, walletIdValue);

    if (walletUpdateError) {
      console.error('Wallet update error:', walletUpdateError);
      throw walletUpdateError;
    }

    // Mettre à jour la commande
    const updateData: Record<string, any> = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (rating !== undefined) updateData.customer_rating = rating;
    if (feedback) updateData.customer_feedback = feedback;

    const { error: orderUpdateError } = await supabaseClient
      .from('food_orders')
      .update(updateData)
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('Order update error:', orderUpdateError);
      throw orderUpdateError;
    }

    // Logger l'activité
    await supabaseClient.from('activity_logs').insert({
      user_id: restaurantUserId,
      activity_type: 'food_escrow_released',
      description: `Paiement reçu pour commande #${order.order_number}: ${restaurantAmount.toLocaleString()} CDF`,
      amount: restaurantAmount,
      currency: 'CDF',
      reference_id: orderId,
      reference_type: 'food_order'
    });

    // Notifier le restaurant
    await supabaseClient.from('system_notifications').insert({
      user_id: restaurantUserId,
      title: '💰 Paiement reçu',
      message: `Client a confirmé la réception. ${restaurantAmount.toLocaleString()} CDF crédités sur votre compte.`,
      notification_type: 'food_payment',
      data: { order_id: orderId, amount: restaurantAmount }
    });

    console.log('✅ Food escrow released successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paiement libéré avec succès',
        restaurantAmount,
        platformFee
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error releasing food escrow:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
