import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * ⚙️ Orange Money Retry Cron Job
 * 
 * Objectif : Récupérer et finaliser les transactions Orange Money bloquées en statut 'processing'
 * 
 * Fréquence recommandée : Toutes les 5 minutes
 * 
 * Processus :
 * 1. Récupérer transactions 'processing' depuis > 10 minutes
 * 2. Vérifier le statut réel auprès d'Orange Money (si API disponible)
 * 3. Mettre à jour en 'completed' ou 'failed' selon le résultat
 * 4. Marquer comme 'expired' si > 24h sans confirmation
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔄 [Orange Money Retry] Starting job...");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // 1️⃣ Récupérer les transactions en attente depuis > 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: stuckTransactions, error: fetchError } = await supabaseService
      .from('payment_transactions')
      .select('*')
      .eq('status', 'processing')
      .eq('payment_provider', 'orange')
      .lt('created_at', tenMinutesAgo);

    if (fetchError) {
      console.error("❌ Error fetching stuck transactions:", fetchError);
      throw fetchError;
    }

    if (!stuckTransactions || stuckTransactions.length === 0) {
      console.log("✅ No stuck transactions found. All clear!");
      return new Response(
        JSON.stringify({ success: true, message: "No stuck transactions", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`📊 Found ${stuckTransactions.length} stuck transactions`);

    let expiredCount = 0;
    let retriedCount = 0;
    let errorCount = 0;

    // 2️⃣ Traiter chaque transaction
    for (const transaction of stuckTransactions) {
      try {
        // Vérifier si la transaction a plus de 24h
        if (transaction.created_at < twentyFourHoursAgo) {
          console.log(`⏰ Transaction ${transaction.transaction_id} expired (>24h)`);
          
          // Marquer comme expirée
          await supabaseService
            .from('payment_transactions')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
              metadata: {
                ...transaction.metadata,
                failure_reason: 'Transaction expirée après 24h',
                expired_at: new Date().toISOString(),
                auto_expired: true
              }
            })
            .eq('id', transaction.id);

          // Notification d'expiration
          await supabaseService.from('system_notifications').insert({
            user_id: transaction.user_id,
            title: '⏰ Transaction expirée',
            message: `Votre paiement Orange Money de ${transaction.amount} ${transaction.currency} a expiré.`,
            type: 'wallet_topup',
            priority: 'medium',
            data: { transaction_id: transaction.id, auto_expired: true }
          });

          expiredCount++;
        } else {
          // 🔍 TODO : Implémenter la vérification du statut auprès d'Orange Money
          // Pour l'instant, on log juste pour surveillance manuelle
          console.log(`⏳ Transaction ${transaction.transaction_id} still processing (${
            Math.round((Date.now() - new Date(transaction.created_at).getTime()) / 60000)
          } minutes)`);
          
          retriedCount++;
          
          // Note : Quand Orange fournira une API de vérification de statut,
          // on pourra faire un appel ici pour vérifier le statut réel
          // et mettre à jour la transaction en conséquence
        }
      } catch (error) {
        console.error(`❌ Error processing transaction ${transaction.transaction_id}:`, error);
        errorCount++;
      }
    }

    const summary = {
      success: true,
      total_found: stuckTransactions.length,
      expired: expiredCount,
      still_processing: retriedCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    };

    console.log("✅ [Orange Money Retry] Job completed:", JSON.stringify(summary));

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ [Orange Money Retry] Job failed:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
