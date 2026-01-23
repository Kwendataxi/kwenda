import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Admin Edge Function pour traiter les demandes de retrait
 * Actions: 'mark_paid' | 'reject'
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization required');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Non authentifié');

    // Vérifier que l'utilisateur est admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminRole || adminRole.role !== 'admin') {
      throw new Error('Accès admin requis');
    }

    const { 
      withdrawalRequestId, 
      action, 
      adminReference, 
      adminNotes,
      rejectionReason 
    } = await req.json();

    console.log(`🏦 Admin ${user.id} processing withdrawal ${withdrawalRequestId} - action: ${action}`);

    // Récupérer la demande de retrait
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalRequestId)
      .single();

    if (withdrawalError || !withdrawal) {
      throw new Error('Demande de retrait non trouvée');
    }

    if (withdrawal.status !== 'pending') {
      throw new Error(`Cette demande a déjà été traitée (statut: ${withdrawal.status})`);
    }

    const now = new Date().toISOString();

    if (action === 'mark_paid') {
      // ✅ Marquer comme payé
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'paid',
          paid_at: now,
          processed_at: now,
          admin_reference: adminReference || null,
          admin_notes: adminNotes || null
        })
        .eq('id', withdrawalRequestId);

      if (updateError) throw updateError;

      // Mettre à jour la transaction wallet correspondante
      if (withdrawal.user_type === 'vendor' || withdrawal.user_type === 'restaurant') {
        await supabase
          .from('vendor_wallet_transactions')
          .update({ status: 'completed' })
          .eq('reference_id', withdrawalRequestId)
          .eq('reference_type', 'withdrawal_request')
          .eq('status', 'pending');
      } else {
        // Pour clients/drivers, mettre à jour wallet_transactions
        await supabase
          .from('wallet_transactions')
          .update({ status: 'completed' })
          .eq('reference_id', withdrawalRequestId)
          .eq('status', 'pending');
      }

      // Notifier l'utilisateur
      await supabase.from('system_notifications').insert({
        user_id: withdrawal.user_id,
        title: '✅ Retrait effectué',
        message: `Votre retrait de ${withdrawal.amount.toLocaleString()} ${withdrawal.currency} a été effectué.`,
        notification_type: 'withdrawal_completed',
        data: { withdrawal_id: withdrawalRequestId, amount: withdrawal.amount }
      });

      // Logger l'activité admin
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'admin_withdrawal_paid',
        description: `Admin a marqué le retrait ${withdrawalRequestId} comme payé`,
        reference_id: withdrawalRequestId,
        reference_type: 'withdrawal_request',
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        metadata: { admin_reference: adminReference }
      });

      console.log(`✅ Withdrawal ${withdrawalRequestId} marked as paid`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Retrait marqué comme payé',
          withdrawal_id: withdrawalRequestId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reject') {
      // ❌ Rejeter et rembourser
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          processed_at: now,
          failure_reason: rejectionReason || 'Rejeté par l\'administrateur',
          admin_notes: adminNotes || null
        })
        .eq('id', withdrawalRequestId);

      if (updateError) throw updateError;

      // Rembourser le wallet
      if (withdrawal.user_type === 'vendor' || withdrawal.user_type === 'restaurant') {
        // Rembourser vendor_wallets
        const { data: wallet } = await supabase
          .from('vendor_wallets')
          .select('id, balance')
          .eq('vendor_id', withdrawal.user_id)
          .eq('currency', withdrawal.currency)
          .single();

        if (wallet) {
          await supabase
            .from('vendor_wallets')
            .update({
              balance: (wallet.balance || 0) + withdrawal.amount,
              updated_at: now
            })
            .eq('id', wallet.id);

          // Marquer la transaction comme failed
          await supabase
            .from('vendor_wallet_transactions')
            .update({ status: 'failed' })
            .eq('reference_id', withdrawalRequestId)
            .eq('reference_type', 'withdrawal_request');

          // Créer transaction de remboursement
          await supabase.from('vendor_wallet_transactions').insert({
            wallet_id: wallet.id,
            vendor_id: withdrawal.user_id,
            transaction_type: 'credit',
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            description: `Remboursement retrait rejeté`,
            reference_id: withdrawalRequestId,
            reference_type: 'withdrawal_refund',
            status: 'completed'
          });
        }
      } else {
        // Rembourser user_wallets (client/driver)
        const { data: wallet } = await supabase
          .from('user_wallets')
          .select('id, balance')
          .eq('user_id', withdrawal.user_id)
          .single();

        if (wallet) {
          await supabase
            .from('user_wallets')
            .update({
              balance: (wallet.balance || 0) + withdrawal.amount,
              updated_at: now
            })
            .eq('id', wallet.id);

          await supabase
            .from('wallet_transactions')
            .update({ status: 'failed' })
            .eq('reference_id', withdrawalRequestId)
            .eq('status', 'pending');

          await supabase.from('wallet_transactions').insert({
            wallet_id: wallet.id,
            transaction_type: 'refund',
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            description: `Remboursement retrait rejeté`,
            reference_id: withdrawalRequestId,
            status: 'completed'
          });
        }
      }

      // Notifier l'utilisateur
      await supabase.from('system_notifications').insert({
        user_id: withdrawal.user_id,
        title: '❌ Retrait rejeté',
        message: `Votre retrait de ${withdrawal.amount.toLocaleString()} ${withdrawal.currency} a été rejeté. Raison: ${rejectionReason || 'Non spécifiée'}. Le montant a été recrédité sur votre compte.`,
        notification_type: 'withdrawal_rejected',
        data: { withdrawal_id: withdrawalRequestId, reason: rejectionReason }
      });

      // Logger l'activité admin
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: 'admin_withdrawal_rejected',
        description: `Admin a rejeté le retrait ${withdrawalRequestId}: ${rejectionReason || 'Non spécifiée'}`,
        reference_id: withdrawalRequestId,
        reference_type: 'withdrawal_request',
        amount: withdrawal.amount,
        currency: withdrawal.currency
      });

      console.log(`❌ Withdrawal ${withdrawalRequestId} rejected and refunded`);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Retrait rejeté et montant remboursé',
          withdrawal_id: withdrawalRequestId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error(`Action non reconnue: ${action}`);
    }

  } catch (error: any) {
    console.error('❌ Error processing withdrawal:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
