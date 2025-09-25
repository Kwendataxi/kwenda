import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsRequest {
  type: 'dashboard' | 'zones' | 'drivers' | 'revenue' | 'subscriptions' | 'financial_dashboard'
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

    // Check permissions using role/permission system
    const [permRead, permAdmin, permSystem, permFinanceRead, permFinanceAdmin] = await Promise.all([
      supabaseClient.rpc('has_permission', { _user_id: user.id, _permission: 'analytics_read' }),
      supabaseClient.rpc('has_permission', { _user_id: user.id, _permission: 'analytics_admin' }),
      supabaseClient.rpc('has_permission', { _user_id: user.id, _permission: 'system_admin' }),
      supabaseClient.rpc('has_permission', { _user_id: user.id, _permission: 'finance_read' }),
      supabaseClient.rpc('has_permission', { _user_id: user.id, _permission: 'finance_admin' }),
    ])

    const hasAccess = [permRead, permAdmin, permSystem, permFinanceRead, permFinanceAdmin].some((res) => res.data === true)

    if (!hasAccess) {
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
        // Get driver statistics without relying on implicit FK relationships
        const { data: profiles, error: profilesError } = await supabaseService
          .from('driver_profiles')
          .select('*')

        if (profilesError) {
          throw profilesError
        }

        const driverIds = (profiles || [])
          .map((p: any) => p.user_id)
          .filter((id: string | null) => !!id)

        // Fetch subscriptions and credits separately and merge on driver_id/user_id
        const [subsRes, creditsRes] = await Promise.all([
          driverIds.length
            ? supabaseService
                .from('driver_subscriptions')
                .select('driver_id, status, plan_id')
                .in('driver_id', driverIds)
            : Promise.resolve({ data: [], error: null } as any),
          driverIds.length
            ? supabaseService
                .from('driver_credits')
                .select('driver_id, balance, total_earned, total_spent')
                .in('driver_id', driverIds)
            : Promise.resolve({ data: [], error: null } as any)
        ])

        if (subsRes.error) throw subsRes.error
        if (creditsRes.error) throw creditsRes.error

        const subsByDriver: Record<string, any> = {}
        for (const s of subsRes.data || []) subsByDriver[s.driver_id] = s
        const creditsByDriver: Record<string, any> = {}
        for (const c of creditsRes.data || []) creditsByDriver[c.driver_id] = c

        const merged = (profiles || []).map((p: any) => ({
          ...p,
          driver_subscription: subsByDriver[p.user_id] || null,
          driver_credits: creditsByDriver[p.user_id] || null,
        }))

        return new Response(JSON.stringify({
          success: true,
          data: merged
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

      case 'financial_dashboard': {
        // Financial dashboard metrics and summary
        const sDate = new Date(startDate)
        const eDate = new Date(endDate)
        const prevStart = new Date(sDate)
        prevStart.setMonth(prevStart.getMonth() - 1)
        const prevEnd = new Date(eDate)
        prevEnd.setMonth(prevEnd.getMonth() - 1)

        const [walletTxRes, activitiesRes, bookingsRes, deliveriesRes, activeDriversCountRes, prevWalletTxRes] = await Promise.all([
          supabaseService
            .from('wallet_transactions')
            .select('amount, transaction_type, description, created_at, status')
            .eq('status', 'completed')
            .gte('created_at', startDate)
            .lte('created_at', endDate),
          supabaseService
            .from('activity_logs')
            .select('amount, metadata, reference_type, created_at')
            .eq('activity_type', 'payment')
            .gte('created_at', startDate)
            .lte('created_at', endDate),
          supabaseService
            .from('transport_bookings')
            .select('actual_price, created_at, status')
            .eq('status', 'completed')
            .gte('created_at', startDate)
            .lte('created_at', endDate),
          supabaseService
            .from('delivery_orders')
            .select('actual_price, created_at, status')
            .eq('status', 'completed')
            .gte('created_at', startDate)
            .lte('created_at', endDate),
          supabaseService
            .from('driver_locations')
            .select('driver_id', { count: 'exact', head: true })
            .eq('is_online', true)
            .eq('is_available', true),
          supabaseService
            .from('wallet_transactions')
            .select('amount')
            .eq('transaction_type', 'debit')
            .eq('status', 'completed')
            .gte('created_at', prevStart.toISOString())
            .lte('created_at', prevEnd.toISOString()),
        ])

        if (walletTxRes.error) throw walletTxRes.error
        if (activitiesRes.error) throw activitiesRes.error
        if (bookingsRes.error) throw bookingsRes.error
        if (deliveriesRes.error) throw deliveriesRes.error
        if (prevWalletTxRes.error) throw prevWalletTxRes.error

        const walletTx = walletTxRes.data || []
        const activities = activitiesRes.data || []
        const bookings = bookingsRes.data || []
        const deliveries = deliveriesRes.data || []

        const totalRevenue = walletTx
          .filter((t: any) => t.transaction_type === 'debit' && (t.description || '').includes('Paiement'))
          .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

        const driverEarnings = walletTx
          .filter((t: any) => t.transaction_type === 'credit' && (t.description || '').includes('Gains'))
          .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

        const transportRevenue = bookings.reduce((sum: number, b: any) => sum + Number(b.actual_price || 0), 0)
        const deliveryRevenue = deliveries.reduce((sum: number, d: any) => sum + Number(d.actual_price || 0), 0)

        let adminCommission = activities.reduce((sum: number, a: any) => sum + (Number(a.metadata?.commission_breakdown?.adminAmount) || 0), 0)
        let platformFees = activities.reduce((sum: number, a: any) => sum + (Number(a.metadata?.commission_breakdown?.platformAmount) || 0), 0)
        const partnerCommission = activities.reduce((sum: number, a: any) => sum + (Number(a.metadata?.commission_breakdown?.partnerAmount) || 0), 0)

        if (adminCommission === 0 && platformFees === 0 && totalRevenue > 0) {
          adminCommission = totalRevenue * 0.10
          platformFees = totalRevenue * 0.05
        }

        const activeDrivers = activeDriversCountRes.count || 0

        const previousRevenue = (prevWalletTxRes.data || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
        const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

        const dailySummaryMap = activities.reduce((acc: any, activity: any) => {
          const date = new Date(activity.created_at).toISOString().split('T')[0]
          const serviceType = activity.reference_type || 'other'
          const adminAmt = Number(activity.metadata?.commission_breakdown?.adminAmount) || 0
          const driverAmt = Number(activity.metadata?.commission_breakdown?.driverAmount) || 0
          const totalAmt = Number(activity.amount) || 0

          acc[date] = acc[date] || {}
          acc[date][serviceType] = acc[date][serviceType] || { total_amount: 0, admin_commission: 0, driver_earnings: 0, transaction_count: 0 }
          acc[date][serviceType].total_amount += totalAmt
          acc[date][serviceType].admin_commission += adminAmt
          acc[date][serviceType].driver_earnings += driverAmt
          acc[date][serviceType].transaction_count += 1
          return acc
        }, {} as Record<string, any>)

        const summary: any[] = []
        for (const [date, services] of Object.entries(dailySummaryMap)) {
          for (const [service_type, data] of Object.entries(services as any)) {
            const s: any = data as any
            summary.push({
              date,
              service_type,
              total_amount: s.total_amount,
              admin_commission: s.admin_commission > 0 ? s.admin_commission : s.total_amount * 0.10,
              driver_earnings: s.driver_earnings > 0 ? s.driver_earnings : s.total_amount * 0.85,
              transaction_count: s.transaction_count,
            })
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              metrics: {
                totalRevenue,
                adminCommission,
                driverEarnings,
                platformFees,
                partnerCommission,
                transportRevenue,
                deliveryRevenue,
                activeDrivers,
                completedRides: (bookings.length || 0) + (deliveries.length || 0),
                revenueGrowth,
              },
              summary,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

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