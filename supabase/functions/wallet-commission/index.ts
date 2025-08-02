import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommissionRequest {
  booking_id?: string;
  delivery_id?: string;
  amount: number;
  service_type: 'transport' | 'delivery';
  driver_id: string;
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { booking_id, delivery_id, amount, service_type, driver_id, user_id }: CommissionRequest = await req.json();

    if (!amount || amount <= 0) {
      throw new Error('Montant invalide');
    }

    if (!['transport', 'delivery'].includes(service_type)) {
      throw new Error('Type de service invalide');
    }

    if (!driver_id || !user_id) {
      throw new Error('IDs utilisateur et chauffeur requis');
    }

    // Get commission settings
    const { data: commissionSettings, error: settingsError } = await supabaseService
      .from('commission_settings')
      .select('*')
      .eq('service_type', service_type)
      .eq('is_active', true)
      .single();

    if (settingsError || !commissionSettings) {
      throw new Error('Configuration des commissions non trouvée');
    }

    // Calculate commission amounts
    const adminAmount = (amount * commissionSettings.admin_rate) / 100;
    const driverAmount = (amount * commissionSettings.driver_rate) / 100;
    const platformAmount = (amount * commissionSettings.platform_rate) / 100;

    console.log(`Commission calculation for ${service_type}:`, {
      totalAmount: amount,
      adminAmount,
      driverAmount,
      platformAmount,
      rates: {
        admin: commissionSettings.admin_rate,
        driver: commissionSettings.driver_rate,
        platform: commissionSettings.platform_rate
      }
    });

    // Start transaction processing
    const transactionId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get user and driver wallets
    const { data: userWallet } = await supabaseService
      .from('user_wallets')
      .select('*')
      .eq('user_id', user_id)
      .single();

    const { data: driverWallet } = await supabaseService
      .from('user_wallets')
      .select('*')
      .eq('user_id', driver_id)
      .single();

    if (!userWallet) {
      throw new Error('Portefeuille utilisateur non trouvé');
    }

    if (!driverWallet) {
      throw new Error('Portefeuille chauffeur non trouvé');
    }

    // Check if user has sufficient balance
    if (userWallet.balance < amount) {
      throw new Error('Solde insuffisant');
    }

    // Process payments atomically
    const userNewBalance = userWallet.balance - amount;
    const driverNewBalance = driverWallet.balance + driverAmount;

    // Update user wallet (debit total amount)
    const { error: userWalletError } = await supabaseService
      .from('user_wallets')
      .update({ 
        balance: userNewBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (userWalletError) {
      throw new Error(`Erreur wallet utilisateur: ${userWalletError.message}`);
    }

    // Update driver wallet (credit driver portion)
    const { error: driverWalletError } = await supabaseService
      .from('user_wallets')
      .update({ 
        balance: driverNewBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', driver_id);

    if (driverWalletError) {
      throw new Error(`Erreur wallet chauffeur: ${driverWalletError.message}`);
    }

    // Record wallet transactions
    const walletTransactions = [
      // User payment debit
      {
        wallet_id: userWallet.id,
        user_id: user_id,
        transaction_type: 'debit',
        amount: amount,
        currency: 'CDF',
        description: `Paiement ${service_type === 'transport' ? 'course' : 'livraison'}`,
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        status: 'completed',
        balance_before: userWallet.balance,
        balance_after: userNewBalance
      },
      // Driver earnings credit
      {
        wallet_id: driverWallet.id,
        user_id: driver_id,
        transaction_type: 'credit',
        amount: driverAmount,
        currency: 'CDF',
        description: `Gains ${service_type === 'transport' ? 'course' : 'livraison'} (commission)`,
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        status: 'completed',
        balance_before: driverWallet.balance,
        balance_after: driverNewBalance
      }
    ];

    for (const transaction of walletTransactions) {
      await supabaseService
        .from('wallet_transactions')
        .insert(transaction);
    }

    // Log activities
    const activities = [
      // User payment
      {
        user_id: user_id,
        activity_type: 'payment',
        description: `Paiement ${service_type === 'transport' ? 'course' : 'livraison'}: ${amount} CDF`,
        amount: amount,
        currency: 'CDF',
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        metadata: {
          transaction_id: transactionId,
          commission_breakdown: { adminAmount, driverAmount, platformAmount }
        }
      },
      // Driver earnings
      {
        user_id: driver_id,
        activity_type: 'payment',
        description: `Gains ${service_type === 'transport' ? 'course' : 'livraison'}: ${driverAmount} CDF`,
        amount: driverAmount,
        currency: 'CDF',
        reference_id: booking_id || delivery_id,
        reference_type: service_type,
        metadata: {
          transaction_id: transactionId,
          commission_rate: commissionSettings.driver_rate
        }
      }
    ];

    for (const activity of activities) {
      await supabaseService
        .from('activity_logs')
        .insert(activity);
    }

    // Update booking/delivery status
    if (booking_id) {
      await supabaseService
        .from('transport_bookings')
        .update({ 
          status: 'completed',
          actual_price: amount
        })
        .eq('id', booking_id);
    }

    if (delivery_id) {
      await supabaseService
        .from('delivery_orders')
        .update({ 
          status: 'completed',
          actual_price: amount
        })
        .eq('id', delivery_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        commission_breakdown: {
          total_amount: amount,
          driver_amount: driverAmount,
          admin_amount: adminAmount,
          platform_amount: platformAmount
        },
        new_balances: {
          user_balance: userNewBalance,
          driver_balance: driverNewBalance
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Commission processing error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur traitement commission'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});