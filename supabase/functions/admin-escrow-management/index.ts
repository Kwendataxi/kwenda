import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Vérifier l'authentification admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non autorisé');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    // Vérifier le rôle admin
    const { data: adminData } = await supabaseClient
      .from('admins')
      .select('id, admin_level')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!adminData) {
      throw new Error('Accès refusé - Admin requis');
    }

    const { action, escrowId, adminNotes, resolution } = await req.json();

    console.log(`Admin escrow action: ${action} for escrow ${escrowId} by admin ${user.id}`);

    // Récupérer l'escrow
    const { data: escrow, error: escrowError } = await supabaseClient
      .from('escrow_transactions')
      .select('*')
      .eq('id', escrowId)
      .single();

    if (escrowError || !escrow) {
      throw new Error('Transaction escrow non trouvée');
    }

    let result = { success: false, message: '' };

    switch (action) {
      case 'force_release':
        result = await forceRelease(supabaseClient, escrow, user.id, adminNotes);
        break;

      case 'force_refund':
        result = await forceRefund(supabaseClient, escrow, user.id, adminNotes);
        break;

      case 'open_dispute':
        result = await openDispute(supabaseClient, escrow, user.id, adminNotes, resolution?.reason);
        break;

      case 'resolve_dispute':
        result = await resolveDispute(supabaseClient, escrow, user.id, adminNotes, resolution);
        break;

      default:
        throw new Error(`Action non supportée: ${action}`);
    }

    // Logger l'action admin
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        activity_type: 'admin_escrow_action',
        description: `Action admin escrow: ${action}`,
        reference_id: escrowId,
        reference_type: 'escrow_transaction',
        metadata: {
          action,
          admin_notes: adminNotes,
          resolution,
          result: result.success
        }
      });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Admin escrow error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function forceRelease(
  supabase: any, 
  escrow: any, 
  adminId: string, 
  adminNotes?: string
) {
  // Mettre à jour le statut escrow
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', escrow.id);

  if (updateError) throw updateError;

  // Créditer le wallet vendeur
  const sellerAmount = escrow.seller_amount || (escrow.amount - (escrow.platform_fee || 0));

  // Récupérer ou créer le wallet vendeur
  let { data: wallet } = await supabase
    .from('vendor_wallets')
    .select('*')
    .eq('vendor_id', escrow.seller_id)
    .eq('currency', 'CDF')
    .maybeSingle();

  if (!wallet) {
    const { data: newWallet, error: createError } = await supabase
      .from('vendor_wallets')
      .insert({
        vendor_id: escrow.seller_id,
        balance: 0,
        currency: 'CDF'
      })
      .select()
      .single();

    if (createError) throw createError;
    wallet = newWallet;
  }

  // Mettre à jour le solde
  const { error: walletError } = await supabase
    .from('vendor_wallets')
    .update({
      balance: wallet.balance + sellerAmount,
      total_earned: (wallet.total_earned || 0) + sellerAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id);

  if (walletError) throw walletError;

  // Créer la transaction vendeur
  await supabase
    .from('vendor_wallet_transactions')
    .insert({
      vendor_id: escrow.seller_id,
      transaction_type: 'escrow_release',
      amount: sellerAmount,
      currency: 'CDF',
      description: `Libération forcée admin - Commande #${escrow.order_id?.substring(0, 8)}`,
      reference_id: escrow.order_id,
      reference_type: 'marketplace_order',
      status: 'completed',
      metadata: { forced_by_admin: adminId, admin_notes: adminNotes }
    });

  // Mettre à jour le statut de la commande
  await supabase
    .from('marketplace_orders')
    .update({
      revenue_status: 'released',
      updated_at: new Date().toISOString()
    })
    .eq('id', escrow.order_id);

  return {
    success: true,
    message: `Fonds libérés: ${sellerAmount.toLocaleString()} FC vers le vendeur`
  };
}

async function forceRefund(
  supabase: any, 
  escrow: any, 
  adminId: string, 
  adminNotes?: string
) {
  // Mettre à jour le statut escrow
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', escrow.id);

  if (updateError) throw updateError;

  // Rembourser l'acheteur
  const refundAmount = escrow.amount;

  // Récupérer ou créer le wallet acheteur
  let { data: wallet } = await supabase
    .from('user_wallets')
    .select('*')
    .eq('user_id', escrow.buyer_id)
    .eq('currency', 'CDF')
    .maybeSingle();

  if (!wallet) {
    const { data: newWallet, error: createError } = await supabase
      .from('user_wallets')
      .insert({
        user_id: escrow.buyer_id,
        balance: 0,
        currency: 'CDF'
      })
      .select()
      .single();

    if (createError) throw createError;
    wallet = newWallet;
  }

  // Créditer le remboursement
  const { error: walletError } = await supabase
    .from('user_wallets')
    .update({
      balance: wallet.balance + refundAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', wallet.id);

  if (walletError) throw walletError;

  // Créer la transaction de remboursement
  await supabase
    .from('wallet_transactions')
    .insert({
      user_id: escrow.buyer_id,
      type: 'refund',
      amount: refundAmount,
      currency: 'CDF',
      description: `Remboursement admin - Commande #${escrow.order_id?.substring(0, 8)}`,
      reference_id: escrow.order_id,
      reference_type: 'marketplace_order',
      status: 'completed',
      metadata: { forced_by_admin: adminId, admin_notes: adminNotes }
    });

  // Mettre à jour le statut de la commande
  await supabase
    .from('marketplace_orders')
    .update({
      status: 'refunded',
      revenue_status: 'refunded',
      updated_at: new Date().toISOString()
    })
    .eq('id', escrow.order_id);

  return {
    success: true,
    message: `Remboursement effectué: ${refundAmount.toLocaleString()} FC vers l'acheteur`
  };
}

async function openDispute(
  supabase: any, 
  escrow: any, 
  adminId: string, 
  adminNotes?: string,
  reason?: string
) {
  const { error: updateError } = await supabase
    .from('escrow_transactions')
    .update({
      status: 'disputed',
      dispute_reason: reason || 'Conflit ouvert par admin',
      dispute_opened_at: new Date().toISOString(),
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', escrow.id);

  if (updateError) throw updateError;

  // Mettre à jour le statut de la commande
  await supabase
    .from('marketplace_orders')
    .update({
      status: 'disputed',
      updated_at: new Date().toISOString()
    })
    .eq('id', escrow.order_id);

  // Notifier les parties
  await supabase
    .from('admin_notifications')
    .insert({
      type: 'escrow_dispute',
      title: 'Conflit ouvert',
      message: `Un conflit a été ouvert sur la commande #${escrow.order_id?.substring(0, 8)}`,
      severity: 'warning',
      data: { escrow_id: escrow.id, order_id: escrow.order_id, reason }
    });

  return {
    success: true,
    message: `Conflit ouvert avec succès`
  };
}

async function resolveDispute(
  supabase: any, 
  escrow: any, 
  adminId: string, 
  adminNotes?: string,
  resolution?: any
) {
  // Par défaut, résoudre en libérant les fonds au vendeur
  // Mais on peut personnaliser avec resolution
  
  if (resolution?.buyerRefund && resolution.buyerRefund > 0) {
    // Remboursement partiel ou total à l'acheteur
    return await forceRefund(supabase, { ...escrow, amount: resolution.buyerRefund }, adminId, adminNotes);
  } else if (resolution?.vendorAmount && resolution.vendorAmount > 0) {
    // Libération partielle au vendeur
    return await forceRelease(supabase, { ...escrow, seller_amount: resolution.vendorAmount }, adminId, adminNotes);
  } else {
    // Par défaut: libérer au vendeur
    return await forceRelease(supabase, escrow, adminId, adminNotes);
  }
}
