import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResult {
  function_name: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time_ms: number;
  last_check: string;
  error_count: number;
  success_rate: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'health_check';

    if (action === 'health_check') {
      console.log('🔍 Running health check on all edge functions...');
      
      const functions = [
        'mobile-money-payment',
        'ride-dispatcher', 
        'delivery-dispatcher',
        'push-notifications'
      ];

      const healthResults: HealthCheckResult[] = [];

      for (const funcName of functions) {
        const startTime = Date.now();
        let status: 'healthy' | 'degraded' | 'down' = 'down';
        let errorCount = 0;

        try {
          // Test de base pour chaque fonction
          const testPayload = getFunctionTestPayload(funcName);
          
          const { data, error } = await supabaseClient.functions.invoke(funcName, {
            body: testPayload
          });

          const responseTime = Date.now() - startTime;
          
          if (error) {
            status = 'degraded';
            errorCount = 1;
            console.log(`⚠️ Function ${funcName} responded with error:`, error);
          } else {
            status = responseTime < 5000 ? 'healthy' : 'degraded';
            console.log(`✅ Function ${funcName} healthy - ${responseTime}ms`);
          }

          healthResults.push({
            function_name: funcName,
            status: status,
            response_time_ms: responseTime,
            last_check: new Date().toISOString(),
            error_count: errorCount,
            success_rate: errorCount === 0 ? 100 : 0
          });

        } catch (error) {
          console.error(`❌ Function ${funcName} health check failed:`, error);
          
          healthResults.push({
            function_name: funcName,
            status: 'down',
            response_time_ms: Date.now() - startTime,
            last_check: new Date().toISOString(),
            error_count: 1,
            success_rate: 0
          });
        }
      }

      // Enregistrer les résultats de monitoring
      const { error: insertError } = await supabaseClient
        .from('function_monitoring_logs')
        .insert(
          healthResults.map(result => ({
            function_name: result.function_name,
            status: result.status,
            response_time_ms: result.response_time_ms,
            error_count: result.error_count,
            success_rate: result.success_rate,
            metadata: { health_check: true }
          }))
        );

      if (insertError) {
        console.error('⚠️ Failed to save monitoring results:', insertError);
      }

      const overallHealth = healthResults.every(r => r.status === 'healthy') ? 'healthy' :
                           healthResults.some(r => r.status === 'healthy') ? 'degraded' : 'down';

      console.log(`📊 Health check complete - Overall status: ${overallHealth}`);

      return new Response(
        JSON.stringify({
          success: true,
          overall_status: overallHealth,
          functions: healthResults,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === 'stats') {
      // Récupérer les statistiques des dernières 24h
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: stats, error: statsError } = await supabaseClient
        .from('function_monitoring_logs')
        .select('*')
        .gte('created_at', oneDayAgo.toISOString());

      if (statsError) {
        throw statsError;
      }

      const functionStats: any = {};
      
      for (const stat of stats || []) {
        if (!functionStats[stat.function_name]) {
          functionStats[stat.function_name] = {
            total_calls: 0,
            success_calls: 0,
            avg_response_time: 0,
            error_rate: 0
          };
        }
        
        functionStats[stat.function_name].total_calls++;
        if (stat.status === 'healthy') {
          functionStats[stat.function_name].success_calls++;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          period: '24h',
          functions: functionStats,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    throw new Error('Action non supportée');

  } catch (error) {
    console.error('❌ Function monitor error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function getFunctionTestPayload(functionName: string): any {
  switch (functionName) {
    case 'mobile-money-payment':
      return {
        amount: 1000,
        provider: 'airtel',
        phoneNumber: '+243123456789',
        currency: 'CDF',
        orderId: 'test-order',
        orderType: 'transport'
      };
    case 'ride-dispatcher':
      return {
        booking_id: 'test-booking',
        pickup_coordinates: { lat: -4.3217, lng: 15.3069 },
        service_type: 'taxi',
        radius_km: 10
      };
    case 'delivery-dispatcher':
      return {
        orderId: 'test-delivery',
        pickupLat: -4.3217,
        pickupLng: 15.3069,
        deliveryType: 'flash'
      };
    case 'push-notifications':
      return {
        user_id: 'test-user',
        title: 'Test Health Check',
        message: 'Function monitoring test',
        type: 'system',
        priority: 'low'
      };
    default:
      return { test: true };
  }
}