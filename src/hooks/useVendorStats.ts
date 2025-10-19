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
};

export const useVendorStats = () => {
  const { data: stats, isLoading: loading, refetch } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: fetchVendorStats,
    staleTime: 30000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
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
