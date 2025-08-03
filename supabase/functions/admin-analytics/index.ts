import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
  type: 'dashboard' | 'zones' | 'drivers' | 'revenue' | 'subscriptions'
  date_range?: {
    start: string
    end: string
  }
  zone_name?: string
  country_code?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify authentication (admin only)
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is admin (you might want to implement proper role checking)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.user_type !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { type, date_range, zone_name, country_code } = await req.json() as AnalyticsRequest

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date()
    const startDate = date_range?.start || new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    const endDate = date_range?.end || today.toISOString()

    switch (type) {
      case 'dashboard':
        // Get overall platform statistics
        const [
          { count: totalUsers },
          { count: totalDrivers },
          { count: activeSubscriptions },
          { count: pendingSupport },
          revenueData,
          topZones
        ] = await Promise.all([
          supabaseService.from('profiles').select('*', { count: 'exact', head: true }),
          supabaseService.from('driver_profiles').select('*', { count: 'exact', head: true }),
          supabaseService.from('driver_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabaseService.from('enhanced_support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
          supabaseService.from('payment_transactions')
            .select('amount, currency, created_at')
            .gte('created_at', startDate)
            .lte('created_at', endDate),
          supabaseService.from('zone_analytics')
            .select('zone_name, total_revenue, total_rides')
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('total_revenue', { ascending: false })
            .limit(5)
        ])

        const totalRevenue = revenueData.data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0

        return new Response(JSON.stringify({
          success: true,
          data: {
            overview: {
              total_users: totalUsers || 0,
              total_drivers: totalDrivers || 0,
              active_subscriptions: activeSubscriptions || 0,
              pending_support_tickets: pendingSupport || 0,
              total_revenue: totalRevenue
            },
            top_zones: topZones.data || [],
            revenue_trend: revenueData.data || []
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'zones':
        // Get zone analytics
        let zoneQuery = supabaseService
          .from('zone_analytics')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)

        if (zone_name) {
          zoneQuery = zoneQuery.eq('zone_name', zone_name)
        }
        if (country_code) {
          zoneQuery = zoneQuery.eq('country_code', country_code)
        }

        const { data: zoneAnalytics, error: zoneError } = await zoneQuery.order('date', { ascending: false })

        if (zoneError) {
          throw zoneError
        }

        return new Response(JSON.stringify({
          success: true,
          data: zoneAnalytics
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'drivers':
        // Get driver statistics
        const { data: driverStats, error: driverError } = await supabaseService
          .from('driver_profiles')
          .select(`
            *,
            driver_subscriptions!inner(status, plan_id),
            driver_credits(balance, total_earned, total_spent)
          `)

        if (driverError) {
          throw driverError
        }

        return new Response(JSON.stringify({
          success: true,
          data: driverStats
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'subscriptions':
        // Get subscription analytics
        const { data: subscriptionData, error: subError } = await supabaseService
          .from('driver_subscriptions')
          .select(`
            *,
            subscription_plans(name, price, duration_type),
            profiles(display_name)
          `)
          .gte('created_at', startDate)
          .lte('created_at', endDate)

        if (subError) {
          throw subError
        }

        return new Response(JSON.stringify({
          success: true,
          data: subscriptionData
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'revenue':
        // Get detailed revenue analytics
        const { data: transactions, error: revError } = await supabaseService
          .from('payment_transactions')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false })

        if (revError) {
          throw revError
        }

        // Group by day for trend analysis
        const dailyRevenue = transactions?.reduce((acc, transaction) => {
          const date = new Date(transaction.created_at).toISOString().split('T')[0]
          if (!acc[date]) {
            acc[date] = 0
          }
          acc[date] += transaction.amount || 0
          return acc
        }, {} as Record<string, number>) || {}

        return new Response(JSON.stringify({
          success: true,
          data: {
            transactions,
            daily_revenue: dailyRevenue,
            total_revenue: transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        return new Response(JSON.stringify({ error: 'Invalid analytics type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

  } catch (error) {
    console.error('Admin analytics error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})