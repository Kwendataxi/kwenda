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

    console.log('🔓 Releasing escrow for order:', orderId);

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
      console.error('❌ Order not found:', orderError);
      throw new Error('Commande non trouvée');
    }

    console.log('📦 Order found:', order.id, 'Status:', order.status);

    // Vérifier que la commande est complétée ou livrée
    if (!['completed', 'delivered'].includes(order.status)) {
      throw new Error('La commande doit être complétée avant de libérer les fonds');
    }

    // ✅ CORRECTION: Chercher dans escrow_payments au lieu de escrow_transactions
    const { data: escrowPayment, error: escrowError } = await supabaseClient
      .from('escrow_payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'held')
      .single();

    if (escrowError || !escrowPayment) {
      console.error('❌ No escrow payment found:', escrowError);
      throw new Error('Aucun paiement escrow en attente trouvé');
    }

    console.log('💰 Escrow payment found:', escrowPayment.id, 'Amount:', escrowPayment.amount);

    // Calculer les montants
    const totalAmount = escrowPayment.amount;
    const platformCommission = totalAmount * 0.05; // 5% commission
    const sellerAmount = totalAmount - platformCommission;

    console.log('📊 Amounts - Total:', totalAmount, 'Commission:', platformCommission, 'Seller:', sellerAmount);

    // Mettre à jour le paiement escrow
    const { error: escrowUpdateError } = await supabaseClient
      .from('escrow_payments')
      .update({
        status: 'released',
        released_at: new Date().toISOString()
      })
      .eq('id', escrowPayment.id);

    if (escrowUpdateError) {
      console.error('❌ Failed to update escrow:', escrowUpdateError);
      throw escrowUpdateError;
    }

    console.log('✅ Escrow status updated to released');

    // Récupérer ou créer le wallet vendeur
    const sellerId = escrowPayment.seller_id || order.marketplace_products.seller_id;
    
    let { data: wallet } = await supabaseClient
      .from('vendor_wallets')
      .select('*')
      .eq('vendor_id', sellerId)
      .eq('currency', escrowPayment.currency || 'CDF')
      .single();

    if (!wallet) {
      console.log('📝 Creating new vendor wallet');
      const { data: newWallet, error: createError } = await supabaseClient
        .from('vendor_wallets')
        .insert({
          vendor_id: sellerId,
          balance: 0,
          currency: escrowPayment.currency || 'CDF'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create wallet:', createError);
        throw createError;
      }
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

    if (walletUpdateError) {
      console.error('❌ Failed to update wallet:', walletUpdateError);
      throw walletUpdateError;
    }

    console.log('💳 Wallet updated. New balance:', wallet.balance + sellerAmount);

    // Créer transaction de crédit vendeur
    await supabaseClient
      .from('vendor_wallet_transactions')
      .insert({
        vendor_id: sellerId,
        transaction_type: 'credit',
        amount: sellerAmount,
        currency: escrowPayment.currency || 'CDF',
        description: `Vente - Commande #${orderId.substring(0, 8)}`,
        reference_id: orderId,
        reference_type: 'marketplace_order',
        status: 'completed'
      });

    // Créer transaction commission plateforme
    await supabaseClient
      .from('vendor_wallet_transactions')
      .insert({
        vendor_id: sellerId,
        transaction_type: 'commission',
        amount: -platformCommission,
        currency: escrowPayment.currency || 'CDF',
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
        user_id: sellerId,
        activity_type: 'escrow_release',
        description: `Paiement libéré: ${sellerAmount.toLocaleString()} FC (après commission 5%)`,
        reference_id: orderId,
        reference_type: 'marketplace_order',
        amount: sellerAmount,
        currency: escrowPayment.currency || 'CDF'
      });

    console.log('🎉 Escrow release completed successfully');

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
    console.error('❌ Error releasing escrow:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
