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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { orderId } = await req.json();

    console.log('Releasing escrow for order:', orderId);

    // Récupérer la commande
    const { data: order, error: orderError } = await supabaseClient
      .from('marketplace_orders')
      .select(`
        *,
        marketplace_products!inner(seller_id, price)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Commande non trouvée');
    }

    // Vérifier que la commande est complétée ou livrée
    if (!['completed', 'delivered'].includes(order.status)) {
      throw new Error('La commande doit être complétée avant de libérer les fonds');
    }

    // Récupérer le paiement escrow depuis escrow_transactions
    const { data: escrowTransaction, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'held')
      .single();

    if (escrowError || !escrowTransaction) {
      throw new Error('Aucun paiement escrow en attente trouvé');
    }

    // Utiliser les montants pré-calculés dans escrow_transactions
    const platformCommission = escrowTransaction.platform_fee || (order.total_amount * 0.05);
    const sellerAmount = escrowTransaction.seller_amount || (order.total_amount - platformCommission);

    // Mettre à jour le paiement escrow
    const { error: escrowUpdateError } = await supabaseClient
      .from('escrow_transactions')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', escrowTransaction.id);

    if (escrowUpdateError) throw escrowUpdateError;

    // Récupérer ou créer le wallet vendeur
    let { data: wallet } = await supabaseClient
      .from('vendor_wallets')
      .select('*')
      .eq('vendor_id', order.marketplace_products.seller_id)
      .eq('currency', 'CDF')
      .single();

    if (!wallet) {
      const { data: newWallet, error: createError } = await supabaseClient
        .from('vendor_wallets')
        .insert({
          vendor_id: order.marketplace_products.seller_id,
          balance: 0,
          currency: 'CDF'
        })
        .select()
        .single();

      if (createError) throw createError;
      wallet = newWallet;
    }

    // Mettre à jour le solde vendeur
    const { error: walletUpdateError } = await supabaseClient
      .from('vendor_wallets')
      .update({
        balance: wallet.balance + sellerAmount,
        total_earned: (wallet.total_earned || 0) + sellerAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    if (walletUpdateError) throw walletUpdateError;

    // Mettre à jour la transaction vendeur
    const { error: transactionError } = await supabaseClient
      .from('vendor_wallet_transactions')
      .update({
        status: 'completed',
        amount: sellerAmount
      })
      .eq('reference_id', orderId)
      .eq('vendor_id', order.marketplace_products.seller_id);

    if (transactionError) {
      console.error('Transaction update error:', transactionError);
    }

    // Créer transaction commission plateforme
    await supabaseClient
      .from('vendor_wallet_transactions')
      .insert({
        vendor_id: order.marketplace_products.seller_id,
        transaction_type: 'commission',
        amount: -platformCommission,
        currency: 'CDF',
        description: `Commission plateforme (5%) - Commande #${orderId.substring(0, 8)}`,
        reference_id: orderId,
        reference_type: 'marketplace_order',
        status: 'completed'
      });

    // Mettre à jour le statut de revenus de la commande
    await supabaseClient
      .from('marketplace_orders')
      .update({
        revenue_status: 'released',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // Logger l'activité
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: order.marketplace_products.seller_id,
        activity_type: 'escrow_release',
        description: `Paiement libéré: ${sellerAmount.toLocaleString()} FC (après commission)`,
        reference_id: orderId,
        reference_type: 'marketplace_order',
        amount: sellerAmount,
        currency: 'CDF'
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Paiement libéré avec succès',
        sellerAmount,
        platformCommission 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error releasing escrow:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
