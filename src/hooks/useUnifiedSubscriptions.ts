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

interface UseUnifiedSubscriptionsReturn {
  driverSubscriptions: any[];
  rentalSubscriptions: any[];
  stats: UnifiedSubscriptionStats | null;
  loading: boolean;
  extendSubscription: (subscriptionId: string, type: 'driver' | 'rental', days: number) => Promise<{ success: boolean; error?: string }>;
  cancelSubscriptionAdmin: (subscriptionId: string, type: 'driver' | 'rental') => Promise<{ success: boolean; error?: string }>;
  renewSubscription: (subscriptionId: string, type: 'driver' | 'rental') => Promise<{ success: boolean; error?: string }>;
}

export const useUnifiedSubscriptions = (): UseUnifiedSubscriptionsReturn => {
  const { toast } = useToast();

  // Fetch all subscriptions using the secure RPC function
  const { data: allSubscriptions = [], isLoading, error } = useQuery({
    queryKey: ['admin-unified-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_admin_subscriptions_unified');

      if (error) {
        console.error('Error fetching unified subscriptions:', error);
        throw error;
      }
      return (data || []) as any[];
    },
  });

  // Séparer les abonnements par type
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

    // Calculate monthly revenue
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
      currency: 'CDF'
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

  // Admin : Renouveler un abonnement
  const renewSubscription = async (
    subscriptionId: string, 
    type: 'driver' | 'rental'
  ) => {
    try {
      const table = type === 'driver' ? 'driver_subscriptions' : 'partner_rental_subscriptions';
      
      // Get current subscription
      const { data: current, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new dates
      const now = new Date();
      const planDuration = 30; // Default 30 days
      const newEndDate = new Date(now.getTime() + planDuration * 24 * 60 * 60 * 1000);

      // Create new subscription with correct fields per type
      const newSubscriptionData: any = {
        plan_id: current.plan_id,
        start_date: now.toISOString(),
        end_date: newEndDate.toISOString(),
        status: 'active',
        auto_renew: current.auto_renew,
        payment_method: current.payment_method || 'cash'
      };

      // Add type-specific fields
      if (type === 'driver') {
        newSubscriptionData.driver_id = (current as any).driver_id;
        newSubscriptionData.rides_remaining = (current as any).rides_remaining || 0;
        newSubscriptionData.service_type = (current as any).service_type || 'transport';
      } else {
        newSubscriptionData.partner_id = (current as any).partner_id;
        newSubscriptionData.vehicle_id = (current as any).vehicle_id;
      }

      const { data: newSub, error: createError } = await supabase
        .from(table)
        .insert(newSubscriptionData)
        .select()
        .single();

      if (createError) throw createError;

      // Mark old subscription as expired
      const { error: updateError } = await supabase
        .from(table)
        .update({ status: 'expired' })
        .eq('id', subscriptionId);

      if (updateError) throw updateError;

      toast({
        title: "Abonnement renouvelé",
        description: "Un nouvel abonnement a été créé avec succès",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du renouvellement",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    }
  };

  return {
    driverSubscriptions,
    rentalSubscriptions,
    stats,
    loading: isLoading,
    extendSubscription,
    cancelSubscriptionAdmin,
    renewSubscription,
  };
};
