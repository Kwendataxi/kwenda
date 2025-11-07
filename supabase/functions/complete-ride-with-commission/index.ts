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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      rideId, 
      rideType, 
      driverId, 
      finalAmount,
      paymentMethod 
    }: CompleteRideRequest = await req.json();

    console.log(`🏁 Completing ${rideType} ride ${rideId} for driver ${driverId}`);
    console.log(`💰 Final amount: ${finalAmount}, Payment: ${paymentMethod}`);

    // 1. Récupérer les paramètres de commission
    const { data: commissionSettings } = await supabase
      .from('commission_settings')
      .select('platform_percentage, partner_percentage')
      .eq('service_type', rideType)
      .single();

    const platformRate = commissionSettings?.platform_percentage || 15.0;
    const partnerRate = commissionSettings?.partner_percentage || 0;
    const totalCommissionRate = platformRate + partnerRate;

    const commissionAmount = (finalAmount * totalCommissionRate) / 100;
    const driverNetAmount = finalAmount - commissionAmount;

    console.log(`📊 Commission rate: ${totalCommissionRate}% (${commissionAmount} on ${finalAmount})`);
    console.log(`💵 Driver net amount: ${driverNetAmount}`);

    // 2. Vérifier le wallet du chauffeur
    const { data: wallet, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', driverId)
      .single();

    if (walletError) {
      console.error('❌ Wallet fetch error:', walletError);
      throw new Error(`Impossible de récupérer le wallet: ${walletError.message}`);
    }

    let paymentStatus: 'paid' | 'overdue' = 'paid';
    let commissionPaymentMethod: 'wallet' | 'cash' | 'deducted' = 'deducted';

    // 3. Tenter de prélever la commission du wallet
    if (wallet.balance >= commissionAmount) {
      console.log(`✅ Sufficient wallet balance (${wallet.balance}), deducting commission`);
      
      // Débiter le wallet
      const { error: deductError } = await supabase
        .from('user_wallets')
        .update({ 
          balance: wallet.balance - commissionAmount,
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
          final_amount: finalAmount
        }
      });

      paymentStatus = 'paid';
      commissionPaymentMethod = 'deducted';

    } else {
      console.warn(`⚠️ Insufficient wallet balance (${wallet.balance} < ${commissionAmount})`);
      paymentStatus = 'overdue';
      
      // Incrémenter le compteur de commissions impayées
      const { data: fraudTracking } = await supabase
        .from('driver_fraud_tracking')
        .select('unpaid_commissions_count, driver_id')
        .eq('driver_id', driverId)
        .single();

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
            wallet_balance: wallet.balance,
            ride_id: rideId
          }
        });
      }
    }

    // 4. Enregistrer la commission dans ride_commissions
    const { error: commissionError } = await supabase
      .from('ride_commissions')
      .insert({
        ride_id: rideId,
        ride_type: rideType,
        driver_id: driverId,
        ride_amount: finalAmount,
        commission_rate: totalCommissionRate,
        commission_amount: commissionAmount,
        driver_net_amount: driverNetAmount,
        payment_status: paymentStatus,
        payment_method: commissionPaymentMethod,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null
      });

    if (commissionError) {
      console.error('❌ Commission record error:', commissionError);
      throw new Error(`Échec enregistrement commission: ${commissionError.message}`);
    }

    // 5. Mettre à jour la course avec le statut de commission
    const tableName = rideType === 'transport' ? 'transport_bookings' : 'delivery_orders';
    
    await supabase
      .from(tableName)
      .update({
        status: 'completed',
        commission_status: paymentStatus,
        commission_amount: commissionAmount,
        commission_paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId);

    // 6. Décrémenter rides_remaining si abonnement actif
    const { data: subscription } = await supabase
      .from('driver_subscriptions')
      .select('rides_remaining')
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .single();

    if (subscription && subscription.rides_remaining > 0) {
      await supabase
        .from('driver_subscriptions')
        .update({ 
          rides_remaining: subscription.rides_remaining - 1,
          updated_at: new Date().toISOString()
        })
        .eq('driver_id', driverId)
        .eq('status', 'active');

      console.log(`📉 Rides remaining: ${subscription.rides_remaining - 1}`);
    }

    // 7. Log l'activité
    await supabase.from('activity_logs').insert({
      user_id: driverId,
      activity_type: 'ride_completed_with_commission',
      description: `Course complétée avec commission ${paymentStatus === 'paid' ? 'payée' : 'en retard'}`,
      metadata: {
        ride_id: rideId,
        ride_type: rideType,
        final_amount: finalAmount,
        commission_amount: commissionAmount,
        payment_status: paymentStatus,
        wallet_balance_before: wallet.balance,
        wallet_balance_after: paymentStatus === 'paid' ? wallet.balance - commissionAmount : wallet.balance
      }
    });

    console.log(`✅ Ride completed successfully with commission ${paymentStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        commission: {
          amount: commissionAmount,
          rate: totalCommissionRate,
          status: paymentStatus,
          payment_method: commissionPaymentMethod
        },
        driver_net_amount: driverNetAmount,
        wallet_balance: paymentStatus === 'paid' ? wallet.balance - commissionAmount : wallet.balance,
        message: paymentStatus === 'paid' 
          ? 'Course complétée avec succès, commission prélevée' 
          : 'Course complétée, commission en attente de paiement'
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
