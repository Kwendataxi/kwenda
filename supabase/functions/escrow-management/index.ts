import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, orderId, escrowId, confirmationData } = await req.json();

    console.log(`Escrow action: ${action}`, { orderId, escrowId });

    switch (action) {
      case 'create_escrow':
        return await createEscrowTransaction(supabaseClient, orderId);
      
      case 'confirm_delivery':
        return await confirmDeliveryAndRelease(supabaseClient, escrowId, confirmationData);
      
      case 'process_withdrawal':
        return await processWithdrawal(supabaseClient, confirmationData);
      
      case 'get_escrow_status':
        return await getEscrowStatus(supabaseClient, orderId);
        
      default:
        throw new Error('Action invalide');
    }

  } catch (error) {
    console.error('Erreur escrow:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createEscrowTransaction(supabase: any, orderId: string) {
  // Récupérer les détails de la commande
  const { data: order, error: orderError } = await supabase
    .from('marketplace_orders')
    .select(`
      *,
      marketplace_delivery_assignments(driver_id)
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('Commande introuvable');
  }

  // Calculer la répartition des montants
  const totalAmount = order.total_amount;
  const platformFeeRate = 0.05; // 5% commission plateforme
  const deliveryFeeRate = 0.15; // 15% pour livraison
  
  const platformFee = totalAmount * platformFeeRate;
  const driverAmount = order.marketplace_delivery_assignments?.[0] ? totalAmount * deliveryFeeRate : 0;
  const sellerAmount = totalAmount - platformFee - driverAmount;

  // Créer la transaction escrow
  const { data: escrow, error: escrowError } = await supabase
    .from('escrow_transactions')
    .insert({
      order_id: orderId,
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      driver_id: order.marketplace_delivery_assignments?.[0]?.driver_id || null,
      total_amount: totalAmount,
      seller_amount: sellerAmount,
      driver_amount: driverAmount,
      platform_fee: platformFee,
      currency: 'CDF',
      status: 'held'
    })
    .select()
    .single();

  if (escrowError) {
    throw new Error('Erreur création escrow: ' + escrowError.message);
  }

  // Créer les notifications
  await supabase.from('escrow_notifications').insert([
    {
      user_id: order.buyer_id,
      escrow_transaction_id: escrow.id,
      notification_type: 'escrow_created',
      title: 'Paiement sécurisé',
      message: 'Votre paiement est conservé en sécurité jusqu\'à la livraison'
    },
    {
      user_id: order.seller_id,
      escrow_transaction_id: escrow.id,
      notification_type: 'escrow_created',
      title: 'Commande sécurisée',
      message: 'Le paiement client est en escrow, préparez la commande'
    }
  ]);

  console.log('Escrow créé:', escrow.id);

  return new Response(
    JSON.stringify({ success: true, escrow }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function confirmDeliveryAndRelease(supabase: any, escrowId: string, confirmationData: any) {
  const { confirmationCode, clientConfirmed } = confirmationData;

  if (!clientConfirmed) {
    throw new Error('Confirmation client requise');
  }

  // Vérifier la transaction escrow
  const { data: escrow, error: escrowError } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('id', escrowId)
    .eq('status', 'held')
    .single();

  if (escrowError || !escrow) {
    throw new Error('Transaction escrow introuvable');
  }

  // Appeler la fonction de libération des fonds
  const { data: releaseResult, error: releaseError } = await supabase
    .rpc('process_escrow_release', { escrow_id: escrowId });

  if (releaseError || !releaseResult) {
    throw new Error('Erreur libération fonds: ' + releaseError?.message);
  }

  // Mettre à jour le statut de la commande
  await supabase
    .from('marketplace_orders')
    .update({ status: 'completed' })
    .eq('id', escrow.order_id);

  console.log('Fonds libérés pour escrow:', escrowId);

  return new Response(
    JSON.stringify({ success: true, message: 'Fonds libérés avec succès' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processWithdrawal(supabase: any, withdrawalData: any) {
  const { userId, amount, withdrawalMethod, paymentDetails } = withdrawalData;

  // Vérifier le solde du portefeuille
  const { data: wallet, error: walletError } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('currency', 'CDF')
    .single();

  if (walletError || !wallet || wallet.balance < amount) {
    throw new Error('Solde insuffisant');
  }

  // Créer la demande de retrait
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: userId,
      user_type: paymentDetails.userType,
      amount: amount,
      currency: 'CDF',
      withdrawal_method: withdrawalMethod,
      kwenda_pay_phone: paymentDetails.kwendaPayPhone,
      mobile_money_provider: paymentDetails.mobileMoneyProvider,
      mobile_money_phone: paymentDetails.mobileMoneyPhone,
      status: 'pending'
    })
    .select()
    .single();

  if (withdrawalError) {
    throw new Error('Erreur création demande retrait: ' + withdrawalError.message);
  }

  // Débiter temporairement le portefeuille (en attente de traitement)
  await supabase
    .from('user_wallets')
    .update({ 
      balance: wallet.balance - amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id);

  // Créer l'enregistrement de transaction
  await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      transaction_type: 'withdrawal_pending',
      amount: -amount,
      currency: 'CDF',
      description: `Retrait en cours - ${withdrawalMethod}`,
      reference_id: withdrawal.id,
      reference_type: 'withdrawal_request'
    });

  console.log('Demande de retrait créée:', withdrawal.id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      withdrawal,
      message: 'Demande de retrait soumise, traitement en cours' 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getEscrowStatus(supabase: any, orderId: string) {
  const { data: escrow, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error) {
    throw new Error('Escrow introuvable');
  }

  return new Response(
    JSON.stringify({ escrow }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}