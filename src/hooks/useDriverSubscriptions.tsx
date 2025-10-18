import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  duration_type: string
  price: number
  currency: string
  features: any
  max_rides_per_day: number
  priority_level: number
  is_active: boolean
}

interface DriverSubscription {
  id: string
  driver_id: string
  plan_id: string
  status: string
  start_date: string
  end_date: string
  auto_renew: boolean
  payment_method: string
  rides_remaining: number
  subscription_plans?: SubscriptionPlan
}

export const useDriverSubscriptions = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<DriverSubscription | null>(null)

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('priority_level', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les plans d'abonnement",
        variant: "destructive"
      })
    }
  }

  const fetchCurrentSubscription = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('driver_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('driver_id', user.id)
        .eq('status', 'active')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setCurrentSubscription(data)
    } catch (error) {
      console.error('Error fetching current subscription:', error)
    }
  }

  const subscribeToplan = async (planId: string, paymentMethod: string) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('subscription-manager', {
        body: {
          plan_id: planId,
          payment_method: paymentMethod,
          driver_id: user.id
        }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Abonnement Activé",
          description: "Votre abonnement a été activé avec succès!",
          variant: "default"
        })
        
        fetchCurrentSubscription()
        return { success: true }
      } else {
        throw new Error(data.error || 'Subscription failed')
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'activation de l'abonnement",
        variant: "destructive"
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const cancelSubscription = async () => {
    if (!currentSubscription || !user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('driver_subscriptions')
        .update({ 
          status: 'cancelled',
          auto_renew: false
        })
        .eq('id', currentSubscription.id)
        .eq('driver_id', user.id)

      if (error) throw error

      toast({
        title: "Abonnement Annulé",
        description: "Votre abonnement a été annulé",
        variant: "default"
      })

      fetchCurrentSubscription()
    } catch (error) {
      console.error('Cancel subscription error:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'annuler l'abonnement",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
    if (user) {
      fetchCurrentSubscription()
    }
  }, [user])

  return {
    loading,
    plans,
    currentSubscription,
    subscribeToplan,
    cancelSubscription,
    refreshSubscription: fetchCurrentSubscription
  }
}