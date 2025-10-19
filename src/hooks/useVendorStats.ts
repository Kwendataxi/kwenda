import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VendorStats {
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  escrowBalance: number;
  pendingEscrow: number;
}

const fetchVendorStats = async (): Promise<VendorStats> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // ✅ OPTIMISATION: Utiliser materialized view vendor_stats_mv
  const { data: statsArray, error } = await supabase
    .rpc('get_vendor_stats_optimized', { vendor_user_id: user.id }) as any;
  
  const stats = statsArray?.[0];

  if (error) {
    console.error('Error fetching vendor stats from MV:', error);
    // Fallback sur queries standards si MV échoue
    const [products, orders, escrow, merchantAccount] = await Promise.all([
      supabase.from('marketplace_products').select('*').eq('seller_id', user.id),
      supabase.from('marketplace_orders').select('*').eq('seller_id', user.id),
      supabase.from('escrow_transactions').select('*').eq('seller_id', user.id),
      supabase.from('merchant_accounts').select('*').eq('vendor_id', user.id).maybeSingle()
    ]);

    return {
      activeProducts: products.data?.filter(p => p.moderation_status === 'approved').length || 0,
      pendingProducts: products.data?.filter(p => p.moderation_status === 'pending').length || 0,
      totalOrders: orders.data?.length || 0,
      pendingOrders: orders.data?.filter(o => o.status === 'pending_seller_confirmation').length || 0,
      escrowBalance: merchantAccount.data?.balance || 0,
      pendingEscrow: escrow.data?.filter(e => e.status === 'held').reduce((sum, e) => sum + (e.seller_amount || 0), 0) || 0
    };
  }

  // Utiliser directement les données de la materialized view
  return {
    activeProducts: stats?.active_products || 0,
    pendingProducts: stats?.pending_products || 0,
    totalOrders: stats?.total_orders || 0,
    pendingOrders: stats?.pending_orders || 0,
    escrowBalance: stats?.escrow_balance || 0,
    pendingEscrow: stats?.pending_escrow || 0
  };
};

export const useVendorStats = () => {
  const { data: stats, isLoading: loading, refetch } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: fetchVendorStats,
    staleTime: 3 * 60 * 1000, // ✅ OPTIMISÉ: 3 minutes (sync avec cron MV)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // ✅ Désactivé car MV se refresh auto
    retry: 2
  });

  return { 
    stats: stats || {
      activeProducts: 0,
      pendingProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      escrowBalance: 0,
      pendingEscrow: 0
    }, 
    loading, 
    refetch 
  };
};
