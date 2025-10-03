import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'

interface DashboardOverview {
  total_users: number
  total_drivers: number
  active_subscriptions: number
  pending_support_tickets: number
  total_revenue: number
}

interface ZoneAnalytics {
  zone_name: string
  country_code: string
  city: string
  date: string
  total_rides: number
  total_revenue: number
  active_drivers: number
  average_wait_time: number
  customer_satisfaction: number
  peak_hours: any
}

interface AnalyticsDateRange {
  start: string
  end: string
}

export const useAdminAnalytics = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<{
    overview: DashboardOverview
    top_zones: any[]
    revenue_trend: any[]
  } | null>(null)

  const fetchDashboardAnalytics = async (dateRange?: AnalyticsDateRange) => {
    if (!user) {
      console.error('❌ User not authenticated for analytics')
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté en tant qu'admin",
        variant: "destructive"
      })
      return
    }

    // Vérifier si l'utilisateur est admin
    const { data: adminCheck, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    if (adminError || !adminCheck) {
      console.error('❌ User is not an admin:', adminError?.message)
      return
    }

    console.log('✅ Fetching dashboard analytics for admin:', user.id)
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: {
          type: 'dashboard',
          date_range: dateRange
        }
      })

      if (error) {
        console.error('🔴 Edge function error:', error)
        throw error
      }

      if (data.success) {
        console.log('✅ Dashboard analytics loaded successfully')
        setDashboardData(data.data)
      } else {
        console.error('🔴 Analytics response not successful:', data)
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error: any) {
      console.error('🔴 Error fetching dashboard analytics:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les analytics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchZoneAnalytics = async (filters?: {
    zone_name?: string
    country_code?: string
    date_range?: AnalyticsDateRange
  }) => {
    if (!user) {
      console.error('❌ User not authenticated for zone analytics')
      return []
    }

    console.log('✅ Fetching zone analytics...')
    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: {
          type: 'zones',
          ...filters
        }
      })

      if (error) {
        console.error('🔴 Zone analytics error:', error)
        throw error
      }

      if (data.success) {
        console.log('✅ Zone analytics loaded:', data.data?.length || 0, 'zones')
        return data.data as ZoneAnalytics[]
      }
      return []
    } catch (error: any) {
      console.error('🔴 Error fetching zone analytics:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les analytics de zones",
        variant: "destructive"
      })
      return []
    }
  }

  const fetchDriverAnalytics = async () => {
    if (!user) {
      console.error('❌ User not authenticated for driver analytics')
      return []
    }

    console.log('✅ Fetching driver analytics...')
    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: {
          type: 'drivers'
        }
      })

      if (error) {
        console.error('🔴 Driver analytics error:', error)
        throw error
      }

      if (data.success) {
        console.log('✅ Driver analytics loaded')
        return data.data
      }
      return []
    } catch (error: any) {
      console.error('🔴 Error fetching driver analytics:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les analytics des chauffeurs",
        variant: "destructive"
      })
      return []
    }
  }

  const fetchSubscriptionAnalytics = async (dateRange?: AnalyticsDateRange) => {
    if (!user) return []

    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: {
          type: 'subscriptions',
          date_range: dateRange
        }
      })

      if (error) throw error

      if (data.success) {
        return data.data
      }
      return []
    } catch (error: any) {
      console.error('Error fetching subscription analytics:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les analytics d'abonnements",
        variant: "destructive"
      })
      return []
    }
  }

  const fetchRevenueAnalytics = async (dateRange?: AnalyticsDateRange) => {
    if (!user) return null

    try {
      const { data, error } = await supabase.functions.invoke('admin-analytics', {
        body: {
          type: 'revenue',
          date_range: dateRange
        }
      })

      if (error) throw error

      if (data.success) {
        return data.data
      }
      return null
    } catch (error: any) {
      console.error('Error fetching revenue analytics:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les analytics de revenus",
        variant: "destructive"
      })
      return null
    }
  }

  const exportAnalytics = async (type: string, filters?: any) => {
    try {
      // This would typically generate a CSV or Excel file
      // For now, we'll just return the data
      let data = []
      
      switch (type) {
        case 'zones':
          data = await fetchZoneAnalytics(filters)
          break
        case 'drivers':
          data = await fetchDriverAnalytics()
          break
        case 'subscriptions':
          data = await fetchSubscriptionAnalytics(filters?.date_range)
          break
        case 'revenue':
          data = await fetchRevenueAnalytics(filters?.date_range)
          break
        default:
          throw new Error('Invalid export type')
      }

      // Convert to CSV
      if (data && data.length > 0) {
        const csvContent = convertToCSV(data)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `kwenda_${type}_analytics_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Export Réussi",
          description: `Analytics ${type} exportées avec succès`,
          variant: "default"
        })
      }
    } catch (error: any) {
      console.error('Export error:', error)
      toast({
        title: "Erreur d'Export",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      })
    }
  }

  const convertToCSV = (data: any[]) => {
    if (!data.length) return ''

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    )

    return [headers, ...rows].join('\n')
  }

  useEffect(() => {
    if (user) {
      fetchDashboardAnalytics()
    }
  }, [user])

  return {
    loading,
    dashboardData,
    fetchDashboardAnalytics,
    fetchZoneAnalytics,
    fetchDriverAnalytics,
    fetchSubscriptionAnalytics,
    fetchRevenueAnalytics,
    exportAnalytics
  }
}