import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

interface UnifiedSubscriptionStats {
  totalActiveSubscriptions: number;
  monthlyRevenue: number;
  driverSubscriptions: number;
  rentalSubscriptions: number;
  expiringInWeek: number;
  failedPayments: number;
  currency: string;
}

interface DriverSubscriptionWithPlan {
  id: string;
  driver_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  payment_method: string;
  subscription_plans?: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
  chauffeurs?: {
    display_name: string;
    email: string;
  };
}

interface RentalSubscriptionWithDetails {
  id: string;
  partner_id: string;
  plan_id: string;
  vehicle_id: string;
  status: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  rental_subscription_plans?: {
    id: string;
    name: string;
    monthly_price: number;
    currency: string;
  };
  partenaires?: {
    company_name: string;
    email: string;
  };
  rental_vehicles?: {
    name: string;
    brand: string;
    model: string;
  };
}

interface UseUnifiedSubscriptionsReturn {
  driverSubscriptions: any[];
  rentalSubscriptions: any[];
  stats: UnifiedSubscriptionStats | null;
  loading: boolean;
  extendSubscription: (subscriptionId: string, type: 'driver' | 'rental', days: number) => Promise<{ success: boolean; error?: string }>;
  cancelSubscriptionAdmin: (subscriptionId: string, type: 'driver' | 'rental') => Promise<{ success: boolean; error?: string }>;
}

export const useUnifiedSubscriptions = (): UseUnifiedSubscriptionsReturn => {
  const { toast } = useToast();

  // Fetch all subscriptions using the secure RPC function
  const { data: allSubscriptions = [], isLoading, error } = useQuery({
    queryKey: ['admin-unified-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_subscriptions_unified');

      if (error) {
        console.error('Error fetching unified subscriptions:', error);
        throw error;
      }
      return (data || []) as any[];
    },
  });

  // Separate subscriptions by type
  const driverSubscriptions = useMemo(() => 
    allSubscriptions.filter(sub => sub.subscription_type === 'driver'),
    [allSubscriptions]
  );

  const rentalSubscriptions = useMemo(() => 
    allSubscriptions.filter(sub => sub.subscription_type === 'rental'),
    [allSubscriptions]
  );

  // Calculate unified statistics using useMemo for client-side computation
  const stats = useMemo((): UnifiedSubscriptionStats | null => {
    // Return null during loading to maintain same behavior as before
    if (isLoading) return null;

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Active driver subscriptions
    const activeDriverSubs = driverSubscriptions.filter(
      sub => sub.status === 'active' && new Date(sub.end_date) > now
    );

    // Active rental subscriptions
    const activeRentalSubs = rentalSubscriptions.filter(
      sub => sub.status === 'active' && new Date(sub.end_date) > now
    );

    // Calculate monthly revenue (using plan_price from RPC)
    const driverRevenue = activeDriverSubs.reduce(
      (sum, sub) => sum + (sub.plan_price || 0), 0
    );
    const rentalRevenue = activeRentalSubs.reduce(
      (sum, sub) => sum + (sub.plan_price || 0), 0
    );

    // Count expiring subscriptions
    const expiringDriver = activeDriverSubs.filter(
      sub => new Date(sub.end_date) <= weekFromNow
    ).length;
    const expiringRental = activeRentalSubs.filter(
      sub => new Date(sub.end_date) <= weekFromNow
    ).length;

    return {
      totalActiveSubscriptions: activeDriverSubs.length + activeRentalSubs.length,
      monthlyRevenue: driverRevenue + rentalRevenue,
      driverSubscriptions: activeDriverSubs.length,
      rentalSubscriptions: activeRentalSubs.length,
      expiringInWeek: expiringDriver + expiringRental,
      failedPayments: 0, // TODO: Calculate from payment history
      currency: driverSubscriptions[0]?.currency || rentalSubscriptions[0]?.currency || 'CDF'
    };
  }, [driverSubscriptions, rentalSubscriptions, isLoading]);

  // Admin actions
  // Admin : Prolonger un abonnement
  const extendSubscription = async (
    subscriptionId: string, 
    type: 'driver' | 'rental', 
    days: number
  ) => {
    try {
      const table = type === 'driver' ? 'driver_subscriptions' : 'partner_rental_subscriptions';
      
      // Get current subscription
      const { data: current, error: fetchError } = await supabase
        .from(table)
        .select('end_date')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new end date
      const currentEndDate = new Date(current.end_date);
      const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);

      // Update subscription
      const { error } = await supabase
        .from(table)
        .update({ end_date: newEndDate.toISOString() })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Abonnement prolongé",
        description: `Abonnement prolongé de ${days} jours`,
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la prolongation",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // Admin : Annuler un abonnement
  const cancelSubscriptionAdmin = async (
    subscriptionId: string, 
    type: 'driver' | 'rental'
  ) => {
    try {
      const table = type === 'driver' ? 'driver_subscriptions' : 'partner_rental_subscriptions';
      
      const { error } = await supabase
        .from(table)
        .update({ 
          status: 'cancelled',
          auto_renew: false
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Abonnement annulé",
        description: "L'abonnement a été annulé par l'administrateur",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'annulation",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  // Show error toast if query fails
  if (error) {
    toast({
      title: "Erreur de chargement",
      description: "Impossible de charger les abonnements",
      variant: "destructive"
    });
  }

  return {
    driverSubscriptions,
    rentalSubscriptions,
    stats,
    loading: isLoading,
    extendSubscription,
    cancelSubscriptionAdmin,
  };
};