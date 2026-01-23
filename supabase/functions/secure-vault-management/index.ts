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

    const { action, orderId, escrowId, transactionId, confirmationData } = await req.json();

    console.log(`🔒 Coffre sécurisé action: ${action}`, { orderId, escrowId, transactionId });

    switch (action) {
      case 'create_vault':
        return await createSecureVaultTransaction(supabaseClient, orderId);
      
      case 'confirm_delivery':
        return await confirmDeliveryAndRelease(supabaseClient, escrowId || transactionId, confirmationData);
      
      case 'process_withdrawal':
        return await processSecureWithdrawal(supabaseClient, confirmationData);
      
      case 'get_vault_status':
        return await getVaultStatus(supabaseClient, orderId);

      case 'auto_release_timeout':
        return await processAutoRelease(supabaseClient, escrowId || transactionId);
        
      default:
        throw new Error('Action invalide pour le coffre sécurisé');
    }

  } catch (error) {
    console.error('❌ Erreur coffre sécurisé:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createSecureVaultTransaction(supabase: any, orderId: string) {
  console.log('🔒 Création coffre sécurisé pour commande:', orderId);

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
    throw new Error('Commande introuvable pour le coffre sécurisé');
  }

  // Calculer la répartition sécurisée des montants
  const totalAmount = order.total_amount;
  const platformFeeRate = 0.05; // 5% commission plateforme Kwenda
  const deliveryFeeRate = 0.15; // 15% pour livraison
  const sellerRate = 0.80; // 80% pour le vendeur
  
  const platformFee = totalAmount * platformFeeRate;
  const driverAmount = order.marketplace_delivery_assignments?.[0] ? totalAmount * deliveryFeeRate : 0;
  const sellerAmount = totalAmount * sellerRate;

  // Calculer la date d'expiration automatique (7 jours)
  const timeoutDate = new Date();
  timeoutDate.setDate(timeoutDate.getDate() + 7);

  // Créer la transaction dans le coffre sécurisé
  const { data: vaultTransaction, error: vaultError } = await supabase
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
      status: 'held',
      timeout_date: timeoutDate.toISOString()
    })
    .select()
    .single();

  if (vaultError) {
    throw new Error('Erreur création coffre sécurisé: ' + vaultError.message);
  }

  // Créer les notifications sécurisées
  await supabase.from('escrow_notifications').insert([
    {
      user_id: order.buyer_id,
      escrow_transaction_id: vaultTransaction.id,
      notification_type: 'vault_secured',
      title: '🔒 Paiement sécurisé',
      message: 'Votre paiement est conservé dans le coffre sécurisé KwendaPay jusqu\'à la livraison'
    },
    {
      user_id: order.seller_id,
      escrow_transaction_id: vaultTransaction.id,
      notification_type: 'vault_secured',
      title: '💰 Commande sécurisée',
      message: 'Le paiement client est protégé dans le coffre sécurisé, préparez la commande'
    }
  ]);

  console.log('✅ Coffre sécurisé créé:', vaultTransaction.id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      vaultTransaction,
      message: 'Coffre sécurisé créé avec succès'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function confirmDeliveryAndRelease(supabase: any, transactionId: string, confirmationData: any) {
  console.log('🔓 Confirmation de livraison et libération:', transactionId);

  const { confirmationCode, clientConfirmed, comments, confirmedAt } = confirmationData;

  if (!clientConfirmed) {
    throw new Error('Confirmation client requise pour la libération du coffre');
  }

  // Vérifier la transaction dans le coffre
  const { data: vaultTransaction, error: vaultError } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('status', 'held')
    .single();

  if (vaultError || !vaultTransaction) {
    throw new Error('Transaction introuvable dans le coffre sécurisé');
  }

  // Appeler la fonction de libération sécurisée des fonds
  const { data: releaseResult, error: releaseError } = await supabase
    .rpc('process_escrow_release', { escrow_id: transactionId });

  if (releaseError || !releaseResult) {
    throw new Error('Erreur libération sécurisée: ' + releaseError?.message);
  }

  // Enregistrer les détails de confirmation
  await supabase
    .from('escrow_transactions')
    .update({ 
      status: 'completed',
      confirmation_code: confirmationCode,
      client_comments: comments,
      completed_at: confirmedAt || new Date().toISOString()
    })
    .eq('id', transactionId);

  // Mettre à jour le statut de la commande
  await supabase
    .from('marketplace_orders')
    .update({ status: 'completed' })
    .eq('id', vaultTransaction.order_id);

  // Créer les notifications de libération
  await supabase.from('escrow_notifications').insert([
    {
      user_id: vaultTransaction.buyer_id,
      escrow_transaction_id: transactionId,
      notification_type: 'funds_released',
      title: '✅ Transaction terminée',
      message: 'Votre commande est confirmée, les fonds ont été libérés avec succès'
    },
    {
      user_id: vaultTransaction.seller_id,
      escrow_transaction_id: transactionId,
      notification_type: 'payment_received',
      title: '💰 Paiement reçu',
      message: `Votre gain de ${vaultTransaction.seller_amount.toLocaleString()} CDF a été ajouté à votre portefeuille KwendaPay`
    }
  ]);

  if (vaultTransaction.driver_id) {
    await supabase.from('escrow_notifications').insert({
      user_id: vaultTransaction.driver_id,
      escrow_transaction_id: transactionId,
      notification_type: 'delivery_payment',
      title: '🚚 Paiement livraison',
      message: `Votre commission de ${vaultTransaction.driver_amount.toLocaleString()} CDF a été créditée`
    });
  }

  console.log('✅ Fonds libérés du coffre sécurisé:', transactionId);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Fonds libérés avec succès du coffre sécurisé KwendaPay',
      releasedAmounts: {
        seller: vaultTransaction.seller_amount,
        driver: vaultTransaction.driver_amount,
        platform: vaultTransaction.platform_fee
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processSecureWithdrawal(supabase: any, withdrawalData: any) {
  console.log('💸 Traitement retrait sécurisé:', withdrawalData.amount);

  const { userId, amount, withdrawalMethod, fee, netAmount, paymentDetails } = withdrawalData;

  // Vérifier le solde du portefeuille sécurisé
  const { data: wallet, error: walletError } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('currency', 'CDF')
    .single();

  if (walletError || !wallet || wallet.balance < amount) {
    throw new Error('Solde insuffisant dans le portefeuille sécurisé');
  }

  // Créer la demande de retrait sécurisée
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: userId,
      user_type: paymentDetails.userType || 'vault_user',
      amount: amount,
      fee: fee,
      net_amount: netAmount,
      currency: 'CDF',
      withdrawal_method: withdrawalMethod,
      kwenda_pay_phone: paymentDetails.kwendaPayPhone,
      mobile_money_provider: paymentDetails.mobileMoneyProvider,
      mobile_money_phone: paymentDetails.mobileMoneyPhone,
      bank_details: paymentDetails.bankDetails,
      status: 'pending',
      security_level: 'vault_secured'
    })
    .select()
    .single();

  if (withdrawalError) {
    throw new Error('Erreur création demande retrait sécurisé: ' + withdrawalError.message);
  }

  // Débiter temporairement le portefeuille (en attente de traitement sécurisé)
  await supabase
    .from('user_wallets')
    .update({ 
      balance: wallet.balance - amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id);

  // Créer l'enregistrement de transaction sécurisée
  await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      transaction_type: 'secure_withdrawal_pending',
      amount: -amount,
      currency: 'CDF',
      description: `Retrait sécurisé ${withdrawalMethod} - Frais: ${fee} CDF`,
      reference_id: withdrawal.id,
      reference_type: 'secure_withdrawal',
      balance_before: wallet.balance,
      balance_after: wallet.balance - amount
    });

  // Notification de sécurité
  await supabase.from('escrow_notifications').insert({
    user_id: userId,
    escrow_transaction_id: withdrawal.id,
    notification_type: 'withdrawal_pending',
    title: '💸 Retrait en cours',
    message: `Votre demande de retrait de ${netAmount.toLocaleString()} CDF est en traitement sécurisé`
  });

  console.log('✅ Demande de retrait sécurisé créée:', withdrawal.id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      withdrawal,
      message: `Demande de retrait sécurisé soumise. Montant net: ${netAmount.toLocaleString()} CDF`,
      processingTime: withdrawalMethod === 'kwenda_pay' ? '2-6h' : '6-24h'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processAutoRelease(supabase: any, transactionId: string) {
  console.log('⏰ Libération automatique après timeout:', transactionId);

  // Vérifier que la transaction est éligible à la libération automatique
  const { data: vaultTransaction, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('status', 'held')
    .single();

  if (error || !vaultTransaction) {
    throw new Error('Transaction non éligible à la libération automatique');
  }

  // Vérifier que le timeout est dépassé
  const timeoutDate = new Date(vaultTransaction.timeout_date);
  if (timeoutDate > new Date()) {
    throw new Error('Le délai de timeout n\'est pas encore dépassé');
  }

  // Procéder à la libération automatique
  const { data: releaseResult, error: releaseError } = await supabase
    .rpc('process_escrow_release', { escrow_id: transactionId });

  if (releaseError) {
    throw new Error('Erreur libération automatique: ' + releaseError.message);
  }

  // Marquer comme libéré automatiquement
  await supabase
    .from('escrow_transactions')
    .update({ 
      status: 'completed',
      confirmation_code: `AUTO-TIMEOUT-${Date.now()}`,
      auto_released: true,
      completed_at: new Date().toISOString()
    })
    .eq('id', transactionId);

  console.log('✅ Libération automatique effectuée:', transactionId);

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Libération automatique effectuée après expiration du délai' 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getVaultStatus(supabase: any, orderId: string) {
  const { data: vaultTransaction, error } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error) {
    throw new Error('Transaction introuvable dans le coffre sécurisé');
  }

  return new Response(
    JSON.stringify({ vaultTransaction }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}