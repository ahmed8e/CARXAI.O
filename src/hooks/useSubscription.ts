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
  const { user, subscriptionTier: profileTier } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isResolved, setIsResolved] = useState(false)

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      setIsResolved(true)
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
        // Fallback: Check the profiles tier we already have from AuthContext
        const tier = profileTier?.toLowerCase() || 'free'
        setSubscription({
          id: 'deferred',
          status: tier !== 'free' ? 'active' : 'none',
          planType: (tier === 'advanced' || tier === 'pro' ? tier : 'free') as PlanType,
          billingCycle: 'none',
          startDate: null,
          endDate: null
        })
      }
    } catch (err) {
      console.error('[useSubscription] Catch Error:', err)
    } finally {
      setLoading(false)
      setIsResolved(true)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [user])

  // Entitlement Resolution: A user is Paid if they have an active subscription record 
  // OR if their profile explicitly marks them as Pro/Advanced.
  const isPaid = (subscription?.status === 'active' || subscription?.status === 'trialing') && subscription?.planType !== 'free'
  
  // Strict Gating: isFree is ONLY true if we have finished loading and no paid state is found.
  const isFree = isResolved && !isPaid
  
  const isPro = isPaid && subscription?.planType === 'pro'
  const isAdvanced = isPaid && subscription?.planType === 'advanced'

  return {
    subscription,
    loading,
    isResolved,
    isPaid,
    isFree,
    isPro,
    isAdvanced,
    refreshSubscription: fetchSubscription
  }
}
