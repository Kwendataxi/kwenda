import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

    const { action, orderId, escrowId, confirmationData, withdrawalId, rejectionReason, withdrawalIds, adminReference, adminNotes } = await req.json();

    console.log(`Escrow action: ${action}`, { orderId, escrowId, withdrawalId, withdrawalIds, adminReference });

    switch (action) {
      case 'create_escrow':
        return await createEscrowTransaction(supabaseClient, orderId);
      
      case 'confirm_delivery':
        return await confirmDeliveryAndRelease(supabaseClient, escrowId, confirmationData);
      
      case 'process_withdrawal':
        return await processWithdrawal(supabaseClient, confirmationData);
      
      case 'get_escrow_status':
        return await getEscrowStatus(supabaseClient, orderId);

      case 'approve_withdrawal':
        return await approveWithdrawal(supabaseClient, withdrawalId, adminReference, adminNotes);

      case 'reject_withdrawal':
        return await rejectWithdrawal(supabaseClient, withdrawalId, rejectionReason);

      case 'batch_approve_withdrawals':
        return await batchApproveWithdrawals(supabaseClient, withdrawalIds);
        
      default:
        throw new Error('Action invalide');
    }

  } catch (error) {
    console.error('Erreur escrow:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
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

  console.log('Processing withdrawal (manual flow):', { userId, amount, withdrawalMethod });

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

  // Toutes les demandes sont en attente (100% manuel)
  const status = 'pending';

  console.log(`Withdrawal PENDING (manual processing): ${amount} CDF`);

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
      status: status,
      auto_approved: false
    })
    .select()
    .single();

  if (withdrawalError) {
    throw new Error('Erreur création demande retrait: ' + withdrawalError.message);
  }

  // Débiter le portefeuille
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
      description: `Retrait en attente - ${paymentDetails.mobileMoneyProvider || withdrawalMethod}`,
      reference_id: withdrawal.id,
      reference_type: 'withdrawal_request'
    });

  console.log('Demande de retrait créée:', withdrawal.id, 'Status:', status);

  return new Response(
    JSON.stringify({ 
      success: true, 
      withdrawal,
      isAutoApproved: false,
      message: 'Demande de retrait soumise. Traitement sous 1-24h par notre équipe.'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Marquer une demande comme payée (paiement effectué manuellement par l'admin)
async function approveWithdrawal(supabase: any, withdrawalId: string, adminReference?: string, adminNotes?: string) {
  console.log('Marking withdrawal as PAID:', withdrawalId);

  // Récupérer la demande
  const { data: withdrawal, error: fetchError } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('id', withdrawalId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !withdrawal) {
    throw new Error('Demande de retrait introuvable ou déjà traitée');
  }

  // Mettre à jour le statut vers 'paid'
  const { error: updateError } = await supabase
    .from('withdrawal_requests')
    .update({
      status: 'paid',
      processed_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      admin_reference: adminReference || null,
      admin_notes: adminNotes || null
    })
    .eq('id', withdrawalId);

  if (updateError) {
    throw new Error('Erreur lors du marquage: ' + updateError.message);
  }

  // Envoyer notification de succès
  await supabase.from('delivery_notifications').insert({
    user_id: withdrawal.user_id,
    notification_type: 'withdrawal_paid',
    title: '💰 Paiement effectué',
    message: `Votre retrait de ${withdrawal.amount.toLocaleString()} CDF a été envoyé vers ${withdrawal.mobile_money_phone}`
  });

  console.log('Withdrawal marked as PAID:', withdrawalId);

  return new Response(
    JSON.stringify({ success: true, message: 'Retrait marqué comme payé' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Rejeter une demande de retrait et rembourser (gère vendeurs ET chauffeurs)
async function rejectWithdrawal(supabase: any, withdrawalId: string, reason: string) {
  console.log('Rejecting withdrawal:', withdrawalId, reason);

  // Récupérer la demande
  const { data: withdrawal, error: fetchError } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('id', withdrawalId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !withdrawal) {
    throw new Error('Demande de retrait introuvable ou déjà traitée');
  }

  const isSeller = withdrawal.user_type === 'seller';
  console.log(`User type: ${withdrawal.user_type}, isSeller: ${isSeller}`);

  if (isSeller) {
    // ✅ Pour les vendeurs: utiliser vendor_wallets
    const { data: vendorWallet, error: vendorWalletError } = await supabase
      .from('vendor_wallets')
      .select('*')
      .eq('vendor_id', withdrawal.user_id)
      .single();

    if (vendorWalletError || !vendorWallet) {
      throw new Error('Wallet vendeur introuvable');
    }

    // Rembourser le solde vendeur
    await supabase
      .from('vendor_wallets')
      .update({ 
        balance: vendorWallet.balance + withdrawal.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorWallet.id);

    // Créer la transaction de remboursement dans vendor_wallet_transactions
    await supabase
      .from('vendor_wallet_transactions')
      .insert({
        wallet_id: vendorWallet.id,
        vendor_id: withdrawal.user_id,
        transaction_type: 'refund',
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        description: `Remboursement retrait rejeté: ${reason || 'Non spécifié'}`,
        reference_id: withdrawalId,
        reference_type: 'withdrawal_request',
        status: 'completed'
      });

    console.log('Vendor wallet refunded:', vendorWallet.id);
  } else {
    // Pour les chauffeurs/clients: utiliser user_wallets
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', withdrawal.user_id)
      .eq('currency', withdrawal.currency)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet utilisateur introuvable');
    }

    // Rembourser le solde
    await supabase
      .from('user_wallets')
      .update({ 
        balance: wallet.balance + withdrawal.amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);

    // Créer la transaction de remboursement
    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: withdrawal.user_id,
        transaction_type: 'withdrawal_refund',
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        description: `Remboursement retrait rejeté: ${reason || 'Non spécifié'}`,
        reference_id: withdrawalId,
        reference_type: 'withdrawal_request'
      });

    console.log('User wallet refunded:', wallet.id);
  }

  // Mettre à jour le statut de la demande
  await supabase
    .from('withdrawal_requests')
    .update({
      status: 'rejected',
      failure_reason: reason || 'Rejeté par l\'administrateur',
      processed_at: new Date().toISOString()
    })
    .eq('id', withdrawalId);

  // Envoyer notification
  await supabase.from('delivery_notifications').insert({
    user_id: withdrawal.user_id,
    notification_type: 'withdrawal_rejected',
    title: '❌ Retrait rejeté',
    message: `Votre retrait a été rejeté: ${reason || 'Non spécifié'}. Le montant a été remboursé.`
  });

  console.log('Withdrawal rejected and refunded:', withdrawalId);

  return new Response(
    JSON.stringify({ success: true, message: 'Retrait rejeté et montant remboursé' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Marquage en lot comme payé
async function batchApproveWithdrawals(supabase: any, withdrawalIds: string[]) {
  console.log('Batch marking as PAID:', withdrawalIds.length);

  if (!withdrawalIds || withdrawalIds.length === 0) {
    throw new Error('Aucune demande sélectionnée');
  }

  const results = {
    paid: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const id of withdrawalIds) {
    try {
      // Récupérer la demande
      const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', id)
        .eq('status', 'pending')
        .single();

      if (fetchError || !withdrawal) {
        results.failed++;
        results.errors.push(`${id}: Introuvable ou déjà traitée`);
        continue;
      }

      // Mettre à jour le statut vers 'paid'
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'paid',
          processed_at: new Date().toISOString(),
          paid_at: new Date().toISOString()
        })
        .eq('id', id);

      // Envoyer notification
      await supabase.from('delivery_notifications').insert({
        user_id: withdrawal.user_id,
        notification_type: 'withdrawal_paid',
        title: '💰 Paiement effectué',
        message: `Votre retrait de ${withdrawal.amount.toLocaleString()} CDF a été envoyé vers ${withdrawal.mobile_money_phone}`
      });

      results.paid++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${id}: ${error instanceof Error ? error.message : 'Erreur'}`);
    }
  }

  console.log('Batch marking complete:', results);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `${results.paid} retrait(s) marqué(s) comme payé(s), ${results.failed} échec(s)`,
      results
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
