import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionAccess {
  canAccessPOS: boolean;
  isPro: boolean;
  isPremium: boolean;
  isLoading: boolean;
  subscription: any | null;
  planName: string | null;
}

export const useSubscriptionAccess = (restaurantId: string | null) => {
  const [access, setAccess] = useState<SubscriptionAccess>({
    canAccessPOS: false,
    isPro: false,
    isPremium: false,
    isLoading: true,
    subscription: null,
    planName: null,
  });

  useEffect(() => {
    if (!restaurantId) {
      setAccess(prev => ({ ...prev, isLoading: false }));
      return;
    }

    checkSubscription();
  }, [restaurantId]);

  const checkSubscription = async () => {
    try {
      // Get active subscription with plan details
      const { data: subscription, error } = await supabase
        .from('restaurant_subscriptions')
        .select(`
          *,
          plan:restaurant_subscription_plans(*)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (subscription?.plan) {
        const priorityLevel = subscription.plan.priority_level || 0;
        const isPro = priorityLevel >= 1;
        const isPremium = priorityLevel >= 2;

        setAccess({
          canAccessPOS: isPro || isPremium,
          isPro,
          isPremium,
          isLoading: false,
          subscription,
          planName: subscription.plan.name,
        });
      } else {
        setAccess({
          canAccessPOS: false,
          isPro: false,
          isPremium: false,
          isLoading: false,
          subscription: null,
          planName: null,
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setAccess(prev => ({ ...prev, isLoading: false }));
    }
  };

  return access;
};
