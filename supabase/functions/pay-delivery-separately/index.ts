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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non authentifié');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Session invalide');
    }

    const { orderId, orderType, deliveryFee, paymentMethod } = await req.json();
    
    console.log('💳 Paiement livraison séparé:', { 
      orderId, 
      orderType, 
      deliveryFee, 
      paymentMethod,
      userId: user.id 
    });

    if (!orderId || !orderType || !deliveryFee || !paymentMethod) {
      throw new Error('Paramètres manquants');
    }

    // Valider orderType
    if (!['food', 'marketplace'].includes(orderType)) {
      throw new Error('orderType invalide (food ou marketplace)');
    }

    // Valider paymentMethod
    if (!['kwenda_pay', 'cash', 'mobile_money'].includes(paymentMethod)) {
      throw new Error('paymentMethod invalide');
    }

    const tableName = orderType === 'food' ? 'food_orders' : 'marketplace_orders';

    // 1. Vérifier que la commande existe et appartient à l'utilisateur
    const { data: order, error: orderError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Commande introuvable:', orderError);
      throw new Error('Commande introuvable');
    }

    // Vérifier ownership
    const ownerField = orderType === 'food' ? 'customer_id' : 'buyer_id';
    if (order[ownerField] !== user.id) {
      throw new Error('Non autorisé');
    }

    // Vérifier que le paiement n'a pas déjà été effectué
    if (order.delivery_payment_status === 'paid') {
      return new Response(
        JSON.stringify({ 
          error: 'Livraison déjà payée',
          message: 'Cette livraison a déjà été payée'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // 2. Traiter le paiement selon la méthode
    if (paymentMethod === 'kwenda_pay') {
      // Payer avec le wallet Kwenda
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('id, balance, bonus_balance')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        return new Response(
          JSON.stringify({ 
            error: 'wallet_not_found',
            message: 'Portefeuille introuvable'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      const bonusBalance = Number(wallet.bonus_balance || 0);
      const mainBalance = Number(wallet.balance || 0);
      const totalAvailable = bonusBalance + mainBalance;

      // Si solde insuffisant, basculer automatiquement vers cash
      if (totalAvailable < deliveryFee) {
        console.log('💵 Solde insuffisant, bascule auto vers cash:', { totalAvailable, deliveryFee });
        
        // Configurer en cash on delivery
        await supabase
          .from(tableName)
          .update({
            delivery_payment_status: 'cash_on_delivery',
            delivery_payment_method: 'cash'
          })
          .eq('id', orderId);

        // Notifier le livreur si assigné
        if (order.driver_id) {
          await supabase.from('system_notifications').insert({
            user_id: order.driver_id,
            title: 'Paiement livraison en cash',
            message: `Commande ${order.order_number || orderId}: 💵 Cash à récupérer (${deliveryFee} CDF)`,
            notification_type: 'delivery_payment',
            data: { 
              order_id: orderId,
              order_type: orderType,
              delivery_fee: deliveryFee,
              payment_method: 'cash',
              payment_status: 'cash_on_delivery',
              auto_switched: true
            }
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Solde insuffisant - Paiement configuré en cash à la livraison',
            payment_method: 'cash',
            delivery_fee: deliveryFee,
            auto_switched: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
      }

      // Utiliser bonus si possible, sinon balance principale
      let transactionType: string;
      let transactionDescription: string;

      if (bonusBalance >= deliveryFee) {
        // Payer avec bonus uniquement
        await supabase
          .from('user_wallets')
          .update({ 
            bonus_balance: bonusBalance - deliveryFee,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        transactionType = 'delivery_payment_bonus';
        transactionDescription = `Livraison ${orderType === 'food' ? 'Food' : 'Shop'} (BONUS)`;
        console.log(`💰 Paiement avec BONUS : ${deliveryFee} CDF`);
      } else {
        // Payer avec solde principal
        await supabase
          .from('user_wallets')
          .update({ 
            balance: mainBalance - deliveryFee,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        transactionType = 'delivery_payment_separate';
        transactionDescription = `Livraison ${orderType === 'food' ? 'Food' : 'Shop'}`;
        console.log(`💰 Paiement avec BALANCE : ${deliveryFee} CDF`);
      }

      // Logger transaction
      await supabase.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        transaction_type: transactionType,
        amount: -deliveryFee,
        currency: 'CDF',
        description: transactionDescription,
        status: 'completed',
        metadata: {
          order_type: orderType,
          order_id: orderId,
          paid_with: bonusBalance >= deliveryFee ? 'bonus' : 'main_balance'
        }
      });

      // Logger activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        activity_type: bonusBalance >= deliveryFee ? 'bonus_payment' : 'delivery_payment_separate',
        description: transactionDescription,
        amount: -deliveryFee,
        currency: 'CDF',
        reference_type: orderType === 'food' ? 'food_order' : 'marketplace_order',
        reference_id: orderId
      });

      // Mettre à jour la commande
      await supabase
        .from(tableName)
        .update({
          delivery_payment_status: 'paid',
          delivery_payment_method: 'kwenda_pay',
          delivery_paid_at: new Date().toISOString()
        })
        .eq('id', orderId);

      console.log('✅ Paiement livraison avec KwendaPay réussi');

    } else if (paymentMethod === 'cash' || paymentMethod === 'mobile_money') {
      // Paiement cash ou mobile money au livreur
      await supabase
        .from(tableName)
        .update({
          delivery_payment_status: 'cash_on_delivery',
          delivery_payment_method: paymentMethod
        })
        .eq('id', orderId);

      console.log(`✅ Paiement livraison configuré en ${paymentMethod}`);
    }

    // 3. Notifier le livreur si déjà assigné
    if (order.driver_id) {
      const statusMessage = paymentMethod === 'kwenda_pay' 
        ? '✓ Livraison déjà payée' 
        : '💵 Cash à récupérer';

      await supabase.from('system_notifications').insert({
        user_id: order.driver_id,
        title: 'Paiement livraison',
        message: `Commande ${order.order_number || orderId}: ${statusMessage}`,
        notification_type: 'delivery_payment',
        data: { 
          order_id: orderId,
          order_type: orderType,
          delivery_fee: deliveryFee,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'kwenda_pay' ? 'paid' : 'cash_on_delivery'
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: paymentMethod === 'kwenda_pay' 
          ? `${deliveryFee} CDF débités de votre wallet` 
          : `Paiement ${paymentMethod === 'cash' ? 'en espèces' : 'Mobile Money'} configuré`,
        payment_method: paymentMethod,
        delivery_fee: deliveryFee,
        wallet_debited: paymentMethod === 'kwenda_pay',
        auto_switched: false
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
