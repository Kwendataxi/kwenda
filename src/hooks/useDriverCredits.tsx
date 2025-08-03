import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'

interface DriverCredits {
  id: string
  driver_id: string
  balance: number
  total_earned: number
  total_spent: number
  currency: string
  last_topup_date: string | null
  low_balance_alert_sent: boolean
  is_active: boolean
}

interface CreditTransaction {
  id: string
  driver_id: string
  transaction_type: string
  amount: number
  currency: string
  description: string
  reference_type: string | null
  reference_id: string | null
  balance_before: number
  balance_after: number
  created_at: string
}

export const useDriverCredits = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [credits, setCredits] = useState<DriverCredits | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])

  const fetchCredits = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.functions.invoke('credit-management', {
        body: {
          action: 'check',
          driver_id: user.id
        }
      })

      if (error) throw error
      
      if (data.success) {
        setCredits(data.credits)
        
        // Show low balance warning if needed
        if (data.low_balance && !data.credits.low_balance_alert_sent) {
          toast({
            title: "Solde Faible",
            description: "Votre solde de crédits est faible. Rechargez pour maintenir votre visibilité.",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    }
  }

  const fetchTransactions = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const topUpCredits = async (amount: number, paymentMethod: string) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('credit-management', {
        body: {
          action: 'topup',
          driver_id: user.id,
          amount,
          payment_method: paymentMethod,
          description: `Recharge de ${amount} CDF via ${paymentMethod}`
        }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Recharge Réussie",
          description: `Votre solde a été rechargé de ${amount} CDF`,
          variant: "default"
        })
        
        fetchCredits()
        fetchTransactions()
        return { success: true, new_balance: data.new_balance }
      } else {
        throw new Error(data.error || 'Topup failed')
      }
    } catch (error: any) {
      console.error('Credit topup error:', error)
      toast({
        title: "Erreur",
        description: error.message || "Échec de la recharge",
        variant: "destructive"
      })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const deductCredits = async (amount: number, referenceType: string, referenceId?: string, description?: string) => {
    if (!user) return { success: false, error: 'Not authenticated' }

    try {
      const { data, error } = await supabase.functions.invoke('credit-management', {
        body: {
          action: 'deduct',
          driver_id: user.id,
          amount,
          reference_type: referenceType,
          reference_id: referenceId,
          description: description || `Frais de ${referenceType}`
        }
      })

      if (error) throw error

      if (data.success) {
        fetchCredits()
        fetchTransactions()
        return { success: true, new_balance: data.new_balance }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error: any) {
      console.error('Credit deduction error:', error)
      return { success: false, error: error.message }
    }
  }

  const checkBalance = () => {
    return credits?.balance || 0
  }

  const hasBalance = (amount: number) => {
    return (credits?.balance || 0) >= amount
  }

  useEffect(() => {
    if (user) {
      fetchCredits()
      fetchTransactions()
    }
  }, [user])

  // Real-time subscription for credit updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('credit-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_credits',
          filter: `driver_id=eq.${user.id}`
        },
        () => {
          fetchCredits()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'credit_transactions',
          filter: `driver_id=eq.${user.id}`
        },
        () => {
          fetchTransactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return {
    loading,
    credits,
    transactions,
    topUpCredits,
    deductCredits,
    checkBalance,
    hasBalance,
    refreshCredits: fetchCredits,
    refreshTransactions: fetchTransactions
  }
}