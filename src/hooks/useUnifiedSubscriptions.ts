import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useUnifiedSubscriptions = () => {
  const { toast } = useToast();

  // Fetch all driver subscriptions for admin
  const { data: driverSubscriptions = [], isLoading: driverLoading } = useQuery({
    queryKey: ['admin-driver-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_subscriptions')
        .select(`
          *,
          subscription_plans (
            id, name, price, currency
          ),
          chauffeurs (
            display_name, email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Fetch all rental subscriptions for admin
  const { data: rentalSubscriptions = [], isLoading: rentalLoading } = useQuery({
    queryKey: ['admin-rental-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select(`
          *,
          rental_subscription_plans (
            id, name, monthly_price, currency
          ),
          partenaires (
            company_name, email
          ),
          rental_vehicles (
            name, brand, model
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Calculate unified statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['unified-subscription-stats'],
    queryFn: async (): Promise<UnifiedSubscriptionStats> => {
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
        (sum, sub) => sum + (sub.subscription_plans?.price || 0), 0
      );
      const rentalRevenue = activeRentalSubs.reduce(
        (sum, sub) => sum + (sub.rental_subscription_plans?.monthly_price || 0), 0
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
    },
    enabled: !driverLoading && !rentalLoading,
  });

  // Admin actions
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

  return {
    driverSubscriptions,
    rentalSubscriptions,
    stats,
    loading: driverLoading || rentalLoading || statsLoading,
    extendSubscription,
    cancelSubscriptionAdmin,
  };
};