import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'cancelled' | 'trialing' | 'none'
export type PlanType = 'pro' | 'advanced' | 'free'

interface Subscription {
  id: string
  status: SubscriptionStatus
  planType: PlanType
  billingCycle: 'monthly' | 'yearly' | 'none'
  endDate: string | null
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[useSubscription] Error fetching:', error)
      }

      if (data) {
        setSubscription({
          id: data.id,
          status: data.status as SubscriptionStatus,
          planType: (data.plan_name?.toLowerCase() || 'free') as PlanType,
          billingCycle: (data.billing_cycle || 'none') as 'monthly' | 'yearly' | 'none',
          endDate: data.ends_at
        })
      } else {
        setSubscription({
          id: 'free',
          status: 'none',
          planType: 'free',
          billingCycle: 'none',
          endDate: null
        })
      }
    } catch (err) {
      console.error('[useSubscription] Catch Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [user])

  const isPaid = subscription?.status === 'active' || subscription?.status === 'trialing'
  const isPro = isPaid && subscription?.planType === 'pro'
  const isAdvanced = isPaid && subscription?.planType === 'advanced'

  return {
    subscription,
    loading,
    isPaid,
    isPro,
    isAdvanced,
    refreshSubscription: fetchSubscription
  }
}
