import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'cancelled' | 'trialing' | 'none'
export type PlanType = 'free' | 'pro' | 'advanced'

interface Subscription {
  id: string
  status: SubscriptionStatus
  planType: PlanType
  billingCycle: 'monthly' | 'yearly' | 'none'
  startDate: string | null
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
        .maybeSingle()

      if (error) {
        console.error('[useSubscription] Error fetching:', error)
      }

      if (data) {
        const subData = data as any
        setSubscription({
          id: subData.id,
          status: subData.status as SubscriptionStatus,
          planType: (subData.plan_name?.toLowerCase() || 'free') as PlanType,
          billingCycle: (subData.billing_cycle || 'none') as 'monthly' | 'yearly' | 'none',
          startDate: subData.starts_at,
          endDate: subData.ends_at
        })
      } else {
        setSubscription({
          id: 'free',
          status: 'none',
          planType: 'free',
          billingCycle: 'none',
          startDate: null,
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
  const isFree = subscription?.planType === 'free' || !subscription
  const isPro = isPaid && subscription?.planType === 'pro'
  const isAdvanced = isPaid && subscription?.planType === 'advanced'

  return {
    subscription,
    loading,
    isPaid,
    isFree,
    isPro,
    isAdvanced,
    refreshSubscription: fetchSubscription
  }
}
