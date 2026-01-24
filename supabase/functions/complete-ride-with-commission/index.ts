/**
 * ✅ PHASE 2: COMPLETE RIDE WITH COMMISSION
 * 
 * Finalise une course/livraison et prélève automatiquement la commission
 * du wallet du chauffeur/livreur.
 * 
 * Sécurité anti-fraude:
 * - Prélèvement automatique depuis wallet
 * - Blocage si commission impayée après 1 course
 * - Tracking des commissions en retard
 * - Suspension automatique si nécessaire
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-health-check',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface CompleteRideRequest {
  rideId: string;
  rideType: 'transport' | 'delivery';
  driverId: string;
  finalAmount: number;
  paymentMethod: 'wallet' | 'cash' | 'mobile_money';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ✅ Validation du JSON en entrée
    let body: CompleteRideRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { rideId, rideType, driverId, finalAmount, paymentMethod } = body;

    // ✅ Validation stricte des paramètres
    if (!rideId || typeof rideId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'rideId invalide ou manquant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!['transport', 'delivery'].includes(rideType)) {
      return new Response(
        JSON.stringify({ success: false, error: 'rideType doit être transport ou delivery' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!driverId || typeof driverId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'driverId invalide ou manquant' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (typeof finalAmount !== 'number' || finalAmount < 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'finalAmount doit être un nombre positif' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`🏁 Completing ${rideType} ride ${rideId} for driver ${driverId}`);
    console.log(`💰 Final amount: ${finalAmount}, Payment: ${paymentMethod}`);

    // ✅ Vérifier que la course existe
    const tableName = rideType === 'transport' ? 'transport_bookings' : 'delivery_orders';
    const { data: rideData, error: rideError } = await supabase
      .from(tableName)
      .select('id, status, driver_id')
      .eq('id', rideId)
      .maybeSingle();

    if (rideError || !rideData) {
      console.error('❌ Course non trouvée:', rideError);
      return new Response(
        JSON.stringify({ success: false, error: 'Course non trouvée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (rideData.driver_id !== driverId) {
      console.error('❌ Driver mismatch:', rideData.driver_id, '!=', driverId);
      return new Response(
        JSON.stringify({ success: false, error: 'Vous n\'êtes pas le chauffeur assigné à cette course' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // 1. Récupérer les paramètres de commission (colonnes correctes)
    const { data: commissionSettings } = await supabase
      .from('commission_settings')
      .select('platform_rate, admin_rate, driver_rate')
      .eq('service_type', rideType)
      .eq('is_active', true)
      .maybeSingle();

    // 2. Vérifier si le chauffeur a un abonnement actif
    const { data: subscription } = await supabase
      .from('driver_subscriptions')
      .select('id, rides_remaining, status, end_date')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .maybeSingle();

    // Déterminer le mode de facturation: subscription (0% commission) ou commission
    const hasActiveSubscription = subscription && 
      subscription.rides_remaining > 0 && 
      new Date(subscription.end_date) > new Date();

    let billingMode: 'subscription' | 'commission' = hasActiveSubscription ? 'subscription' : 'commission';
    let commissionAmount = 0;
    let driverNetAmount = finalAmount;
    let totalCommissionRate = 0;
    let kwendaCommission = 0;
    let kwendaRate = 0;
    let partnerCommission = 0;
    let partnerRate = 0;
    let partnerId: string | null = null;

    if (billingMode === 'subscription') {
      // Mode abonnement: 0% commission, utiliser les courses incluses
      console.log('📋 Mode abonnement actif - pas de commission');
      
      // Décrementer immédiatement les courses restantes
      await supabase
        .from('driver_subscriptions')
        .update({ 
          rides_remaining: subscription!.rides_remaining - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription!.id);

      console.log(`📉 Courses restantes: ${subscription!.rides_remaining - 1}`);

    } else {
      // Mode commission: prélever les frais Kwenda + partenaire
      kwendaRate = commissionSettings?.platform_rate || 12.0;
      
      // Récupérer le taux du partenaire si le chauffeur est affilié (max 3%)
      const { data: partnerDriver } = await supabase
        .from('partner_drivers')
        .select('commission_rate, partner_id')
        .eq('driver_id', driverId)
        .eq('status', 'active')
        .maybeSingle();

      partnerRate = Math.min(partnerDriver?.commission_rate || 0, 3.0);
      partnerId = partnerDriver?.partner_id || null;
      totalCommissionRate = kwendaRate + partnerRate;
      commissionAmount = Math.round((finalAmount * totalCommissionRate) / 100);
      driverNetAmount = finalAmount - commissionAmount;
      kwendaCommission = Math.round((finalAmount * kwendaRate) / 100);
      partnerCommission = commissionAmount - kwendaCommission;

      console.log(`💰 Mode commission: ${totalCommissionRate}% (Kwenda ${kwendaRate}% + Partenaire ${partnerRate}%)`);
      console.log(`📊 Commission: ${commissionAmount} sur ${finalAmount} → Net chauffeur: ${driverNetAmount}`);
    }

    console.log(`🔖 Billing mode: ${billingMode}`);

    // 3. Vérifier le wallet et prélever (seulement en mode commission)
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', driverId)
      .maybeSingle();

    if (walletError) {
      console.error('❌ Wallet fetch error:', walletError);
      // Créer un wallet si inexistant
      await supabase.from('user_wallets').insert({
        user_id: driverId,
        balance: 0
      });
    }

    const walletBalance = wallet?.balance || 0;
    let paymentStatus: 'paid' | 'overdue' | 'subscription' = billingMode === 'subscription' ? 'subscription' : 'paid';
    let commissionPaymentMethod: 'wallet' | 'cash' | 'deducted' | 'none' = billingMode === 'subscription' ? 'none' : 'deducted';

    // Prélèvement seulement en mode commission
    if (billingMode === 'commission' && commissionAmount > 0) {
      if (walletBalance >= commissionAmount) {
        console.log(`✅ Sufficient wallet balance (${walletBalance}), deducting commission`);
        
        // Débiter le wallet
        const { error: deductError } = await supabase
          .from('user_wallets')
          .update({ 
            balance: walletBalance - commissionAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', driverId);

        if (deductError) {
          console.error('❌ Deduction error:', deductError);
          throw new Error(`Échec du prélèvement: ${deductError.message}`);
        }

        // Créer une transaction wallet
        await supabase.from('wallet_transactions').insert({
          user_id: driverId,
          amount: -commissionAmount,
          transaction_type: 'commission_deduction',
          description: `Commission ${rideType} - Course ${rideId.substring(0, 8)}`,
          status: 'completed',
          metadata: {
            ride_id: rideId,
            ride_type: rideType,
            commission_rate: totalCommissionRate,
            final_amount: finalAmount,
            billing_mode: billingMode
          }
        });

        paymentStatus = 'paid';
        commissionPaymentMethod = 'deducted';

      } else {
        console.warn(`⚠️ Insufficient wallet balance (${walletBalance} < ${commissionAmount})`);
        paymentStatus = 'overdue';
        
        // Incrémenter le compteur de commissions impayées
        const { data: fraudTracking } = await supabase
          .from('driver_fraud_tracking')
          .select('unpaid_commissions_count, driver_id')
          .eq('driver_id', driverId)
          .maybeSingle();

        const newUnpaidCount = (fraudTracking?.unpaid_commissions_count || 0) + 1;

        await supabase
          .from('driver_fraud_tracking')
          .upsert({
            driver_id: driverId,
            unpaid_commissions_count: newUnpaidCount,
            last_fraud_detected_at: new Date().toISOString(),
            warning_level: Math.min(3, Math.floor(newUnpaidCount / 2)),
            updated_at: new Date().toISOString()
          });

        console.log(`🚨 Unpaid commissions count increased to ${newUnpaidCount}`);

        // 🔒 BLOQUER si > 1 course impayée
        if (newUnpaidCount > 1) {
          await supabase
            .from('driver_fraud_tracking')
            .update({
              is_suspended: true,
              suspension_reason: `Commission impayée sur ${newUnpaidCount} courses. Rechargez votre wallet pour continuer.`,
              suspended_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('driver_id', driverId);

          console.log(`🔒 Driver ${driverId} SUSPENDED for unpaid commissions`);

          // Notification de suspension
          await supabase.from('push_notifications').insert({
            user_id: driverId,
            title: '🚫 Compte Suspendu',
            message: `Votre compte est suspendu pour ${newUnpaidCount} commissions impayées (${commissionAmount * newUnpaidCount} CDF). Rechargez votre wallet maintenant.`,
            notification_type: 'account_suspended',
            priority: 'urgent',
            metadata: {
              unpaid_count: newUnpaidCount,
              total_owed: commissionAmount * newUnpaidCount,
              suspension_reason: 'unpaid_commissions'
            }
          });
        } else {
          // Simple warning pour la 1ère commission impayée
          await supabase.from('push_notifications').insert({
            user_id: driverId,
            title: '⚠️ Commission Impayée',
            message: `Wallet insuffisant pour la commission (${commissionAmount} CDF). Rechargez avant votre prochaine course.`,
            notification_type: 'commission_warning',
            priority: 'high',
            metadata: {
              commission_owed: commissionAmount,
              wallet_balance: walletBalance,
              ride_id: rideId
            }
          });
        }
      }
    } else {
      console.log('📋 Mode abonnement - pas de prélèvement wallet');
    }

    // 4. ✅ Enregistrer la commission dans ride_commissions avec les VRAIES colonnes
    const commissionInsertData = {
      ride_id: rideId,
      ride_type: rideType,
      driver_id: driverId,
      partner_id: partnerId || null,
      ride_amount: finalAmount || 0,
      kwenda_commission: kwendaCommission || 0,
      kwenda_rate: kwendaRate || 0,
      partner_commission: partnerCommission || 0,
      partner_rate: partnerRate || 0,
      driver_net_amount: driverNetAmount || finalAmount,
      payment_status: paymentStatus || 'pending',
      paid_at: (paymentStatus === 'paid' || paymentStatus === 'subscription') ? new Date().toISOString() : null
    };

    console.log('📝 Inserting ride_commissions:', commissionInsertData);

    const { error: commissionError } = await supabase
      .from('ride_commissions')
      .insert(commissionInsertData);

    if (commissionError) {
      console.error('❌ Commission record error:', commissionError);
      // Non bloquant - on continue
    }

    // 5. ✅ Mettre à jour la course avec SEULEMENT les colonnes qui existent
    const updateData = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`📝 Updating ${tableName}:`, updateData);

    const { error: updateError } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', rideId);

    if (updateError) {
      console.error('❌ Ride update error:', updateError);
      // Non bloquant - on continue
    }

    // 6. En mode abonnement, déjà décrémenté plus haut. Pas besoin d'appeler consume-ride à nouveau
    let ridesRemaining = null;
    if (billingMode === 'subscription' && subscription) {
      ridesRemaining = subscription.rides_remaining - 1;
      console.log(`📋 Mode abonnement - courses restantes: ${ridesRemaining}`);
    }

    // 7. Log l'activité
    await supabase.from('activity_logs').insert({
      user_id: driverId,
      activity_type: billingMode === 'subscription' ? 'ride_completed_subscription' : 'ride_completed_with_commission',
      description: billingMode === 'subscription' 
        ? `Course complétée (abonnement) - Restantes: ${ridesRemaining}` 
        : `Course complétée avec commission ${paymentStatus === 'paid' ? 'payée' : 'en retard'}`,
      metadata: {
        ride_id: rideId,
        ride_type: rideType,
        final_amount: finalAmount,
        commission_amount: commissionAmount,
        billing_mode: billingMode,
        payment_status: paymentStatus,
        rides_remaining: ridesRemaining,
        wallet_balance_before: walletBalance,
        wallet_balance_after: billingMode === 'commission' && paymentStatus === 'paid' 
          ? walletBalance - commissionAmount 
          : walletBalance
      }
    });

    console.log(`✅ Ride completed successfully - Mode: ${billingMode}, Commission: ${commissionAmount}`);

    // Construire le message de réponse
    let responseMessage = '';
    if (billingMode === 'subscription') {
      responseMessage = `Course complétée (abonnement). Courses restantes: ${ridesRemaining}`;
    } else if (paymentStatus === 'paid') {
      responseMessage = `Commission prélevée: ${commissionAmount.toLocaleString()} CDF`;
    } else {
      responseMessage = `Commission en attente: ${commissionAmount.toLocaleString()} CDF`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        billing_mode: billingMode,
        commission: {
          amount: commissionAmount,
          rate: totalCommissionRate,
          status: paymentStatus,
          payment_method: commissionPaymentMethod
        },
        driver_net_amount: driverNetAmount,
        rides_remaining: ridesRemaining,
        wallet_balance: billingMode === 'commission' && paymentStatus === 'paid' 
          ? walletBalance - commissionAmount 
          : walletBalance,
        message: responseMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('💥 Complete ride error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
